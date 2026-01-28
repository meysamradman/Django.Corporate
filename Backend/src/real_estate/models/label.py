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
    slug = models.SlugField(
        max_length=100,
        db_index=True,
        allow_unicode=True,
        blank=True,
        default='',
        verbose_name="URL Slug",
        help_text="URL-friendly identifier for the property label"
    )
    
    objects = PropertyLabelQuerySet.as_manager()
    
    class Meta(BaseModel.Meta):
        db_table = 'real_estate_property_labels'
        verbose_name = 'Property Label'
        verbose_name_plural = 'Property Labels'
        ordering = ['title']
        indexes = [
            models.Index(fields=['is_active', 'title']),
            models.Index(fields=['slug']),
        ]
    
    def __str__(self):
        return self.title
    
    def get_public_url(self):
        return f"/properties/label/{self.slug}/"
