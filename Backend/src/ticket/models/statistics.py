from django.db import models
from django.contrib.postgres.indexes import BrinIndex

class TicketStatistics(models.Model):
    
    date = models.DateField(unique=True, db_index=True)
    
    total_created = models.PositiveIntegerField(default=0)
    total_closed = models.PositiveIntegerField(default=0)
    
    avg_response_time_minutes = models.PositiveIntegerField(default=0)
    
    priority_distribution = models.JSONField(default=dict, blank=True)
    status_distribution = models.JSONField(default=dict, blank=True)
    
    class Meta:
        db_table = 'ticket_statistics'
        verbose_name = 'Ticket Statistics'
        verbose_name_plural = 'Ticket Statistics'
        ordering = ['-date']
        indexes = [
            BrinIndex(fields=['date']),
        ]

    def __str__(self):
        return f"Ticket Stats - {self.date}"
