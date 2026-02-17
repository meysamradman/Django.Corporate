from django.db import models
from django.utils.translation import gettext_lazy as _

from src.core.models import BaseModel
from src.settings.models.footer_section import FooterSection

class FooterLink(BaseModel):
    section = models.ForeignKey(
        FooterSection,
        on_delete=models.CASCADE,
        related_name='links',
        verbose_name=_("section"),
    )
    title = models.CharField(_("title"), max_length=120)
    href = models.CharField(
        _("href"),
        max_length=500,
        help_text="Link URL or relative path (e.g., /about)",
    )
    order = models.PositiveIntegerField(_("order"), default=0)

    class Meta:
        verbose_name = _("footer link")
        verbose_name_plural = _("footer links")
        ordering = ["order", "-created_at"]
        indexes = [
            models.Index(fields=["section", "is_active", "order"]),
        ]

    def __str__(self):
        return self.title
