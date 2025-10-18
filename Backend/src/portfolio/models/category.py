from django.core.exceptions import ValidationError
from django.db import models
from treebeard.mp_tree import MP_Node
from src.core.models import BaseModel
from src.portfolio.models.seo import SEOMixin
from src.media.models.media import ImageMedia
from .managers import PortfolioCategoryQuerySet

class PortfolioCategory(MP_Node, BaseModel, SEOMixin):
    # Relations
    image = models.ForeignKey(
        ImageMedia, 
        on_delete=models.SET_NULL,
        null=True, blank=True,
        verbose_name="Main Image"
    )
    
    # Core fields
    name = models.CharField(max_length=30, unique=True, db_index=True)
    slug = models.SlugField(max_length=60, unique=True, db_index=True, allow_unicode=True)
    description = models.TextField(null=True, blank=True)
    is_public = models.BooleanField(default=True, db_index=True)
    
    # Custom manager
    objects = PortfolioCategoryQuerySet.as_manager()
    
    node_order_by = ['name']
    
    class Meta:
        db_table = 'portfolio_categories'
        verbose_name = "Portfolio Category"
        verbose_name_plural = "Portfolio Categories"
        ordering = ["path"]
        # Optimized indexes for tree operations
        indexes = [
            models.Index(fields=['path']),  # Tree operations
            models.Index(fields=['depth']),  # Tree level queries
            models.Index(fields=['name']),
            models.Index(fields=['slug']),
            models.Index(fields=['public_id']),
            models.Index(fields=['is_public']),
            models.Index(fields=['meta_title']),
        ]

    def __str__(self):
        return f"{'» ' * (self.depth - 1)}{self.name}"
    
    def get_public_url(self):
        return f"/category/{self.public_id}/"
    
    def save(self, *args, **kwargs):
        # Auto SEO generation
        if not self.meta_title and self.name:
            self.meta_title = self.name[:70]
        
        if not self.meta_description and self.description:
            self.meta_description = self.description[:300]
            
        super().save(*args, **kwargs)
    
    def generate_structured_data(self):
        """Generate structured data for Category"""
        return {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": self.get_meta_title(),
            "description": self.get_meta_description(),
            "url": self.get_public_url(),
        }
