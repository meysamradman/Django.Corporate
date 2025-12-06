from django.db import models
from src.core.models import BaseModel
from src.real_estate.models.managers import PropertyFeatureQuerySet


class PropertyFeature(BaseModel):
    title = models.CharField(
        max_length=100,
        unique=True,
        db_index=True,
        verbose_name="Title",
        help_text="Feature title (e.g., Parking, Elevator)"
    )
    icon = models.CharField(
        max_length=50,
        blank=True,
        verbose_name="Icon",
        help_text="Icon class name or identifier"
    )
    category = models.CharField(
        max_length=50,
        blank=True,
        db_index=True,
        verbose_name="Category",
        help_text="Feature category (e.g., Interior, Exterior, Amenities)"
    )
    
    objects = PropertyFeatureQuerySet.as_manager()
    
    class Meta(BaseModel.Meta):
        db_table = 'real_estate_property_features'
        verbose_name = 'Property Feature'
        verbose_name_plural = 'Property Features'
        ordering = ['category', 'title']
        indexes = [
            models.Index(fields=['is_active', 'category', 'title']),
        ]
    
    def __str__(self):
        return self.title
