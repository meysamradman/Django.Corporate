from django.db import models
from django.core.cache import cache
from src.core.models.base import BaseModel
from src.media.models.media import ImageMedia
from src.panel.utils.cache import PanelCacheKeys, PanelCacheManager

class PanelSettings(BaseModel):
    panel_title = models.CharField(
        max_length=100,
        default="Admin Panel",
        db_index=True,
        verbose_name="Panel Title",
        help_text="Title displayed in the admin panel"
    )
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
        ]
    
    def __str__(self):
        return self.panel_title
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        PanelCacheManager.invalidate_panel_settings()
    
    @classmethod
    def get_settings(cls):
        cache_key = PanelCacheKeys.panel_settings()
        settings_id = cache.get(cache_key)

        if settings_id is not None:
            settings = cls.objects.select_related('logo', 'favicon').filter(id=settings_id).first()
            if settings is not None:
                return settings
            cache.delete(cache_key)

        settings = cls.objects.select_related('logo', 'favicon').first()
        if not settings:
            settings = cls.objects.create()

        cache.set(cache_key, settings.id, 3600)
        return settings