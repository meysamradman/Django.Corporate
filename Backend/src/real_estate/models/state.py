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
    slug = models.SlugField(
        max_length=100,
        unique=True,
        db_index=True,
        allow_unicode=True,
        verbose_name="URL Slug",
        help_text="URL-friendly identifier for the property state"
    )
    
    objects = PropertyStateQuerySet.as_manager()
    
    class Meta(BaseModel.Meta):
        db_table = 'real_estate_property_states'
        verbose_name = 'Property State'
        verbose_name_plural = 'Property States'
        ordering = ['title']
        indexes = [
            models.Index(fields=['is_active', 'title']),
            models.Index(fields=['slug']),
        ]
    
    def __str__(self):
        return self.title
    
    def get_public_url(self):
        return f"/properties/{self.slug}/"
