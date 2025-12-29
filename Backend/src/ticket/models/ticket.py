from django.db import models

from src.core.models import BaseModel
from src.user.models.user import User
from src.user.models.admin_profile import AdminProfile
from src.ticket.utils.cache import TicketCacheManager
from src.analytics.utils.cache import AnalyticsCacheManager

TICKET_STATUS_CHOICES = [
    ('open', 'Open'),
    ('in_progress', 'In Progress'),
    ('resolved', 'Resolved'),
    ('closed', 'Closed'),
]

TICKET_PRIORITY_CHOICES = [
    ('low', 'Low'),
    ('medium', 'Medium'),
    ('high', 'High'),
    ('urgent', 'Urgent'),
]


class Ticket(BaseModel):

    status = models.CharField(
        max_length=20,
        choices=TICKET_STATUS_CHOICES,
        default='open',
        db_index=True,
        verbose_name="Status",
        help_text="Current status of the ticket"
    )
    priority = models.CharField(
        max_length=20,
        choices=TICKET_PRIORITY_CHOICES,
        default='medium',
        db_index=True,
        verbose_name="Priority",
        help_text="Priority level of the ticket"
    )
    
    # 2. Primary Content Fields
    subject = models.CharField(
        max_length=500,
        db_index=True,
        verbose_name="Subject",
        help_text="Ticket subject"
    )
    
    # 3. Description Fields
    description = models.TextField(
        verbose_name="Description",
        help_text="Detailed description of the ticket issue"
    )
    
    # 5. Relationships
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tickets',
        db_index=True,
        verbose_name="User",
        help_text="User who created this ticket"
    )
    assigned_admin = models.ForeignKey(
        AdminProfile,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_tickets',
        db_index=True,
        verbose_name="Assigned Admin",
        help_text="Admin user assigned to handle this ticket"
    )
    
    # Timestamp Fields
    last_replied_at = models.DateTimeField(
        null=True,
        blank=True,
        db_index=True,
        verbose_name="Last Replied At",
        help_text="Date and time when ticket was last replied to"
    )
    
    class Meta(BaseModel.Meta):
        db_table = 'tickets'
        verbose_name = "Ticket"
        verbose_name_plural = "Tickets"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'priority', '-created_at']),
            models.Index(fields=['status', 'user', '-created_at']),
            models.Index(fields=['status', 'assigned_admin', '-created_at']),
            models.Index(fields=['status', 'is_active']),
        ]
    
    def __str__(self):
        return f"Ticket #{self.id}: {self.subject}"
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if self.pk:
            TicketCacheManager.invalidate_all(ticket_id=self.id)
        AnalyticsCacheManager.invalidate_dashboard()
    
    def delete(self, *args, **kwargs):
        ticket_id = self.id
        super().delete(*args, **kwargs)
        TicketCacheManager.invalidate_all(ticket_id=ticket_id)
        AnalyticsCacheManager.invalidate_dashboard()

