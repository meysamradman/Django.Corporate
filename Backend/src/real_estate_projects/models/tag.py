from django.db import models

from src.core.models import BaseModel
from .seo import SEOMixin
from .managers import RealEstateProjectTagQuerySet


class RealEstateProjectTag(BaseModel, SEOMixin):
    title = models.CharField(max_length=100, unique=True, db_index=True, verbose_name="Title")
    slug = models.SlugField(
        max_length=100,
        unique=True,
        db_index=True,
        allow_unicode=True,
        verbose_name="Slug",
    )
    description = models.TextField(null=True, blank=True, verbose_name="Description")
    is_public = models.BooleanField(default=True, db_index=True, verbose_name="Public")
    objects = RealEstateProjectTagQuerySet.as_manager()

    class Meta(BaseModel.Meta, SEOMixin.Meta):
        db_table = "real_estate_project_tags"
        verbose_name = "Real Estate Project Tag"
        verbose_name_plural = "Real Estate Project Tags"
        ordering = ["title"]
        indexes = [
            models.Index(fields=["is_public", "is_active", "title"]),
            models.Index(fields=["slug"]),
        ]

    def __str__(self):
        return self.title
