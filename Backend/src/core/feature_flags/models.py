from django.db import models
from django.utils.translation import gettext_lazy as _
from src.core.models.base import BaseModel


class FeatureFlag(BaseModel):
    """
    Feature Flag Model for controlling app/feature activation
    """
    key = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name=_("Key"),
        help_text=_("Unique identifier for the feature (e.g., 'portfolio', 'blog')")
    )
    # Override is_active from BaseModel to use it for feature activation
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name=_("Is Active"),
        help_text=_("Whether this feature is currently active")
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name=_("Description"),
        help_text=_("Optional description of what this feature flag controls")
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
        # Invalidate cache when feature flag is updated
        from .services import invalidate_feature_flag_cache
        invalidate_feature_flag_cache(self.key)

