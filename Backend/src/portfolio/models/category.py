from django.core.exceptions import ValidationError
from django.db import models
from treebeard.mp_tree import MP_Node
from src.core.models import BaseModel
from src.portfolio.models.seo import SEOMixin
from src.media.models.media import ImageMedia
from src.portfolio.utils.cache_admin import CategoryCacheManager
from src.analytics.utils.cache import AnalyticsCacheManager
from .managers import PortfolioCategoryQuerySet

class PortfolioCategory(MP_Node, BaseModel, SEOMixin):
    name = models.CharField(
        max_length=100,
        unique=True,
        db_index=True,
        verbose_name="Name",
        help_text="Category name"
    )
    slug = models.SlugField(
        max_length=100,
        unique=True,
        db_index=True,
        allow_unicode=True,
        verbose_name="URL Slug",
        help_text="URL-friendly identifier for the category"
    )
    
    description = models.TextField(
        null=True,
        blank=True,
        verbose_name="Description",
        help_text="Category description"
    )
    
    is_public = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name="Public",
        help_text="Designates whether this category is publicly visible"
    )
    
    image = models.ForeignKey(
        ImageMedia,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='portfolio_category_images',
        verbose_name="Main Image",
        help_text="Main image for this category"
    )
    
    objects = PortfolioCategoryQuerySet.as_manager()
    
    node_order_by = ['name']
    
    class Meta(BaseModel.Meta, SEOMixin.Meta):
        db_table = 'portfolio_categories'
        verbose_name = "Portfolio Category"
        verbose_name_plural = "Portfolio Categories"
        ordering = ['path']
        indexes = [
            models.Index(fields=['path']),
            models.Index(fields=['depth']),
            models.Index(fields=['is_public', 'path']),
        ]

    def __str__(self):
        return f"{'» ' * (self.depth - 1)}{self.name}"
    
    def get_public_url(self):
        return f"/category/{self.public_id}/"
    
    def save(self, *args, **kwargs):
        if not self.meta_title and self.name:
            self.meta_title = self.name[:70]
        
        if not self.meta_description and self.description:
            self.meta_description = self.description[:300]
            
        super().save(*args, **kwargs)
        
        CategoryCacheManager.invalidate_all()
        AnalyticsCacheManager.invalidate_dashboard()
    
    def delete(self, *args, **kwargs):
        super().delete(*args, **kwargs)
        CategoryCacheManager.invalidate_all()
        AnalyticsCacheManager.invalidate_dashboard()
    
    def generate_structured_data(self):
        return {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": self.get_meta_title(),
            "description": self.get_meta_description(),
            "url": self.get_public_url(),
        }
