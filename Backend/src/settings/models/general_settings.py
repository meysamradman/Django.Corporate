from django.db import models
from django.core.cache import cache
from django.core.validators import URLValidator

from src.core.models.base import BaseModel
from src.media.models.media import ImageMedia
from src.settings.utils.cache import SettingsCacheKeys, SettingsCacheManager

class GeneralSettings(BaseModel):

    site_name = models.CharField(
        max_length=100,
        db_index=True,
        verbose_name="Site Name",
        help_text="System or brand name"
    )
    copyright_text = models.CharField(
        max_length=300,
        blank=True,
        verbose_name="Copyright Text",
        help_text="Copyright text (e.g., All rights reserved © 2024)"
    )
    
    logo_image = models.ForeignKey(
        ImageMedia,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='logo_settings',
        db_index=True,
        verbose_name="Logo Image",
        help_text="Main system logo"
    )
    favicon_image = models.ForeignKey(
        ImageMedia,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='favicon_settings',
        db_index=True,
        verbose_name="Favicon Image",
        help_text="Icon displayed in browser tab"
    )
    enamad_image = models.ForeignKey(
        ImageMedia,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='enamad_settings',
        db_index=True,
        verbose_name="Enamad Image",
        help_text="Electronic trust symbol image"
    )
    
    copyright_link = models.URLField(
        max_length=500,
        blank=True,
        null=True,
        verbose_name="Copyright Link",
        help_text="Copyright related link (optional)",
        validators=[URLValidator()]
    )
    
    class Meta(BaseModel.Meta):
        db_table = 'settings_general'
        verbose_name = "General Settings"
        verbose_name_plural = "General Settings"
        ordering = ['-created_at']
        indexes = []
    
    def __str__(self):
        return f"General Settings: {self.site_name}"
    
    def save(self, *args, **kwargs):
        if not self.pk:
            if GeneralSettings.objects.exists():
                existing = GeneralSettings.objects.first()
                self.pk = existing.pk
                self.public_id = existing.public_id
        super().save(*args, **kwargs)
        SettingsCacheManager.invalidate_general_settings()
    
    @classmethod
    def get_settings(cls):
        settings = None
        model_pk = cache.get(SettingsCacheKeys.general_settings_model_pk())

        if model_pk:
            settings = cls.objects.select_related('logo_image', 'favicon_image', 'enamad_image').filter(pk=model_pk).first()

        if settings is None:
            settings = cls.objects.select_related('logo_image', 'favicon_image', 'enamad_image').first()

        if not settings:
            settings = cls.objects.create(
                site_name="System Name",
                copyright_text="All rights reserved"
            )

        cache.set(SettingsCacheKeys.general_settings_model_pk(), settings.pk, 3600)
        return settings
