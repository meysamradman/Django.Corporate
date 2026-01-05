from django.db import models
from src.core.models import BaseModel
from src.analytics.choices import ANALYTICS_SOURCE_CHOICES, DEVICE_CHOICES


class PageView(BaseModel):

    source = models.CharField(max_length=10, choices=ANALYTICS_SOURCE_CHOICES, db_index=True)
    site_id = models.CharField(max_length=50, default='default', db_index=True)
    
    path = models.CharField(max_length=500, db_index=True)
    
    user = models.ForeignKey(
        'user.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_index=True
    )
    session_id = models.CharField(max_length=64, db_index=True)
    
    ip = models.GenericIPAddressField()
    country = models.CharField(max_length=2, db_index=True, blank=True)
    
    device = models.CharField(max_length=10, choices=DEVICE_CHOICES, db_index=True)
    
    date = models.DateField(auto_now_add=True, db_index=True)
    
    class Meta:
        db_table = 'analytics_page_views'
        indexes = [
            models.Index(fields=['source', 'date']),
            models.Index(fields=['date', 'country']),
        ]
        ordering = ['-created_at']
