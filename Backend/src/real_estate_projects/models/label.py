from django.db import models
from django.db.models import Q

from src.core.models import BaseModel
from .managers import RealEstateProjectLabelQuerySet


class RealEstateProjectLabel(BaseModel):
    title = models.CharField(max_length=50, unique=True, db_index=True, verbose_name="Title")
    slug = models.SlugField(
        max_length=100,
        db_index=True,
        allow_unicode=True,
        blank=True,
        default="",
        verbose_name="Slug",
    )
    objects = RealEstateProjectLabelQuerySet.as_manager()

    class Meta(BaseModel.Meta):
        db_table = "real_estate_project_labels"
        verbose_name = "Real Estate Project Label"
        verbose_name_plural = "Real Estate Project Labels"
        ordering = ["title"]
        constraints = [
            models.UniqueConstraint(
                fields=["slug"],
                condition=~Q(slug=""),
                name="uq_re_project_label_slug_non_empty",
            ),
        ]
        indexes = [
            models.Index(fields=["is_active", "title"]),
            models.Index(fields=["slug"]),
        ]

    def __str__(self):
        return self.title
