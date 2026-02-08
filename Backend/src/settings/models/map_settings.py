from django.db import models
from django.utils.translation import gettext_lazy as _
from src.core.models.base import BaseModel

class MapSettings(BaseModel):
    PROVIDER_CHOICES = [
        ('leaflet', _('Leaflet / OpenStreetMap')),
        ('google_maps', _('Google Maps')),
        ('neshan', _('Neshan (Iranian)')),
        ('cedarmaps', _('CedarMaps (Iranian)')),
    ]

    provider = models.CharField(
        max_length=20,
        choices=PROVIDER_CHOICES,
        default='leaflet',
        verbose_name=_("Map Provider")
    )

    google_maps_api_key = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name=_("Google Maps API Key")
    )

    neshan_api_key = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name=_("Neshan API Key")
    )

    cedarmaps_api_key = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name=_("CedarMaps API Key")
    )

    class Meta(BaseModel.Meta):
        db_table = 'settings_map'
        verbose_name = _("Map Settings")
        verbose_name_plural = _("Map Settings")

    def __str__(self):
        return f"Map Settings ({self.get_provider_display()})"

    def save(self, *args, **kwargs):
        if not self.pk and MapSettings.objects.exists():
            instance = MapSettings.objects.first()
            self.pk = instance.pk
        super().save(*args, **kwargs)
