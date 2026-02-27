from django.db import models
from django.db.models import Q

from src.core.models import BaseModel
from src.media.models.media import ImageMedia
from .managers import RealEstateProjectFeatureQuerySet


class RealEstateProjectFeature(BaseModel):
    title = models.CharField(max_length=100, unique=True, db_index=True, verbose_name="Title")
    group = models.CharField(max_length=50, blank=True, db_index=True, verbose_name="Group")
    slug = models.SlugField(
        max_length=120,
        allow_unicode=True,
        blank=True,
        default="",
        db_index=True,
        verbose_name="Slug",
    )
    parent = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="children",
        db_index=True,
        verbose_name="Parent Feature",
    )
    image = models.ForeignKey(
        ImageMedia,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="project_feature_images",
        verbose_name="Image",
    )
    objects = RealEstateProjectFeatureQuerySet.as_manager()

    class Meta(BaseModel.Meta):
        db_table = "real_estate_project_features"
        verbose_name = "Real Estate Project Feature"
        verbose_name_plural = "Real Estate Project Features"
        ordering = ["group", "title"]
        constraints = [
            models.UniqueConstraint(
                fields=["slug"],
                condition=~Q(slug=""),
                name="uq_re_project_feature_slug_non_empty",
            ),
        ]
        indexes = [
            models.Index(fields=["is_active", "group", "title"]),
            models.Index(fields=["slug"]),
            models.Index(fields=["parent"]),
        ]

    def __str__(self):
        return self.title
