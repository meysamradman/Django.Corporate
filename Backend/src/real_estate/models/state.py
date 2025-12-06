from django.db import models
from src.core.models import BaseModel
from src.real_estate.models.managers import PropertyStateQuerySet


class PropertyState(BaseModel):
    title = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name="Title",
        help_text="Property state title (e.g., For Sale, For Rent)"
    )
    color_code = models.CharField(
        max_length=7,
        default='#000000',
        verbose_name="Color Code",
        help_text="Hex color code for UI display"
    )
    
    objects = PropertyStateQuerySet.as_manager()
    
    class Meta(BaseModel.Meta):
        db_table = 'real_estate_property_states'
        verbose_name = 'Property State'
        verbose_name_plural = 'Property States'
        ordering = ['title']
        indexes = [
            models.Index(fields=['is_active', 'title']),
        ]
    
    def __str__(self):
        return self.title
