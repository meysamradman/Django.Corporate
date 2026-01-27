from django.db import models
from django.utils.translation import gettext_lazy as _
from src.core.models import BaseModel

from src.media.models import ImageMedia, VideoMedia

class Slider(BaseModel):
    title = models.CharField(_("title"), max_length=255, blank=True)
    description = models.TextField(_("description"), blank=True)
    image = models.ForeignKey(
        ImageMedia, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='sliders_image',
        verbose_name=_("image")
    )
    video = models.ForeignKey(
        VideoMedia, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='sliders_video',
        verbose_name=_("video")
    )
    link = models.URLField(_("link"), blank=True)
    order = models.PositiveIntegerField(_("order"), default=0)
    is_active = models.BooleanField(_("active"), default=True)

    class Meta:
        verbose_name = _("slider")
        verbose_name_plural = _("sliders")
        ordering = ["order", "-created_at"]

    def __str__(self):
        return self.title or f"Slider {self.id}"
