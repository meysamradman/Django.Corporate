from django.core.validators import EmailValidator
from django.db import models
from django.utils import timezone

from src.core.models.base import BaseModel
from src.email.utils.cache import EmailCacheManager


class EmailMessage(BaseModel):
    """
    Email message model following DJANGO_MODEL_STANDARDS.md conventions.
    Field ordering: Status → Content → Flags → Relationships → Metadata → Timestamps
    """
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
    
    # 1. Status/State Fields
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='new',
        db_index=True,
        verbose_name="Status",
        help_text="Status of the email message"
    )
    source = models.CharField(
        max_length=50,
        choices=SOURCE_CHOICES,
        default='website',
        db_index=True,
        verbose_name="Source",
        help_text="Source where the email message originated from"
    )
    
    # 2. Primary Content Fields
    subject = models.CharField(
        max_length=300,
        blank=True,
        null=True,
        db_index=True,
        verbose_name="Subject",
        help_text="Email message subject"
    )
    name = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        db_index=True,
        verbose_name="Name",
        help_text="Sender's name"
    )
    email = models.EmailField(
        blank=True,
        null=True,
        db_index=True,
        validators=[EmailValidator()],
        verbose_name="Email Address",
        help_text="Sender's email address"
    )
    phone = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name="Phone Number",
        help_text="Sender's phone number"
    )
    
    # 3. Description Fields
    message = models.TextField(
        blank=True,
        null=True,
        verbose_name="Message",
        help_text="Email message content"
    )
    reply_message = models.TextField(
        blank=True,
        null=True,
        verbose_name="Reply Message",
        help_text="Reply message content"
    )
    
    # 5. Relationships
    created_by = models.ForeignKey(
        'user.User',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='created_email_messages',
        db_index=True,
        verbose_name="Created By",
        help_text="User who created this message"
    )
    replied_by = models.ForeignKey(
        'user.User',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='replied_email_messages',
        db_index=True,
        verbose_name="Replied By",
        help_text="Admin user who replied to this message"
    )
    
    # Metadata Fields
    dynamic_fields = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Dynamic Fields",
        help_text="Additional dynamic fields data"
    )
    ip_address = models.GenericIPAddressField(
        blank=True,
        null=True,
        verbose_name="IP Address",
        help_text="IP address of the sender"
    )
    user_agent = models.TextField(
        blank=True,
        null=True,
        verbose_name="User Agent",
        help_text="User agent string of the sender"
    )
    
    # Timestamp Fields (additional to BaseModel timestamps)
    read_at = models.DateTimeField(
        blank=True,
        null=True,
        db_index=True,
        verbose_name="Read At",
        help_text="Date and time when message was read"
    )
    replied_at = models.DateTimeField(
        blank=True,
        null=True,
        db_index=True,
        verbose_name="Replied At",
        help_text="Date and time when message was replied"
    )
    
    class Meta(BaseModel.Meta):
        db_table = 'email_messages'
        verbose_name = "Email Message"
        verbose_name_plural = "Email Messages"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['source', 'status', '-created_at']),
            models.Index(fields=['status', 'created_by', '-created_at']),
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
        """Check if message has attachments"""
        return self.attachments.exists()
    
    @property
    def is_new(self):
        """
        Check if message status is 'new'.
        Note: This overrides BaseModel.is_new property which checks if object is unsaved.
        """
        return self.status == 'new'
    
    @property
    def is_replied(self):
        """Check if message has been replied to"""
        return self.status == 'replied' and self.reply_message
    
    @property
    def is_draft(self):
        """Check if message is a draft"""
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

