from django.db import models
from src.core.models.base import BaseModel


class PanelSettings(BaseModel):
    panel_title = models.CharField(max_length=100, default="Admin Panel")
    logo = models.ForeignKey(
        'media.Media', related_name='panel_logo', null=True, blank=True, on_delete=models.SET_NULL
    )
    favicon = models.ForeignKey(
        'media.Media', related_name='panel_favicon', null=True, blank=True, on_delete=models.SET_NULL
    )

    class Meta:
        db_table = 'panel_settings'
        verbose_name = 'Panel Settings'
        verbose_name_plural = 'Panel Settings'
