from django.db import models
from django.core.validators import URLValidator

from src.core.models.base import BaseModel
from src.media.models.media import ImageMedia


class GeneralSettings(BaseModel):
    
    site_name = models.CharField(
        max_length=200,
        verbose_name="Site Name",
        help_text="System or brand name"
    )
    
    enamad_image = models.ForeignKey(
        ImageMedia,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='enamad_settings',
        verbose_name="Enamad Image",
        help_text="Electronic trust symbol image"
    )
    
    logo_image = models.ForeignKey(
        ImageMedia,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='logo_settings',
        verbose_name="Logo Image",
        help_text="Main system logo"
    )
    
    favicon_image = models.ForeignKey(
        ImageMedia,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='favicon_settings',
        verbose_name="Favicon Image",
        help_text="Icon displayed in browser tab"
    )
    
    copyright_text = models.CharField(
        max_length=500,
        verbose_name="Copyright Text",
        help_text="Copyright text (e.g., All rights reserved © 2024)",
        blank=True
    )
    
    copyright_link = models.URLField(
        max_length=500,
        verbose_name="Copyright Link",
        help_text="Copyright related link (optional)",
        blank=True,
        null=True,
        validators=[URLValidator()]
    )
    
    class Meta(BaseModel.Meta):
        db_table = 'settings_general'
        verbose_name = "General Settings"
        verbose_name_plural = "General Settings"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"General Settings: {self.site_name}"
    
    def save(self, *args, **kwargs):
        if not self.pk:
            if GeneralSettings.objects.exists():
                existing = GeneralSettings.objects.first()
                self.pk = existing.pk
                self.public_id = existing.public_id
        super().save(*args, **kwargs)
    
    @classmethod
    def get_settings(cls):
        settings = cls.objects.first()
        if not settings:
            settings = cls.objects.create(
                site_name="System Name",
                copyright_text="All rights reserved"
            )
        return settings
