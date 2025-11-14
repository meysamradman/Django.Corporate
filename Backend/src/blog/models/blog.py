from django.db import models
from django.core.cache import cache
from src.core.models.base import BaseModel
from src.blog.models.seo import SEOMixin
from src.blog.models.category import BlogCategory
from src.blog.models.tag import BlogTag
from .managers import BlogQuerySet


class Blog(BaseModel, SEOMixin):
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
    slug = models.SlugField(max_length=60, unique=True, db_index=True, allow_unicode=True)
    short_description = models.CharField(max_length=300, blank=True)
    description = models.TextField(null=True, blank=True)
    
    # Boolean fields
    is_featured = models.BooleanField(default=False, db_index=True)  # برای فیلتر
    is_public = models.BooleanField(default=True, db_index=True)  # برای فیلتر
    
    # Relations - بدون through برای بهتر شدن performance
    categories = models.ManyToManyField(
        'BlogCategory',
        blank=True,
        related_name="blog_categories"
    )
    tags = models.ManyToManyField(
        'BlogTag',
        blank=True,
        related_name="blog_tags"
    )
    
    # Custom manager
    objects = BlogQuerySet.as_manager()

    class Meta(BaseModel.Meta, SEOMixin.Meta):
        db_table = 'blog_listings'
        verbose_name = "Blog"
        verbose_name_plural = "Blog"
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
        return f"/blog/{self.slug}/"

    def get_public_url(self):
        return f"/blog/p/{self.public_id}/"
    
    def get_main_image(self):
        """Get main image with caching and optimized query"""
        # First check if we have prefetched data
        if hasattr(self, 'all_images'):
            # Use prefetched data if available
            all_images = getattr(self, 'all_images', [])
            # Filter for main image
            main_images = [m for m in all_images if m.is_main]
            if main_images and len(main_images) > 0:
                return main_images[0].image if main_images[0].image else None
            return None
        
        # Fallback to cache/database query
        cache_key = f"blog_main_image_{self.pk}"
        main_image = cache.get(cache_key)
        
        if main_image is None:
            try:
                # First try to get main image from BlogImage
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
        """Get main media of any type (image, video cover, audio cover, etc.)"""
        # Try to get main image first
        main_image = self.get_main_image()
        if main_image:
            return main_image, 'image'
        
        # Fallback to first video's cover
        try:
            video = self.videos.select_related('video__cover_image').first()
            if video and video.video.cover_image:
                return video.video.cover_image, 'cover'
        except Exception:
            pass
        
        # Fallback to first audio's cover
        try:
            audio = self.audios.select_related('audio__cover_image').first()
            if audio and audio.audio.cover_image:
                return audio.audio.cover_image, 'cover'
        except Exception:
            pass
        
        # Fallback to first document's cover
        try:
            document = self.documents.select_related('document__cover_image').first()
            if document and document.document.cover_image:
                return document.document.cover_image, 'cover'
        except Exception:
            pass
        
        return None, None
    
    def get_main_image_details(self):
        """Get main image details for API responses - optimized with prefetch support"""
        # Try to use prefetched data first (from for_admin_listing or for_detail queryset)
        if hasattr(self, 'all_images'):
            all_images = self.all_images
            # Find main image from prefetched data (O(n) but cached)
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
        """Override SEOMixin to provide blog-specific structured data with caching"""
        from src.blog.utils.cache import BlogCacheKeys
        cache_key = BlogCacheKeys.structured_data(self.pk)
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
                    "name": "Your Company Name"  # This should come from settings
                },
                "keywords": tags,
                "about": categories
            }
            
            # Cache for 30 minutes
            cache.set(cache_key, structured_data, 1800)
        
        return structured_data
    
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
            # We need to make sure it's a full URL, not just a relative path
            relative_url = self.get_public_url()
            # For now, we'll just set it to None to let the SEO mixin handle it properly
            # In production, you might want to prepend your site's domain
            self.canonical_url = None
        
        super().save(*args, **kwargs)
        
        # Clear related caches using standardized keys
        from src.blog.utils.cache import BlogCacheManager
        BlogCacheManager.invalidate_blog(self.pk)
