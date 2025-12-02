from django.db import models
from django.core.cache import cache
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
    )
    
    # Core fields with proper indexing
    status = models.CharField(
        choices=STATUS_CHOICES, default='draft', max_length=20,
        db_index=True
    )
    title = models.CharField(max_length=60, db_index=True)
    slug = models.SlugField(max_length=60, unique=True, db_index=True, allow_unicode=True)
    short_description = models.CharField(max_length=300, blank=True)
    description = models.TextField(null=True, blank=True)
    
    # Boolean fields
    is_featured = models.BooleanField(default=False, db_index=True)
    is_public = models.BooleanField(default=True, db_index=True)
    
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
    
    # Portfolio Options
    options = models.ManyToManyField(
        'PortfolioOption',
        blank=True,
        related_name="portfolio_options"
    )
    
    # Custom manager
    objects = PortfolioQuerySet.as_manager()

    class Meta(BaseModel.Meta, SEOMixin.Meta):
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
        if hasattr(self, 'all_images'):
            all_images = getattr(self, 'all_images', [])
            main_images = [m for m in all_images if m.is_main]
            if main_images and len(main_images) > 0:
                return main_images[0].image if main_images[0].image else None
            return None
        
        cache_key = PortfolioCacheKeys.main_image(self.pk)
        main_image = cache.get(cache_key)
        
        if main_image is None:
            try:
                # First try to get main image from PortfolioImage
                main_media = self.images.select_related('image').filter(is_main=True).first()
                if main_media:
                    main_image = main_media.image
                else:
                    # If no main image, try to get cover image from first video
                    video = self.videos.select_related('video__cover_image').first()
                    if video and video.video.cover_image:
                        main_image = video.video.cover_image
                    else:
                        # If no video cover, try to get cover image from first audio
                        audio = self.audios.select_related('audio__cover_image').first()
                        if audio and audio.audio.cover_image:
                            main_image = audio.audio.cover_image
                        else:
                            # If no audio cover, try to get cover image from first document
                            document = self.documents.select_related('document__cover_image').first()
                            if document and document.document.cover_image:
                                main_image = document.document.cover_image
            except Exception:
                main_image = False  # Cache negative result too
            
            # Cache for 1 hour but with a more specific timeout
            cache.set(cache_key, main_image, 1800)  # 30 minutes cache
        
        return main_image if main_image else None
    
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
        
        # Fallback to model method (uses cache)
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
        """Override SEOMixin to provide portfolio-specific structured data with caching"""
        from src.portfolio.utils.cache import PortfolioCacheKeys
        cache_key = PortfolioCacheKeys.structured_data(self.pk)
        structured_data = cache.get(cache_key)
        
        if structured_data is None:
            main_image = self.get_main_image()
            
            # Get tags and categories with limits
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
