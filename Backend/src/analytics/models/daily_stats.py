from django.db import models


class DailyStats(models.Model):
    
    date = models.DateField(unique=True, db_index=True)
    
    total_visits = models.PositiveIntegerField(default=0)
    unique_visitors = models.PositiveIntegerField(default=0)
    
    web_visits = models.PositiveIntegerField(default=0)
    app_visits = models.PositiveIntegerField(default=0)
    
    mobile_visits = models.PositiveIntegerField(default=0)
    desktop_visits = models.PositiveIntegerField(default=0)
    
    top_pages = models.JSONField(default=dict)
    top_countries = models.JSONField(default=dict)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'analytics_daily_stats'
        ordering = ['-date']
