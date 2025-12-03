from django.db import models
from src.core.models import BaseModel
from src.blog.models.seo import SEOMixin
from src.blog.utils.cache import TagCacheManager
from src.statistics.utils.cache import StatisticsCacheManager
from .managers import BlogTagQuerySet

class BlogTag(BaseModel, SEOMixin):
    name = models.CharField(max_length=20, unique=True, db_index=True)
    slug = models.SlugField(max_length=60, unique=True, db_index=True, allow_unicode=True)
    description = models.TextField(null=True, blank=True)
    is_public = models.BooleanField(default=True, db_index=True)
    
    objects = BlogTagQuerySet.as_manager()

    def get_public_url(self):
        return f"/tag/{self.public_id}/"

    class Meta:
        db_table = 'blog_tags'
        verbose_name = "Blog Tag"
        verbose_name_plural = "Blog Tags"
        indexes = [
            models.Index(fields=["name"]),
            models.Index(fields=["slug"]),
            models.Index(fields=["public_id"]),
            models.Index(fields=["is_public"]),
            models.Index(fields=["meta_title"]),
        ]

    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        if not self.meta_title and self.name:
            self.meta_title = self.name[:70]
        
        if not self.meta_description and self.description:
            self.meta_description = self.description[:300]
            
        super().save(*args, **kwargs)
        
        if self.pk:
            TagCacheManager.invalidate_tag(self.pk)
        StatisticsCacheManager.invalidate_dashboard()
    
    def delete(self, *args, **kwargs):
        tag_id = self.pk
        super().delete(*args, **kwargs)
        if tag_id:
            TagCacheManager.invalidate_tag(tag_id)
        StatisticsCacheManager.invalidate_dashboard()
    
    def generate_structured_data(self):
        return {
            "@context": "https://schema.org",
            "@type": "Thing",
            "name": self.get_meta_title(),
            "description": self.get_meta_description(),
            "url": self.get_public_url(),
        }
