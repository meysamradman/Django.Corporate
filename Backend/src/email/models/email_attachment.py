from django.db import models
from django.core.files.storage import default_storage
import os


def email_attachment_upload_path(instance, filename):
    """مسیر ذخیره‌سازی ضمیمه‌های ایمیل"""
    from django.utils import timezone
    today = timezone.now().date()
    return f'email_attachments/{today.year}/{today.month:02d}/{today.day:02d}/{filename}'


class EmailAttachment(models.Model):
    """
    ضمیمه‌های ایمیل
    """
    message = models.ForeignKey(
        'email.EmailMessage',
        on_delete=models.CASCADE,
        related_name='attachments',
        verbose_name="پیام",
        db_index=True
    )
    file = models.FileField(
        upload_to=email_attachment_upload_path,
        verbose_name="فایل",
        help_text="فایل ضمیمه"
    )
    filename = models.CharField(
        max_length=255,
        verbose_name="نام فایل",
        help_text="نام اصلی فایل"
    )
    file_size = models.PositiveIntegerField(
        verbose_name="حجم فایل (بایت)",
        help_text="حجم فایل به بایت"
    )
    content_type = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="نوع فایل",
        help_text="MIME type فایل"
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="تاریخ ایجاد",
        db_index=True
    )
    
    class Meta:
        db_table = 'email_attachments'
        ordering = ['-created_at']
        verbose_name = "ضمیمه ایمیل"
        verbose_name_plural = "ضمیمه‌های ایمیل"
        indexes = [
            models.Index(fields=['message', 'created_at']),
        ]
    
    def __str__(self):
        return self.filename
    
    def save(self, *args, **kwargs):
        """ذخیره با محاسبه خودکار حجم فایل"""
        if self.file and not self.file_size:
            self.file_size = self.file.size
        if self.file and not self.filename:
            self.filename = os.path.basename(self.file.name)
        super().save(*args, **kwargs)
    
    def delete(self, *args, **kwargs):
        """حذف فایل از storage هنگام حذف رکورد"""
        if self.file:
            if default_storage.exists(self.file.name):
                default_storage.delete(self.file.name)
        super().delete(*args, **kwargs)
    
    @property
    def file_size_formatted(self):
        """نمایش حجم فایل با فرمت خوانا"""
        size = self.file_size
        if size < 1024:
            return f"{size} B"
        elif size < 1024 * 1024:
            return f"{size / 1024:.1f} KB"
        else:
            return f"{size / (1024 * 1024):.1f} MB"

