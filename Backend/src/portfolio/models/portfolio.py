from django.db import models
from django.core.cache import cache
from src.core.models.base import BaseModel
from src.portfolio.models.seo import SEOMixin
from src.portfolio.models.category import PortfolioCategory
from src.portfolio.models.tag import PortfolioTag
from .managers import PortfolioQuerySet


class Portfolio(BaseModel, SEOMixin):
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('published', 'Published'),
    )
    
    # Core fields with proper indexing
    status = models.CharField(
        choices=STATUS_CHOICES, default='draft', max_length=20,
        db_index=True  # برای فیلتر کردن
    )
    title = models.CharField(max_length=60, db_index=True)  # برای جستجو
    slug = models.SlugField(max_length=60, unique=True, db_index=True)
    short_description = models.CharField(max_length=300, blank=True)
    description = models.TextField(null=True, blank=True)
    
    # Boolean fields
    is_featured = models.BooleanField(default=False, db_index=True)  # برای فیلتر
    is_public = models.BooleanField(default=True, db_index=True)  # برای فیلتر
    
    # Relations - بدون through برای بهتر شدن performance
    categories = models.ManyToManyField(
        'PortfolioCategory',
        blank=True,
        related_name="portfolio_categories"
    )
    tags = models.ManyToManyField(
        'PortfolioTag', 
        blank=True,
        related_name="portfolio_tags"
    )
    
    # Custom manager
    objects = PortfolioQuerySet.as_manager()

    class Meta:
        db_table = 'portfolio_listings'
        verbose_name = "Portfolio"
        verbose_name_plural = "Portfolio"
        # Optimized indexes
        indexes = [
            models.Index(fields=['status', 'is_public']),  # Combined index
            models.Index(fields=['title']),
            models.Index(fields=['slug']),
            models.Index(fields=['public_id']),
            models.Index(fields=['is_featured', 'status']),  # Combined index
            models.Index(fields=['created_at']),  # For ordering
            models.Index(fields=['meta_title']),  # SEO search
        ]
        # Default ordering
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    def get_absolute_url(self):
        return f"/portfolio/{self.slug}/"

    def get_public_url(self):
        return f"/portfolio/p/{self.public_id}/"
    
    def get_main_image(self):
        """Get main image with caching"""
        cache_key = f"portfolio_main_image_{self.pk}"
        main_image = cache.get(cache_key)
        
        if main_image is None:
            try:
                # Use the correct relationship - images from PortfolioImage model
                main_media = self.images.select_related('image').filter(is_main=True).first()
                main_image = main_media.image if main_media else None
            except Exception:
                main_image = False  # Cache negative result too
            
            cache.set(cache_key, main_image, 3600)  # 1 hour cache
        
        return main_image if main_image else None
    
    def generate_structured_data(self):
        """Override SEOMixin to provide portfolio-specific structured data"""
        main_image = self.get_main_image()
        
        return {
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
                "name": "Your Company Name"  # This should come from settings
            },
            "keywords": [tag.name for tag in self.tags.all()[:5]],  # Limit to 5 tags
            "about": [category.name for category in self.categories.all()[:3]]  # Limit to 3 categories
        }
    
    def save(self, *args, **kwargs):
        # Auto-generate SEO fields efficiently
        if not self.meta_title and self.title:
            self.meta_title = self.title[:70]
        
        if not self.meta_description and self.short_description:
            self.meta_description = self.short_description[:300]
        
        if not self.og_title and self.meta_title:
            self.og_title = self.meta_title
        
        if not self.og_description and self.meta_description:
            self.og_description = self.meta_description
        
        # Only auto-generate canonical_url if it's not already set and we have a slug
        # And ensure it's a valid URL format (not just a relative path)
        if not self.canonical_url and self.slug:
            # Let the model's get_absolute_url or get_public_url handle this properly
            self.canonical_url = self.get_public_url()
        
        super().save(*args, **kwargs)
        
        # Clear related caches
        cache.delete(f"portfolio_main_image_{self.pk}")
        cache.delete(f"portfolio_schema_{self.pk}")  # Clear schema cache on save