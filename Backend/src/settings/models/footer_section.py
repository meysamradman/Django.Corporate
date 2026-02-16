from django.db import models
from django.utils.translation import gettext_lazy as _

from src.core.models import BaseModel


class FooterSection(BaseModel):
    title = models.CharField(_("title"), max_length=120)
    order = models.PositiveIntegerField(_("order"), default=0)

    class Meta:
        verbose_name = _("footer section")
        verbose_name_plural = _("footer sections")
        ordering = ["order", "-created_at"]

    def __str__(self):
        return self.title
