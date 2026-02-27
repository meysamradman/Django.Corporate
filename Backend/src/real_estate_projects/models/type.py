from django.db import models
from treebeard.mp_tree import MP_Node

from src.core.models import BaseModel
from .managers import RealEstateProjectTypeQuerySet


class RealEstateProjectType(MP_Node, BaseModel):
    code = models.SlugField(max_length=50, unique=True, db_index=True, verbose_name="Code")
    title = models.CharField(max_length=80, unique=True, db_index=True, verbose_name="Title")
    description = models.CharField(max_length=255, blank=True, verbose_name="Description")
    display_order = models.PositiveIntegerField(default=0, db_index=True, verbose_name="Display Order")
    is_public = models.BooleanField(default=True, db_index=True, verbose_name="Public")
    objects = RealEstateProjectTypeQuerySet.as_manager()
    node_order_by = ["display_order", "title"]

    class Meta(BaseModel.Meta):
        db_table = "real_estate_project_types"
        verbose_name = "Real Estate Project Type"
        verbose_name_plural = "Real Estate Project Types"
        ordering = ["path"]
        indexes = [
            models.Index(fields=["is_active", "is_public", "display_order"]),
            models.Index(fields=["path"]),
            models.Index(fields=["depth"]),
        ]

    def __str__(self):
        return self.title
