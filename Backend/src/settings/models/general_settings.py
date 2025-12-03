from django.db import models
from django.core.validators import URLValidator

from src.core.models.base import BaseModel
from src.media.models.media import ImageMedia


class GeneralSettings(BaseModel):
    
    site_name = models.CharField(
        max_length=200,
        verbose_name="نام سیستم",
        help_text="نام سیستم یا برند"
    )
    
    enamad_image = models.ForeignKey(
        ImageMedia,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='enamad_settings',
        verbose_name="تصویر اینماد",
        help_text="تصویر نماد اعتماد الکترونیک"
    )
    
    logo_image = models.ForeignKey(
        ImageMedia,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='logo_settings',
        verbose_name="تصویر لوگو",
        help_text="لوگوی اصلی سیستم"
    )
    
    favicon_image = models.ForeignKey(
        ImageMedia,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='favicon_settings',
        verbose_name="تصویر Favicon",
        help_text="آیکون نمایش داده شده در تب مرورگر"
    )
    
    copyright_text = models.CharField(
        max_length=500,
        verbose_name="متن کپی رایت",
        help_text="متن کپی رایت (مثلاً: تمام حقوق محفوظ است © ۱۴۰۴)",
        blank=True
    )
    
    copyright_link = models.URLField(
        max_length=500,
        verbose_name="لینک کپی رایت",
        help_text="لینک مربوط به کپی رایت (اختیاری)",
        blank=True,
        null=True,
        validators=[URLValidator()]
    )
    
    class Meta(BaseModel.Meta):
        db_table = 'settings_general'
        verbose_name = "تنظیمات عمومی"
        verbose_name_plural = "تنظیمات عمومی"
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
