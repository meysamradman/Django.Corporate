from django.db import models
from treebeard.mp_tree import MP_Node
from src.core.models import BaseModel
from src.store.models.seo import SEOMixin
from src.media.models.media import ImageMedia
from src.store.utils.cache import ProductCategoryCacheManager
from src.statistics.utils.cache import StatisticsCacheManager
from .managers import ProductCategoryQuerySet


class ProductCategory(MP_Node, BaseModel, SEOMixin):
    title = models.CharField(
        max_length=100,
        unique=True,
        db_index=True,
        verbose_name="Title",
        help_text="Category title"
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
        related_name='store_category_images',
        verbose_name="Main Image",
        help_text="Main image for this category"
    )
    
    objects = ProductCategoryQuerySet.as_manager()
    
    node_order_by = ['title']
    
    class Meta(BaseModel.Meta, SEOMixin.Meta):
        db_table = 'store_categories'
        verbose_name = "Product Category"
        verbose_name_plural = "Product Categories"
        ordering = ['path']
        indexes = [
            models.Index(fields=['path']),
            models.Index(fields=['depth']),
            models.Index(fields=['is_public', 'path']),
        ]

    def __str__(self):
        return f"{'» ' * (self.depth - 1)}{self.title}"
    
    def get_public_url(self):
        return f"/store-category/{self.public_id}/"
    
    def save(self, *args, **kwargs):
        if not self.meta_title and self.title:
            self.meta_title = self.title[:70]
        
        if not self.meta_description and self.description:
            self.meta_description = self.description[:300]
            
        super().save(*args, **kwargs)
        
        if self.pk:
            ProductCategoryCacheManager.invalidate_all()
    
    def delete(self, *args, **kwargs):
        super().delete(*args, **kwargs)
        ProductCategoryCacheManager.invalidate_all()
    
    def generate_structured_data(self):
        return {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": self.get_meta_title(),
            "description": self.get_meta_description(),
            "url": self.get_public_url(),
        }
