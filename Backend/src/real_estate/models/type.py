from django.db import models
from django.core.exceptions import ValidationError
from treebeard.mp_tree import MP_Node
from src.core.models import BaseModel
from src.real_estate.models.seo import SEOMixin
from src.media.models.media import ImageMedia
from src.real_estate.models.managers import PropertyTypeQuerySet
from src.real_estate.utils.cache import TypeCacheManager


class PropertyType(MP_Node, BaseModel, SEOMixin):
    
    title = models.CharField(
        max_length=100,
        unique=True,
        db_index=True,
        verbose_name="Title",
        help_text="Property type title (e.g., پیش فروش, آپارتمان و سوئیت)"
    )
    slug = models.SlugField(
        max_length=150,
        unique=True,
        db_index=True,
        allow_unicode=True,
        verbose_name="URL Slug",
        help_text="URL-friendly identifier for the property type"
    )
    description = models.TextField(
        null=True,
        blank=True,
        verbose_name="Description",
        help_text="Detailed description of this property type"
    )
    
    is_public = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name="Public",
        help_text="Designates whether this type is publicly visible"
    )
    
    image = models.ForeignKey(
        ImageMedia,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='property_type_images',
        verbose_name="Main Image",
        help_text="Main image for this property type"
    )
    
    display_order = models.IntegerField(
        default=0,
        db_index=True,
        verbose_name="Display Order",
        help_text="Order for display in lists (within same level)"
    )

    node_order_by = ['display_order', 'title']
    
    objects = PropertyTypeQuerySet.as_manager()
    
    class Meta(BaseModel.Meta, SEOMixin.Meta):
        db_table = 'real_estate_property_types'
        verbose_name = 'Property Type'
        verbose_name_plural = 'Property Types'
        ordering = ['path']
        indexes = [
            models.Index(fields=['path']),
            models.Index(fields=['depth']),
            models.Index(fields=['is_active', 'path']),
            models.Index(fields=['slug']),
        ]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(display_order__gte=0),
                name='property_type_display_order_non_negative'
            ),
        ]
    
    def __str__(self):
        indent = '» ' * (self.depth - 1) if self.depth > 1 else ''
        return f"{indent}{self.title}"
    
    def get_public_url(self):
        return f"/properties/type/{self.slug}/"
    
    def save(self, *args, **kwargs):
        # Auto-generate SEO fields
        if not self.meta_title and self.title:
            self.meta_title = self.title[:70]
        
        if not self.meta_description and self.description:
            self.meta_description = self.description[:300]
            
        super().save(*args, **kwargs)
        
        # Invalidate cache
        TypeCacheManager.invalidate_all()
    
    def delete(self, *args, **kwargs):
        super().delete(*args, **kwargs)
        TypeCacheManager.invalidate_all()
    
    def is_root_level(self):
        """بررسی اینکه آیا این نوع در سطح ریشه است"""
        return self.depth == 1
    
    def is_leaf_node(self):
        """بررسی اینکه آیا این نوع برگ است (فرزند ندارد)"""
        return self.get_children().count() == 0
    
    def get_ancestors_list(self):
        return list(self.get_ancestors().values_list('title', flat=True))
    
    def get_full_path_title(self):
        ancestors = self.get_ancestors_list()
        return ' > '.join(ancestors + [self.title])
    
    def generate_structured_data(self):
        """Generate JSON-LD structured data for SEO"""
        return {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": self.get_meta_title(),
            "description": self.get_meta_description(),
            "url": self.get_public_url(),
        }
