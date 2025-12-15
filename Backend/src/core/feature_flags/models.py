from django.db import models
from django.utils.translation import gettext_lazy as _
from src.core.models.base import BaseModel


class FeatureFlag(BaseModel):
    key = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name=_("Key")
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name=_("Description")
    )

    class Meta(BaseModel.Meta):
        db_table = 'core_feature_flag'
        verbose_name = _("Feature Flag")
        verbose_name_plural = _("Feature Flags")
        ordering = ['key']
        indexes = BaseModel.Meta.indexes + [
            models.Index(fields=['key', 'is_active']),
        ]

    def __str__(self):
        status = "✓" if self.is_active else "✗"
        return f"{status} {self.key}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        from .services import invalidate_feature_flag_cache
        invalidate_feature_flag_cache(self.key)
