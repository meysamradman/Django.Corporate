from django.db import models
from django.contrib.postgres.indexes import BrinIndex
from src.core.models import BaseModel

class AdminPerformanceStatistics(BaseModel):
    
    admin = models.ForeignKey(
        'user.AdminProfile',
        on_delete=models.CASCADE,
        related_name='performance_stats'
    )
    year = models.PositiveIntegerField()
    month = models.PositiveIntegerField()
    
    tickets_resolved = models.PositiveIntegerField(default=0)
    emails_replied = models.PositiveIntegerField(default=0)
    avg_response_time_minutes = models.PositiveIntegerField(default=0)
    
    properties_created = models.PositiveIntegerField(default=0)
    blogs_created = models.PositiveIntegerField(default=0)
    portfolios_created = models.PositiveIntegerField(default=0)
    
    login_count = models.PositiveIntegerField(default=0)
    
    class Meta:
        db_table = 'admin_performance_statistics'
        unique_together = ('admin', 'year', 'month')
        verbose_name = 'Admin Performance Statistics'
        verbose_name_plural = 'Admin Performance Statistics'
        ordering = ['-year', '-month', 'admin']
        indexes = [
            models.Index(fields=['year', 'month']),
        ]

    def __str__(self):
        return f"{self.admin} - {self.year}/{self.month}"
