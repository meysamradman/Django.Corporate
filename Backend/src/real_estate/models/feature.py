from django.db import models
from src.core.models import BaseModel
from src.real_estate.models.managers import PropertyFeatureQuerySet
from src.media.models.media import ImageMedia

class PropertyFeature(BaseModel):
    
    title = models.CharField(
        max_length=100,
        unique=True,
        db_index=True,
        verbose_name="Title",
        help_text="Feature title (e.g., Parking, Elevator)"
    )
    group = models.CharField(
        max_length=50,
        blank=True,
        db_index=True,
        verbose_name="Group",
        help_text="Feature group (e.g., Interior, Exterior, Amenities, Security)"
    )
    image = models.ForeignKey(
        ImageMedia,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='feature_images',
        verbose_name="Image/Icon",
        help_text="Feature image or icon (SVG/PNG recommended)"
    )
    
    objects = PropertyFeatureQuerySet.as_manager()
    
    class Meta(BaseModel.Meta):
        db_table = 'real_estate_property_features'
        verbose_name = 'Property Feature'
        verbose_name_plural = 'Property Features'
        ordering = ['group', 'title']
        indexes = [
            models.Index(fields=['is_active', 'group', 'title']),
        ]
    
    def __str__(self):
        return self.title
