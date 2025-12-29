from django.db import models
from treebeard.mp_tree import MP_Node
from src.core.models import BaseModel
from src.real_estate.models.managers import PropertyTypeQuerySet


class PropertyType(MP_Node, BaseModel):
    
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
        blank=True,
        verbose_name="Description",
        help_text="Detailed description of this property type"
    )
    
    display_order = models.IntegerField(
        default=0,
        db_index=True,
        verbose_name="Display Order",
        help_text="Order for display in lists (within same level)"
    )

    node_order_by = ['display_order', 'title']
    
    objects = PropertyTypeQuerySet.as_manager()
    
    class Meta(BaseModel.Meta):
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
    
    @property
    def is_root(self):
        return self.depth == 1
    
    @property
    def is_leaf(self):
        return self.get_children().count() == 0
    
    def get_ancestors_list(self):
        return list(self.get_ancestors().values_list('title', flat=True))
    
    def get_full_path_title(self):
        ancestors = self.get_ancestors_list()
        return ' > '.join(ancestors + [self.title])
