from django.db import models
from django.core.validators import URLValidator

from src.core.models.base import BaseModel
from src.media.models.media import ImageMedia


class SocialMedia(BaseModel):
    
    name = models.CharField(
        max_length=100,
        verbose_name="نام شبکه اجتماعی",
        help_text="نام شبکه اجتماعی (مثلاً: اینستاگرام، تلگرام، لینکدین)",
        db_index=True
    )
    
    url = models.URLField(
        max_length=500,
        verbose_name="لینک",
        help_text="لینک کامل صفحه شبکه اجتماعی",
        validators=[URLValidator()]
    )
    
    icon = models.ForeignKey(
        ImageMedia,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='social_media_icons',
        verbose_name="آیکون",
        help_text="آیکون یا تصویر شبکه اجتماعی"
    )
    
    order = models.PositiveIntegerField(
        default=0,
        verbose_name="ترتیب نمایش",
        help_text="ترتیب نمایش در لیست (اعداد کمتر اول نمایش داده می‌شوند)",
        db_index=True
    )
    
    class Meta(BaseModel.Meta):
        db_table = 'settings_social_media'
        verbose_name = "شبکه اجتماعی"
        verbose_name_plural = "شبکه‌های اجتماعی"
        ordering = ['order', '-created_at']
        indexes = [
            models.Index(fields=['is_active', 'order']),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.url}"
