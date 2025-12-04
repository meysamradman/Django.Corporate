from django.db import models
from src.core.models import BaseModel
from src.user.models.user import User
from src.user.models.admin_profile import AdminProfile
from .ticket import Ticket
from src.ticket.utils.cache import TicketCacheManager

SENDER_TYPE_CHOICES = [
    ('user', 'User'),
    ('admin', 'Admin'),
]


class TicketMessage(BaseModel):
    """
    Ticket message model following DJANGO_MODEL_STANDARDS.md conventions.
    Field ordering: Status → Content → Flags → Relationships → Metadata
    """
    # 1. Status/State Fields
    sender_type = models.CharField(
        max_length=10,
        choices=SENDER_TYPE_CHOICES,
        db_index=True,
        verbose_name="Sender Type",
        help_text="Type of sender (user or admin)"
    )
    
    # 3. Description Fields
    message = models.TextField(
        verbose_name="Message",
        help_text="Message content"
    )
    
    # 4. Boolean Flags
    is_read = models.BooleanField(
        default=False,
        db_index=True,
        verbose_name="Is Read",
        help_text="Whether this message has been read"
    )
    
    # 5. Relationships
    ticket = models.ForeignKey(
        Ticket,
        on_delete=models.CASCADE,
        related_name='messages',
        db_index=True,
        verbose_name="Ticket",
        help_text="Ticket this message belongs to"
    )
    sender_user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='ticket_messages',
        db_index=True,
        verbose_name="Sender User",
        help_text="User who sent this message (if sender_type is user)"
    )
    sender_admin = models.ForeignKey(
        AdminProfile,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='ticket_messages',
        db_index=True,
        verbose_name="Sender Admin",
        help_text="Admin who sent this message (if sender_type is admin)"
    )
    
    class Meta(BaseModel.Meta):
        db_table = 'ticket_messages'
        verbose_name = "Ticket Message"
        verbose_name_plural = "Ticket Messages"
        ordering = ['created_at']
        indexes = [
            # Composite indexes for common query patterns
            models.Index(fields=['ticket', 'created_at']),
            models.Index(fields=['sender_type', 'created_at']),
            models.Index(fields=['is_read', 'created_at']),
        ]
    
    def __str__(self):
        return f"Message #{self.id} for Ticket #{self.ticket.id}"
    
    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)
        
        if is_new:
            self.ticket.last_replied_at = self.created_at
            self.ticket.save(update_fields=['last_replied_at'])
        
        if self.ticket_id:
            TicketCacheManager.invalidate_all(ticket_id=self.ticket.id)

