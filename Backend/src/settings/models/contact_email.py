from django.db import models
from django.core.validators import EmailValidator

from src.core.models.base import BaseModel


class ContactEmail(BaseModel):
    
    email = models.EmailField(
        max_length=255,
        verbose_name="ایمیل",
        help_text="آدرس ایمیل تماس",
        validators=[EmailValidator()],
        unique=True
    )
    
    label = models.CharField(
        max_length=100,
        verbose_name="برچسب",
        help_text="برچسب برای ایمیل (مثلاً: پشتیبانی، فروش، اطلاعات)",
        blank=True
    )
    
    order = models.PositiveIntegerField(
        default=0,
        verbose_name="ترتیب نمایش",
        help_text="ترتیب نمایش در لیست (اعداد کمتر اول نمایش داده می‌شوند)",
        db_index=True
    )
    
    class Meta(BaseModel.Meta):
        db_table = 'settings_contact_email'
        verbose_name = "ایمیل تماس"
        verbose_name_plural = "ایمیل‌های تماس"
        ordering = ['order', '-created_at']
        indexes = [
            models.Index(fields=['is_active', 'order']),
        ]
    
    def __str__(self):
        label_text = f" ({self.label})" if self.label else ""
        return f"{self.email}{label_text}"
