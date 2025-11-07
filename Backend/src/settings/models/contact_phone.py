from django.db import models
from django.core.validators import RegexValidator

from src.core.models.base import BaseModel


phone_validator = RegexValidator(
    regex=r'^[0-9+\-\s()]+$',
    message="شماره تماس باید شامل اعداد، +، -، () و فاصله باشد"
)


class ContactPhone(BaseModel):
    """Contact phone number (fixed) - can be multiple"""
    
    phone_number = models.CharField(
        max_length=20,
        verbose_name="شماره تماس",
        help_text="شماره تماس (ثابت) - مثال: 021-12345678",
        validators=[phone_validator]
    )
    
    label = models.CharField(
        max_length=100,
        verbose_name="برچسب",
        help_text="برچسب برای شماره تماس (مثلاً: دفتر مرکزی، پشتیبانی)",
        blank=True
    )
    
    order = models.PositiveIntegerField(
        default=0,
        verbose_name="ترتیب نمایش",
        help_text="ترتیب نمایش در لیست (اعداد کمتر اول نمایش داده می‌شوند)",
        db_index=True
    )
    
    class Meta(BaseModel.Meta):
        db_table = 'settings_contact_phone'
        verbose_name = "شماره تماس"
        verbose_name_plural = "شماره‌های تماس"
        ordering = ['order', '-created_at']
        indexes = [
            models.Index(fields=['is_active', 'order']),
        ]
    
    def __str__(self):
        label_text = f" ({self.label})" if self.label else ""
        return f"{self.phone_number}{label_text}"
