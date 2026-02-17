from django.db import models

class DailyStats(models.Model):
    
    date = models.DateField(db_index=True)
    
    total_visits = models.PositiveIntegerField(default=0)
    unique_visitors = models.PositiveIntegerField(default=0)
    
    web_visits = models.PositiveIntegerField(default=0)
    app_visits = models.PositiveIntegerField(default=0)
    
    mobile_visits = models.PositiveIntegerField(default=0)
    desktop_visits = models.PositiveIntegerField(default=0)
    tablet_visits = models.PositiveIntegerField(default=0)
    
    sources_distribution = models.JSONField(default=dict, blank=True)
    
    site_id = models.CharField(max_length=50, default='default', db_index=True)
    
    top_pages = models.JSONField(default=dict)
    top_countries = models.JSONField(default=dict)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'analytics_daily_stats'
        ordering = ['-date']
        constraints = [
            models.UniqueConstraint(fields=['date', 'site_id'], name='analytics_daily_stats_date_site_uniq')
        ]
