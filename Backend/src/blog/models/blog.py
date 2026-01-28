from django.db import models
from django.core.cache import cache
from src.core.models.base import BaseModel
from src.blog.models.seo import SEOMixin
from src.blog.models.category import BlogCategory
from src.blog.models.tag import BlogTag
from src.blog.utils.cache import BlogCacheKeys, BlogCacheManager
from .managers import BlogQuerySet

class Blog(BaseModel, SEOMixin):
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
        help_text="Publication status of the blog post"
    )
    
    title = models.CharField(
        max_length=100,
        db_index=True,
        verbose_name="Title",
        help_text="Blog post title"
    )
    slug = models.SlugField(
        max_length=100,
        unique=True,
        db_index=True,
        allow_unicode=True,
        verbose_name="URL Slug",
        help_text="URL-friendly identifier for the blog post"
    )
    
    short_description = models.CharField(
        max_length=300,
        blank=True,
        verbose_name="Short Description",
        help_text="Brief summary of the blog post"
    )
    description = models.TextField(
        null=True,
        blank=True,
        verbose_name="Description",
        help_text="Full content of the blog post"
    )
    
    is_featured = models.BooleanField(
        default=False,
        db_index=True,
        verbose_name="Featured",
        help_text="Designates whether this blog post is featured"
    )
    is_public = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name="Public",
        help_text="Designates whether this blog post is publicly visible"
    )
    
    categories = models.ManyToManyField(
        'BlogCategory',
        blank=True,
        related_name='blog_categories',
        verbose_name="Categories",
        help_text="Categories associated with this blog post"
    )
    tags = models.ManyToManyField(
        'BlogTag',
        blank=True,
        related_name='blog_tags',
        verbose_name="Tags",
        help_text="Tags associated with this blog post"
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
    
    objects = BlogQuerySet.as_manager()

    class Meta(BaseModel.Meta, SEOMixin.Meta):
        db_table = 'blog_listings'
        verbose_name = "Blog"
        verbose_name_plural = "Blogs"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'is_public', '-created_at']),
            models.Index(fields=['is_featured', 'status', '-created_at']),
        ]

    def __str__(self):
        return self.title

    def get_absolute_url(self):
        return f"/blog/{self.slug}/"

    def get_public_url(self):
        return f"/blog/p/{self.public_id}/"
    
    def get_main_image(self):
        if hasattr(self, 'main_image_media') and self.main_image_media:
            return self.main_image_media[0].image if self.main_image_media[0].image else None
        
        if hasattr(self, 'all_images'):
            all_images = getattr(self, 'all_images', [])
            main_images = [m for m in all_images if m.is_main]
            if main_images and len(main_images) > 0:
                return main_images[0].image if main_images[0].image else None
            return None
        
        from src.blog.services.admin.media_services import BlogAdminMediaService
        return BlogAdminMediaService.get_main_image_for_model(self)
    
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
        cache_key = BlogCacheKeys.structured_data(self.pk)
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
            relative_url = self.get_public_url()
            self.canonical_url = None
        
        super().save(*args, **kwargs)
        
        if self.pk:
            BlogCacheManager.invalidate_blog(self.pk)
    
    def delete(self, *args, **kwargs):
        blog_id = self.pk
        super().delete(*args, **kwargs)
        if blog_id:
            BlogCacheManager.invalidate_blog(blog_id)
