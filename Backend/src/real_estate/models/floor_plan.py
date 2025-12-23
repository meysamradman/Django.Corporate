from django.db import models
from src.core.models import BaseModel


class RealEstateFloorPlan(BaseModel):
    title = models.CharField(
        max_length=20,
        unique=True,
        db_index=True,
        verbose_name="Title",
        help_text="The title of the real estate floor plan"
    )
    description = models.TextField(
        max_length=300,
        blank=True,
        verbose_name="Description",
        help_text="The description of the real estate floor plan"
    )
    slug = models.SlugField(
        max_length=60,
        unique=True,
        allow_unicode=True,
        db_index=True,
        verbose_name="Page Link",
        help_text="A unique URL-friendly identifier for this floor plan"
    )

    class Meta(BaseModel.Meta):
        db_table = 'real_estate_floor_plans'
        verbose_name = 'Real Estate Floor Plan'
        verbose_name_plural = 'Real Estate Floor Plans'
        indexes = [
            models.Index(fields=['title']),
        ]

    def __str__(self):
        return self.title
