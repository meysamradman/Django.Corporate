from django.db import models
from django.contrib.postgres.indexes import BrinIndex

class TicketStatistics(models.Model):
    """
    آمار روزانه تیکت‌ها برای سرعت بالای داشبورد
    """
    date = models.DateField(unique=True, db_index=True)
    
    # Volume metrics
    total_created = models.PositiveIntegerField(default=0)
    total_closed = models.PositiveIntegerField(default=0)
    
    # Performance metrics
    avg_response_time_minutes = models.PositiveIntegerField(default=0)
    
    # Distributions
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
