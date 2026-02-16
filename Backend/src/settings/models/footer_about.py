from django.db import models
from django.core.cache import cache
from django.utils.translation import gettext_lazy as _

from src.core.models import BaseModel


class FooterAbout(BaseModel):
    title = models.CharField(_("title"), max_length=120, default="درباره ما")
    text = models.TextField(_("text"), blank=True)

    class Meta:
        verbose_name = _("footer about")
        verbose_name_plural = _("footer about")
        ordering = ["-created_at"]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        # Singleton behavior: keep exactly one record.
        if not self.pk and FooterAbout.objects.exists():
            existing = FooterAbout.objects.first()
            self.pk = existing.pk
            self.public_id = existing.public_id
        super().save(*args, **kwargs)

    @classmethod
    def get_settings(cls):
        cache_key = "settings_footer_about_pk"
        model_pk = cache.get(cache_key)

        if model_pk:
            obj = cls.objects.filter(pk=model_pk).first()
            if obj:
                return obj

        obj = cls.objects.first()
        if not obj:
            obj = cls.objects.create(title="درباره ما", text="")

        cache.set(cache_key, obj.pk, 3600)
        return obj
