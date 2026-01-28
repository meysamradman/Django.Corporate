from django.db import models
from django.core.cache import cache
from django.contrib.postgres.indexes import GinIndex
from src.core.models.base import BaseModel
from src.portfolio.models.seo import SEOMixin
from src.portfolio.models.category import PortfolioCategory
from src.portfolio.models.tag import PortfolioTag
from src.portfolio.utils.cache import PortfolioCacheKeys, PortfolioCacheManager
from .managers import PortfolioQuerySet

class Portfolio(BaseModel, SEOMixin):
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
        help_text="Publication status of the portfolio item"
    )
    
    title = models.CharField(
        max_length=100,
        db_index=True,
        verbose_name="Title",
        help_text="Portfolio item title"
    )
    slug = models.SlugField(
        max_length=100,
        unique=True,
        db_index=True,
        allow_unicode=True,
        verbose_name="URL Slug",
        help_text="URL-friendly identifier for the portfolio item"
    )
    
    short_description = models.CharField(
        max_length=300,
        blank=True,
        verbose_name="Short Description",
        help_text="Brief summary of the portfolio item"
    )
    description = models.TextField(
        null=True,
        blank=True,
        verbose_name="Description",
        help_text="Full content of the portfolio item"
    )
    
    is_featured = models.BooleanField(
        default=False,
        db_index=True,
        verbose_name="Featured",
        help_text="Designates whether this portfolio item is featured"
    )
    is_public = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name="Public",
        help_text="Designates whether this portfolio item is publicly visible"
    )
    
    categories = models.ManyToManyField(
        'PortfolioCategory',
        blank=True,
        related_name='portfolio_categories',
        verbose_name="Categories",
        help_text="Categories associated with this portfolio item"
    )
    tags = models.ManyToManyField(
        'PortfolioTag',
        blank=True,
        related_name='portfolio_tags',
        verbose_name="Tags",
        help_text="Tags associated with this portfolio item"
    )
    options = models.ManyToManyField(
        'PortfolioOption',
        blank=True,
        related_name='portfolio_options',
        verbose_name="Options",
        help_text="Options associated with this portfolio item"
    )
    
    extra_attributes = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Extra Attributes",
        help_text="Flexible attributes for custom fields (price, brand, specifications, etc.)"
    )
    
    views_count = models.PositiveIntegerField(
        default=0,
        db_index=True,
        verbose_name="Total Views",
        help_text="Total number of views (Web + App)"
    )
    web_views_count = models.PositiveIntegerField(
        default=0,
        verbose_name="Web Views",
        help_text="Number of views from the website"
    )
    app_views_count = models.PositiveIntegerField(
        default=0,
        verbose_name="App Views",
        help_text="Number of views from the application"
    )
    favorites_count = models.PositiveIntegerField(
        default=0,
        verbose_name="Favorites Count",
        help_text="Total number of favorites"
    )
    
    objects = PortfolioQuerySet.as_manager()

    class Meta(BaseModel.Meta, SEOMixin.Meta):
        db_table = 'portfolio_listings'
        verbose_name = "Portfolio"
        verbose_name_plural = "Portfolios"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'is_public', '-created_at']),
            models.Index(fields=['is_featured', 'status', '-created_at']),
            GinIndex(fields=['extra_attributes'], name='idx_portfolio_gin_extra_attrs'),
        ]

    def __str__(self):
        return self.title

    def get_absolute_url(self):
        return f"/portfolio/{self.slug}/"

    def get_public_url(self):
        return f"/portfolio/p/{self.public_id}/"
    
    def get_main_image(self):
        if hasattr(self, 'main_image_media') and self.main_image_media:
            return self.main_image_media[0].image if self.main_image_media[0].image else None
        
        if hasattr(self, 'all_images'):
            all_images = getattr(self, 'all_images', [])
            main_images = [m for m in all_images if m.is_main]
            if main_images and len(main_images) > 0:
                return main_images[0].image if main_images[0].image else None
            return None
        
        from src.portfolio.services.admin.media_services import PortfolioAdminMediaService
        return PortfolioAdminMediaService.get_main_image_for_model(self)
    
    def get_main_media(self):
        main_image = self.get_main_image()
        if main_image:
            return main_image, 'image'
        
        try:
            video = self.videos.select_related('video__cover_image').first()
            if video and video.video.cover_image:
                return video.video.cover_image, 'cover'
        except Exception:
            pass
        
        try:
            audio = self.audios.select_related('audio__cover_image').first()
            if audio and audio.audio.cover_image:
                return audio.audio.cover_image, 'cover'
        except Exception:
            pass
        
        try:
            document = self.documents.select_related('document__cover_image').first()
            if document and document.document.cover_image:
                return document.document.cover_image, 'cover'
        except Exception:
            pass
        
        return None, None
    
    def get_main_image_details(self):
        if hasattr(self, 'all_images'):
            all_images = self.all_images
            for img in all_images:
                if img.is_main and img.image:
                    main_image = img.image
                    file_url = main_image.file.url if main_image.file else None
                    return {
                        'id': main_image.id,
                        'url': file_url,
                        'file_url': file_url,
                        'title': main_image.title,
                        'alt_text': main_image.alt_text
                    }
        
        main_image = self.get_main_image()
        if main_image:
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
        cache_key = PortfolioCacheKeys.structured_data(self.pk)
        structured_data = cache.get(cache_key)
        
        if structured_data is None:
            main_image = self.get_main_image()
            
            tags = list(self.tags.values_list('name', flat=True)[:5])
            categories = list(self.categories.values_list('name', flat=True)[:3])
            
            structured_data = {
                "@context": "https://schema.org",
                "@type": "CreativeWork",
                "name": self.get_meta_title(),
                "description": self.get_meta_description(),
                "url": self.get_public_url(),
                "image": main_image.file.url if main_image else None,
                "dateCreated": self.created_at.isoformat() if self.created_at else None,
                "dateModified": self.updated_at.isoformat() if self.updated_at else None,
                "creator": {
                    "@type": "Organization",
                    "name": "Your Company Name"
                },
                "keywords": tags,
                "about": categories
            }
            
            cache.set(cache_key, structured_data, 1800)
        
        return structured_data
    
    def save(self, *args, **kwargs):
        if not self.meta_title and self.title:
            self.meta_title = self.title[:70]
        
        if not self.meta_description and self.short_description:
            self.meta_description = self.short_description[:300]
        
        if not self.og_title and self.meta_title:
            self.og_title = self.meta_title
        
        if not self.og_description and self.meta_description:
            self.og_description = self.meta_description
        
        if not self.canonical_url and self.slug:
            self.canonical_url = None
        
        super().save(*args, **kwargs)
        
        if self.pk:
            PortfolioCacheManager.invalidate_portfolio(self.pk)
    
    def delete(self, *args, **kwargs):
        portfolio_id = self.pk
        super().delete(*args, **kwargs)
        if portfolio_id:
            PortfolioCacheManager.invalidate_portfolio(portfolio_id)
