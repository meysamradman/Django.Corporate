from django.db import models
from django.core.cache import cache
from src.core.models import BaseModel
from src.user.models.user import User
from src.user.models.admin_profile import AdminProfile

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
    subject = models.CharField(max_length=500, db_index=True, verbose_name="Subject")
    description = models.TextField(verbose_name="Description")
    status = models.CharField(
        max_length=20,
        choices=TICKET_STATUS_CHOICES,
        default='open',
        db_index=True,
        verbose_name="Status"
    )
    priority = models.CharField(
        max_length=20,
        choices=TICKET_PRIORITY_CHOICES,
        default='medium',
        db_index=True,
        verbose_name="Priority"
    )
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tickets',
        verbose_name="User"
    )
    assigned_admin = models.ForeignKey(
        AdminProfile,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_tickets',
        verbose_name="Assigned Admin"
    )
    last_replied_at = models.DateTimeField(null=True, blank=True, verbose_name="Last Replied At")
    
    class Meta:
        verbose_name = "Ticket"
        verbose_name_plural = "Tickets"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'created_at'], name='ticket_status_created_idx'),
            models.Index(fields=['priority', 'status'], name='ticket_priority_status_idx'),
            models.Index(fields=['user', 'status'], name='ticket_user_status_idx'),
            models.Index(fields=['assigned_admin', 'status'], name='ticket_admin_status_idx'),
            models.Index(fields=['is_active', 'status'], name='ticket_active_status_idx'),
        ]
    
    def __str__(self):
        return f"Ticket #{self.id}: {self.subject}"
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if self.pk:
            cache.delete(f'ticket:{self.id}')
            cache.delete('ticket:stats')
    
    def delete(self, *args, **kwargs):
        ticket_id = self.id
        super().delete(*args, **kwargs)
        cache.delete(f'ticket:{ticket_id}')
        cache.delete('ticket:stats')

