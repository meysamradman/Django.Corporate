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
    ticket = models.ForeignKey(
        Ticket,
        on_delete=models.CASCADE,
        related_name='messages',
        verbose_name="Ticket"
    )
    message = models.TextField(verbose_name="Message")
    sender_type = models.CharField(
        max_length=10,
        choices=SENDER_TYPE_CHOICES,
        db_index=True,
        verbose_name="Sender Type"
    )
    sender_user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='ticket_messages',
        verbose_name="Sender User"
    )
    sender_admin = models.ForeignKey(
        AdminProfile,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='ticket_messages',
        verbose_name="Sender Admin"
    )
    is_read = models.BooleanField(default=False, db_index=True, verbose_name="Is Read")
    
    class Meta:
        verbose_name = "Ticket Message"
        verbose_name_plural = "Ticket Messages"
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['ticket', 'created_at'], name='ticket_msg_ticket_created_idx'),
            models.Index(fields=['sender_type', 'created_at'], name='ticket_msg_sender_created_idx'),
            models.Index(fields=['is_read', 'created_at'], name='ticket_msg_read_created_idx'),
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
            # ✅ Use Cache Manager for standardized cache invalidation
            # Invalidate ticket cache and stats (unanswered count changes)
            TicketCacheManager.invalidate_all(ticket_id=self.ticket.id)

