from django.core.validators import EmailValidator
from django.db import models
from django.utils import timezone

from src.core.models.base import BaseModel
from src.email.utils.cache import EmailCacheManager
from src.statistics.utils.cache import StatisticsCacheManager


class EmailMessage(BaseModel):
    
    STATUS_CHOICES = [
        ('new', 'New'),
        ('read', 'Read'),
        ('replied', 'Replied'),
        ('archived', 'Archived'),
        ('draft', 'Draft'),
    ]
    
    SOURCE_CHOICES = [
        ('website', 'Website'),
        ('mobile_app', 'Mobile App'),
        ('email', 'Direct Email'),
        ('api', 'API'),
    ]
    
    name = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        db_index=True
    )
    email = models.EmailField(
        blank=True,
        null=True,
        db_index=True,
        validators=[EmailValidator()]
    )
    phone = models.CharField(
        max_length=20,
        blank=True,
        null=True
    )
    
    subject = models.CharField(
        max_length=300,
        blank=True,
        null=True,
        db_index=True
    )
    message = models.TextField(
        blank=True,
        null=True
    )
    
    dynamic_fields = models.JSONField(
        default=dict,
        blank=True
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='new',
        db_index=True
    )
    
    source = models.CharField(
        max_length=50,
        choices=SOURCE_CHOICES,
        default='website',
        db_index=True
    )
    
    ip_address = models.GenericIPAddressField(
        blank=True,
        null=True
    )
    user_agent = models.TextField(
        blank=True,
        null=True
    )
    
    reply_message = models.TextField(
        blank=True,
        null=True
    )
    replied_at = models.DateTimeField(
        blank=True,
        null=True,
        db_index=True
    )
    replied_by = models.ForeignKey(
        'user.User',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='replied_email_messages'
    )
    
    created_by = models.ForeignKey(
        'user.User',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='created_email_messages'
    )
    
    read_at = models.DateTimeField(
        blank=True,
        null=True,
        db_index=True
    )
    
    class Meta:
        db_table = 'email_messages'
        ordering = ['-created_at']
        verbose_name = "Email Message"
        verbose_name_plural = "Email Messages"
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['source', 'created_at']),
            models.Index(fields=['status', 'source']),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.subject[:50]}"
    
    def mark_as_read(self):
        if self.status == 'new':
            self.status = 'read'
            self.read_at = timezone.now()
            self.save(update_fields=['status', 'read_at'])
    
    def mark_as_replied(self, admin_user):
        self.status = 'replied'
        self.replied_at = timezone.now()
        self.replied_by = admin_user
        self.save(update_fields=['status', 'replied_at', 'replied_by'])
    
    @property
    def has_attachments(self):
        return self.attachments.exists()
    
    @property
    def is_new(self):
        return self.status == 'new'
    
    @property
    def is_replied(self):
        return self.status == 'replied' and self.reply_message
    
    @property
    def is_draft(self):
        return self.status == 'draft'
    
    def save_as_draft(self, admin_user):
        self.status = 'draft'
        if not self.created_by:
            self.created_by = admin_user
        self.save(update_fields=['status', 'created_by'])
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        EmailCacheManager.invalidate_all(message_id=self.id)
    
    def delete(self, *args, **kwargs):
        message_id = self.id
        super().delete(*args, **kwargs)
        EmailCacheManager.invalidate_all(message_id=message_id)

