from django.db import models
from src.core.models import BaseModel
from src.store.models.seo import SEOMixin
from src.store.utils.cache import ProductTagCacheManager
from src.statistics.utils.cache import StatisticsCacheManager
from .managers import ProductTagQuerySet


class ProductTag(BaseModel, SEOMixin):
    title = models.CharField(
        max_length=100,
        unique=True,
        db_index=True,
        verbose_name="Title",
        help_text="Tag title"
    )
    slug = models.SlugField(
        max_length=100,
        unique=True,
        db_index=True,
        allow_unicode=True,
        verbose_name="URL Slug",
        help_text="URL-friendly identifier for the tag"
    )
    description = models.TextField(
        null=True,
        blank=True,
        verbose_name="Description",
        help_text="Tag description"
    )
    is_public = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name="Public",
        help_text="Designates whether this tag is publicly visible"
    )
    
    objects = ProductTagQuerySet.as_manager()
    
    class Meta(BaseModel.Meta, SEOMixin.Meta):
        db_table = 'store_tags'
        verbose_name = 'Product Tag'
        verbose_name_plural = 'Product Tags'
        ordering = ['title']
        indexes = [
            models.Index(fields=['is_public', 'title']),
        ]
    
    def __str__(self):
        return self.title
    
    def get_public_url(self):
        return f"/store-tag/{self.public_id}/"
    
    def save(self, *args, **kwargs):
        if not self.meta_title and self.title:
            self.meta_title = self.title[:70]
        
        if not self.meta_description and self.description:
            self.meta_description = self.description[:300]
        
        super().save(*args, **kwargs)
        
        if self.pk:
            ProductTagCacheManager.invalidate_tag(self.pk)
        StatisticsCacheManager.invalidate_dashboard()
    
    def delete(self, *args, **kwargs):
        tag_id = self.pk
        super().delete(*args, **kwargs)
        if tag_id:
            ProductTagCacheManager.invalidate_tag(tag_id)
        StatisticsCacheManager.invalidate_dashboard()
    
    def generate_structured_data(self):
        return {
            "@context": "https://schema.org",
            "@type": "Thing",
            "name": self.get_meta_title(),
            "description": self.get_meta_description(),
            "url": self.get_public_url(),
        }
