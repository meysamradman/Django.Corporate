from django.db import models
from django.utils import timezone
from django.core.validators import EmailValidator
from src.core.models.base import BaseModel


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
        verbose_name="Name",
        db_index=True,
        help_text="Sender name"
    )
    email = models.EmailField(
        blank=True,
        null=True,
        verbose_name="Email",
        db_index=True,
        validators=[EmailValidator()],
        help_text="Sender email address"
    )
    phone = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name="Phone",
        help_text="Sender phone number (optional)"
    )
    
    subject = models.CharField(
        max_length=300,
        blank=True,
        null=True,
        verbose_name="Subject",
        db_index=True,
        help_text="Message subject"
    )
    message = models.TextField(
        blank=True,
        null=True,
        verbose_name="Message",
        help_text="Message content"
    )
    
    dynamic_fields = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Dynamic Fields",
        help_text="Fields created in admin form builder"
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='new',
        db_index=True,
        verbose_name="Status",
        help_text="Current message status"
    )
    
    source = models.CharField(
        max_length=50,
        choices=SOURCE_CHOICES,
        default='website',
        db_index=True,
        verbose_name="Source",
        help_text="Message source"
    )
    
    ip_address = models.GenericIPAddressField(
        blank=True,
        null=True,
        verbose_name="IP Address",
        help_text="Sender IP address"
    )
    user_agent = models.TextField(
        blank=True,
        null=True,
        verbose_name="User Agent",
        help_text="Browser or application information"
    )
    
    reply_message = models.TextField(
        blank=True,
        null=True,
        verbose_name="Reply Message",
        help_text="Admin reply to this message"
    )
    replied_at = models.DateTimeField(
        blank=True,
        null=True,
        db_index=True,
        verbose_name="Replied At",
        help_text="When reply was sent"
    )
    replied_by = models.ForeignKey(
        'user.User',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='replied_email_messages',
        verbose_name="Replied By",
        help_text="Admin who sent the reply"
    )
    
    created_by = models.ForeignKey(
        'user.User',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='created_email_messages',
        verbose_name="Created By",
        help_text="Admin who created this email/draft"
    )
    
    read_at = models.DateTimeField(
        blank=True,
        null=True,
        db_index=True,
        verbose_name="Read At",
        help_text="When message was read"
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
        from src.statistics.utils.cache import StatisticsCacheManager
        StatisticsCacheManager.invalidate_emails()
        StatisticsCacheManager.invalidate_dashboard()
    
    def delete(self, *args, **kwargs):
        super().delete(*args, **kwargs)
        from src.statistics.utils.cache import StatisticsCacheManager
        StatisticsCacheManager.invalidate_emails()
        StatisticsCacheManager.invalidate_dashboard()

