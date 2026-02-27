from django.db import models

from src.core.models import BaseModel
from .managers import RealEstateProjectStateQuerySet


class RealEstateProjectState(BaseModel):
    slug = models.SlugField(max_length=100, unique=True, db_index=True, allow_unicode=True, verbose_name="Slug")
    title = models.CharField(max_length=80, db_index=True, verbose_name="Title")
    description = models.CharField(max_length=255, blank=True, verbose_name="Description")
    display_order = models.PositiveIntegerField(default=0, db_index=True, verbose_name="Display Order")
    is_public = models.BooleanField(default=True, db_index=True, verbose_name="Public")
    objects = RealEstateProjectStateQuerySet.as_manager()

    class Meta(BaseModel.Meta):
        db_table = "real_estate_project_states"
        verbose_name = "Real Estate Project State"
        verbose_name_plural = "Real Estate Project States"
        ordering = ["display_order", "title"]
        indexes = [
            models.Index(fields=["is_active", "is_public", "display_order"]),
        ]

    def __str__(self):
        return self.title
