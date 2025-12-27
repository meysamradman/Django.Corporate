from django.db import models
from src.core.models import BaseModel
from src.real_estate.models.managers import PropertyTypeQuerySet


class PropertyType(BaseModel):
    title = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name="Title",
        help_text="Property type title (e.g., Apartment, Villa)"
    )
    slug = models.SlugField(
        max_length=100,
        unique=True,
        db_index=True,
        allow_unicode=True,
        verbose_name="URL Slug",
        help_text="URL-friendly identifier for the property type"
    )
    display_order = models.IntegerField(
        default=0,
        db_index=True,
        verbose_name="Display Order",
        help_text="Order for display in lists"
    )
    
    objects = PropertyTypeQuerySet.as_manager()
    
    class Meta(BaseModel.Meta):
        db_table = 'real_estate_property_types'
        verbose_name = 'Property Type'
        verbose_name_plural = 'Property Types'
        ordering = ['display_order', 'title']
        indexes = [
            models.Index(fields=['is_active', 'display_order']),
            models.Index(fields=['title']),
            models.Index(fields=['slug']),
        ]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(display_order__gte=0),
                name='property_type_display_order_non_negative'
            ),
        ]
    
    def __str__(self):
        return self.title
    
    def get_public_url(self):
        return f"/properties/type/{self.slug}/"
