from django.db import models
from django.contrib.postgres.indexes import BrinIndex

class EmailStatistics(models.Model):
    """
    آمار روزانه ایمیل‌ها برای سرعت بالای داشبورد
    """
    date = models.DateField(unique=True, db_index=True)
    
    # Volume metrics
    total_received = models.PositiveIntegerField(default=0)
    total_replied = models.PositiveIntegerField(default=0)
    
    # Status breakdown (JSON for flexibility and speed)
    status_distribution = models.JSONField(default=dict, blank=True)
    
    # Source breakdown (Website, App, etc.)
    source_distribution = models.JSONField(default=dict, blank=True)
    
    class Meta:
        db_table = 'email_statistics'
        verbose_name = 'Email Statistics'
        verbose_name_plural = 'Email Statistics'
        ordering = ['-date']
        indexes = [
            BrinIndex(fields=['date']),
        ]

    def __str__(self):
        return f"Email Stats - {self.date}"
