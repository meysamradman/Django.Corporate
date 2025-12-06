from django.db import models
from src.core.models import BaseModel
from src.real_estate.models.managers import PropertyLabelQuerySet


class PropertyLabel(BaseModel):
    title = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name="Title",
        help_text="Label title (e.g., Featured, Hot Deal)"
    )
    color_code = models.CharField(
        max_length=7,
        default='#FF5733',
        verbose_name="Color Code",
        help_text="Hex color code for badge display"
    )
    badge_style = models.CharField(
        max_length=50,
        blank=True,
        verbose_name="Badge Style",
        help_text="CSS class or style identifier for badge"
    )
    
    objects = PropertyLabelQuerySet.as_manager()
    
    class Meta(BaseModel.Meta):
        db_table = 'real_estate_property_labels'
        verbose_name = 'Property Label'
        verbose_name_plural = 'Property Labels'
        ordering = ['title']
        indexes = [
            models.Index(fields=['is_active', 'title']),
        ]
    
    def __str__(self):
        return self.title
