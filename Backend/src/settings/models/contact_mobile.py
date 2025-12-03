from django.db import models
from django.core.validators import RegexValidator

from src.core.models.base import BaseModel


mobile_validator = RegexValidator(
    regex=r'^(09|\+989)[0-9]{9}$',
    message="شماره موبایل باید با 09 یا +989 شروع شود و 11 رقم باشد"
)


class ContactMobile(BaseModel):
    
    mobile_number = models.CharField(
        max_length=15,
        verbose_name="شماره موبایل",
        help_text="شماره موبایل - باید با 09 شروع شود (مثال: 09123456789)",
        validators=[mobile_validator],
        unique=True
    )
    
    label = models.CharField(
        max_length=100,
        verbose_name="برچسب",
        help_text="برچسب برای شماره موبایل (مثلاً: پشتیبانی، فروش)",
        blank=True
    )
    
    order = models.PositiveIntegerField(
        default=0,
        verbose_name="ترتیب نمایش",
        help_text="ترتیب نمایش در لیست (اعداد کمتر اول نمایش داده می‌شوند)",
        db_index=True
    )
    
    class Meta(BaseModel.Meta):
        db_table = 'settings_contact_mobile'
        verbose_name = "شماره موبایل"
        verbose_name_plural = "شماره‌های موبایل"
        ordering = ['order', '-created_at']
        indexes = [
            models.Index(fields=['is_active', 'order']),
        ]
    
    def __str__(self):
        label_text = f" ({self.label})" if self.label else ""
        return f"{self.mobile_number}{label_text}"
