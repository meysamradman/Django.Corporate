from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.postgres.indexes import GinIndex, BrinIndex
from django.contrib.postgres.search import SearchVectorField
from src.core.models import BaseModel
from src.store.models.seo import SEOMixin
from src.store.models.category import ProductCategory
from src.store.models.tag import ProductTag
from src.store.utils.cache import ProductCacheKeys, ProductCacheManager
from .managers import ProductQuerySet


class Product(BaseModel, SEOMixin):
    
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('published', 'Published'),
        ('archived', 'Archived'),
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='draft',
        db_index=True,
        verbose_name="Status",
        help_text="Publication status of the product"
    )
    
    title = models.CharField(
        max_length=200,
        db_index=True,
        verbose_name="Title",
        help_text="Product title"
    )
    slug = models.SlugField(
        max_length=200,
        unique=True,
        db_index=True,
        allow_unicode=True,
        verbose_name="URL Slug",
        help_text="URL-friendly identifier"
    )
    short_description = models.CharField(
        max_length=300,
        blank=True,
        verbose_name="Short Description",
        help_text="Brief summary of the product"
    )
    description = models.TextField(
        verbose_name="Description",
        help_text="Full product description"
    )
    
    sku = models.CharField(
        max_length=100,
        unique=True,
        db_index=True,
        verbose_name="SKU",
        help_text="Stock Keeping Unit - unique product identifier"
    )
    
    category = models.ForeignKey(
        ProductCategory,
        on_delete=models.PROTECT,
        related_name='products',
        db_index=True,
        verbose_name="Category",
        help_text="Product category"
    )
    tags = models.ManyToManyField(
        ProductTag,
        blank=True,
        related_name='products',
        verbose_name="Tags",
        help_text="Tags associated with this product"
    )
    
    price = models.BigIntegerField(
        db_index=True,
        verbose_name="Price",
        help_text="Product price (in smallest currency unit)"
    )
    sale_price = models.BigIntegerField(
        null=True,
        blank=True,
        db_index=True,
        verbose_name="Sale Price",
        help_text="Sale price (in smallest currency unit)"
    )
    currency = models.CharField(
        max_length=3,
        default='USD',
        db_index=True,
        verbose_name="Currency",
        help_text="Currency code (USD, EUR, etc.)"
    )
    
    stock_quantity = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        db_index=True,
        verbose_name="Stock Quantity",
        help_text="Available stock quantity"
    )
    manage_stock = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name="Manage Stock",
        help_text="Whether to track stock for this product"
    )
    
    weight = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        verbose_name="Weight",
        help_text="Product weight in kg"
    )
    length = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        verbose_name="Length",
        help_text="Product length in cm"
    )
    width = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        verbose_name="Width",
        help_text="Product width in cm"
    )
    height = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        verbose_name="Height",
        help_text="Product height in cm"
    )
    
    is_featured = models.BooleanField(
        default=False,
        db_index=True,
        verbose_name="Featured",
        help_text="Whether product is featured"
    )
    is_public = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name="Public",
        help_text="Designates whether this product is publicly visible"
    )
    published_at = models.DateTimeField(
        null=True,
        blank=True,
        db_index=True,
        verbose_name="Published At",
        help_text="Date and time when product was published"
    )
    
    views_count = models.IntegerField(
        default=0,
        db_index=True,
        verbose_name="Views Count",
        help_text="Total number of views"
    )
    sales_count = models.IntegerField(
        default=0,
        db_index=True,
        verbose_name="Sales Count",
        help_text="Total number of sales"
    )
    
    search_vector = SearchVectorField(
        null=True,
        blank=True,
        verbose_name="Search Vector",
        help_text="Full-text search vector (PostgreSQL)"
    )
    
    objects = ProductQuerySet.as_manager()
    
    class Meta(BaseModel.Meta, SEOMixin.Meta):
        db_table = 'store_products'
        verbose_name = 'Product'
        verbose_name_plural = 'Products'
        ordering = ['-is_featured', '-published_at', '-created_at']
        indexes = [
            models.Index(fields=['status', 'is_public', 'category', '-price']),
            models.Index(fields=['status', 'is_public', '-published_at']),
            models.Index(fields=['status', 'is_public', 'is_featured', '-views_count']),
            models.Index(fields=['category', 'status', 'is_public']),
            models.Index(fields=['status', 'is_public', 'price']),
            models.Index(fields=['status', 'is_public', 'sale_price']),
            models.Index(fields=['sku']),
            models.Index(fields=['stock_quantity', 'manage_stock']),
            GinIndex(fields=['search_vector']),
            BrinIndex(fields=['created_at', 'updated_at']),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(price__gte=0),
                name='product_price_non_negative'
            ),
            models.CheckConstraint(
                check=models.Q(stock_quantity__gte=0),
                name='product_stock_non_negative'
            ),
        ]
    
    def __str__(self):
        return self.title
    
    def get_public_url(self):
        return f"/product/{self.slug}/"
    
    @property
    def is_published(self):
        return self.status == 'published'
    
    @property
    def is_in_stock(self):
        if not self.manage_stock:
            return True
        return self.stock_quantity > 0
    
    @property
    def current_price(self):
        return self.sale_price if self.sale_price else self.price
    
    @property
    def has_discount(self):
        return self.sale_price is not None and self.sale_price < self.price
    
    @property
    def discount_percentage(self):
        if not self.has_discount:
            return 0
        return int(((self.price - self.sale_price) / self.price) * 100)
    
    def get_main_image(self):
        if hasattr(self, 'all_images'):
            all_images = getattr(self, 'all_images', [])
            main_images = [m for m in all_images if m.is_main]
            if main_images and len(main_images) > 0:
                return main_images[0].image if main_images[0].image else None
            return None
        
        from django.core.cache import cache
        cache_key = ProductCacheKeys.main_image(self.pk)
        main_image = cache.get(cache_key)
        
        if main_image is None:
            try:
                main_media = self.images.select_related('image').filter(is_main=True).first()
                if main_media:
                    main_image = main_media.image
                else:
                    video = self.videos.select_related('video__cover_image').first()
                    if video and video.video.cover_image:
                        main_image = video.video.cover_image
                    else:
                        audio = self.audios.select_related('audio__cover_image').first()
                        if audio and audio.audio.cover_image:
                            main_image = audio.audio.cover_image
                        else:
                            document = self.documents.select_related('document__cover_image').first()
                            if document and document.document.cover_image:
                                main_image = document.document.cover_image
            except Exception:
                main_image = False
            
            cache.set(cache_key, main_image, 1800)
        
        return main_image if main_image else None
    
    def get_main_image_details(self):
        main_image = self.get_main_image()
        if main_image and main_image.file:
            file_url = main_image.file.url if main_image.file else None
            return {
                'id': main_image.id,
                'url': file_url,
                'file_url': file_url,
                'title': main_image.title,
                'alt_text': main_image.alt_text
            }
        return None
    
    def generate_structured_data(self):
        from django.core.cache import cache
        
        cache_key = ProductCacheKeys.structured_data(self.pk)
        structured_data = cache.get(cache_key)
        
        if structured_data is None:
            main_image = self.get_main_image()
            
            tags = list(self.tags.values_list('title', flat=True)[:5])
            
            structured_data = {
                "@context": "https://schema.org",
                "@type": "Product",
                "name": self.get_meta_title(),
                "description": self.get_meta_description(),
                "url": self.get_public_url(),
                "image": main_image.file.url if main_image and main_image.file else None,
                "sku": self.sku,
                "offers": {
                    "@type": "Offer",
                    "price": float(self.current_price),
                    "priceCurrency": self.currency,
                    "availability": "https://schema.org/InStock" if self.is_in_stock else "https://schema.org/OutOfStock",
                },
                "brand": {
                    "@type": "Brand",
                    "name": "Store"
                },
                "keywords": tags,
            }
            
            cache.set(cache_key, structured_data, 1800)
        
        return structured_data
    
    def save(self, *args, **kwargs):
        if not self.meta_title and self.title:
            self.meta_title = self.title[:70]
        
        if not self.meta_description:
            if self.short_description:
                self.meta_description = self.short_description[:300]
            elif self.description:
                self.meta_description = self.description[:300]
        
        if not self.og_title and self.meta_title:
            self.og_title = self.meta_title
        
        if not self.og_description and self.meta_description:
            self.og_description = self.meta_description
        
        if self.status == 'published' and not self.published_at:
            from django.utils import timezone
            self.published_at = timezone.now()
        
        super().save(*args, **kwargs)
        
        if self.pk:
            ProductCacheManager.invalidate_product(self.pk)
            ProductCacheManager.invalidate_list()
    
    def delete(self, *args, **kwargs):
        product_id = self.pk
        super().delete(*args, **kwargs)
        if product_id:
            ProductCacheManager.invalidate_product(product_id)
            ProductCacheManager.invalidate_list()
