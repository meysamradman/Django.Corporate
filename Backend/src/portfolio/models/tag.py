from django.db import models
from src.core.models import BaseModel
from src.portfolio.models.seo import SEOMixin
from src.portfolio.utils.cache import TagCacheManager
from src.statistics.utils.cache import StatisticsCacheManager
from .managers import PortfolioTagQuerySet

class PortfolioTag(BaseModel, SEOMixin):
    """
    Portfolio tag model following DJANGO_MODEL_STANDARDS.md conventions.
    """
    # 2. Primary Content Fields
    name = models.CharField(
        max_length=100,
        unique=True,
        db_index=True,
        verbose_name="Name",
        help_text="Tag name"
    )
    slug = models.SlugField(
        max_length=100,
        unique=True,
        db_index=True,
        allow_unicode=True,
        verbose_name="URL Slug",
        help_text="URL-friendly identifier for the tag"
    )
    
    # 3. Description Fields
    description = models.TextField(
        null=True,
        blank=True,
        verbose_name="Description",
        help_text="Tag description"
    )
    
    # 4. Boolean Flags
    is_public = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name="Public",
        help_text="Designates whether this tag is publicly visible"
    )
    
    objects = PortfolioTagQuerySet.as_manager()

    def get_public_url(self):
        return f"/tag/{self.public_id}/"

    class Meta(BaseModel.Meta, SEOMixin.Meta):
        db_table = 'portfolio_tags'
        verbose_name = "Portfolio Tag"
        verbose_name_plural = "Portfolio Tags"
        ordering = ['name']
        indexes = [
            models.Index(fields=['is_public', 'name']),
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
