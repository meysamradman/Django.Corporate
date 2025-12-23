from django.db import models
from src.core.models import BaseModel
from src.real_estate.models.seo import SEOMixin
from src.real_estate.models.managers import PropertyTagQuerySet


class PropertyTag(BaseModel, SEOMixin):
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
    
    objects = PropertyTagQuerySet.as_manager()
    
    class Meta(BaseModel.Meta, SEOMixin.Meta):
        db_table = 'real_estate_property_tags'
        verbose_name = 'Property Tag'
        verbose_name_plural = 'Property Tags'
        ordering = ['title']
        indexes = [
            models.Index(fields=['is_public', 'is_active', 'title']),
            models.Index(fields=['slug']),
        ]
    
    def __str__(self):
        return self.title
    
    def get_public_url(self):
        return f"/property-tag/{self.slug}/"
    
    def save(self, *args, **kwargs):
        # Auto-generate slug if not provided
        if not self.slug and self.title:
            from django.utils.text import slugify
            base_slug = slugify(self.title)
            slug = base_slug
            counter = 1
            while PropertyTag.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        
        # Auto-populate SEO fields
        if not self.meta_title and self.title:
            self.meta_title = self.title[:70]
        
        if not self.meta_description and self.description:
            self.meta_description = self.description[:300]
        
        super().save(*args, **kwargs)
        
        if self.pk:
            from src.real_estate.utils.cache import PropertyTagCacheManager
            PropertyTagCacheManager.invalidate_tag(self.pk)
    
    def delete(self, *args, **kwargs):
        tag_id = self.pk
        super().delete(*args, **kwargs)
        if tag_id:
            from src.real_estate.utils.cache import PropertyTagCacheManager
            PropertyTagCacheManager.invalidate_tag(tag_id)
    
    def generate_structured_data(self):
        return {
            "@context": "https://schema.org",
            "@type": "Thing",
            "name": self.get_meta_title(),
            "description": self.get_meta_description(),
            "url": self.get_public_url(),
        }
