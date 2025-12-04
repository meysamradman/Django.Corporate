from django.db import models
from src.core.models.base import BaseModel
from src.media.models.media import ImageMedia


class PanelSettings(BaseModel):
    """
    Panel settings model following DJANGO_MODEL_STANDARDS.md conventions.
    Field ordering: Content → Relationships
    """
    # 2. Primary Content Fields
    panel_title = models.CharField(
        max_length=100,
        default="Admin Panel",
        db_index=True,
        verbose_name="Panel Title",
        help_text="Title displayed in the admin panel"
    )
    
    # 5. Relationships
    logo = models.ForeignKey(
        ImageMedia,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='panel_logo',
        db_index=True,
        verbose_name="Logo",
        help_text="Panel logo image"
    )
    favicon = models.ForeignKey(
        ImageMedia,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='panel_favicon',
        db_index=True,
        verbose_name="Favicon",
        help_text="Panel favicon image"
    )

    class Meta(BaseModel.Meta):
        db_table = 'panel_settings'
        verbose_name = "Panel Settings"
        verbose_name_plural = "Panel Settings"
        ordering = ['-created_at']
        indexes = [
            # Note: panel_title already has db_index=True (automatic index)
            # BaseModel already provides indexes for public_id, is_active, created_at
        ]
    
    def __str__(self):
        return self.panel_title
    
    @classmethod
    def get_settings(cls):
        settings = cls.objects.first()
        if not settings:
            settings = cls.objects.create()
        return settings