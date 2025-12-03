import os

from django.core.files.storage import default_storage
from django.db import models
from django.utils import timezone

from src.email.utils.cache import EmailCacheManager


def email_attachment_upload_path(instance, filename):
    today = timezone.now().date()
    return f'email_attachments/{today.year}/{today.month:02d}/{today.day:02d}/{filename}'


class EmailAttachment(models.Model):
    message = models.ForeignKey(
        'email.EmailMessage',
        on_delete=models.CASCADE,
        related_name='attachments',
        db_index=True
    )
    file = models.FileField(
        upload_to=email_attachment_upload_path
    )
    filename = models.CharField(
        max_length=255
    )
    file_size = models.PositiveIntegerField()
    content_type = models.CharField(
        max_length=100,
        blank=True
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True
    )
    
    class Meta:
        db_table = 'email_attachments'
        ordering = ['-created_at']
        verbose_name = "Email Attachment"
        verbose_name_plural = "Email Attachments"
        indexes = [
            models.Index(fields=['message', 'created_at']),
        ]
    
    def __str__(self):
        return self.filename
    
    def save(self, *args, **kwargs):
        if self.file and not self.file_size:
            self.file_size = self.file.size
        if self.file and not self.filename:
            self.filename = os.path.basename(self.file.name)
        super().save(*args, **kwargs)
        if self.message_id:
            EmailCacheManager.invalidate_message(self.message_id)
    
    def delete(self, *args, **kwargs):
        message_id = self.message.id if self.message else None
        if self.file:
            if default_storage.exists(self.file.name):
                default_storage.delete(self.file.name)
        super().delete(*args, **kwargs)
        if message_id:
            EmailCacheManager.invalidate_message(message_id)
    
    @property
    def file_size_formatted(self):
        size = self.file_size
        if size < 1024:
            return f"{size} B"
        elif size < 1024 * 1024:
            return f"{size / 1024:.1f} KB"
        else:
            return f"{size / (1024 * 1024):.1f} MB"

