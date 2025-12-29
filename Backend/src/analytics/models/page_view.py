from django.db import models
from src.core.models import BaseModel


class PageView(BaseModel):

    
    SOURCE_CHOICES = [
        ('web', 'Website'),
        ('app', 'Application'),
    ]
    source = models.CharField(max_length=10, choices=SOURCE_CHOICES, db_index=True)
    
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
    
    DEVICE_CHOICES = [
        ('mobile', 'Mobile'),
        ('desktop', 'Desktop'),
        ('tablet', 'Tablet'),
    ]
    device = models.CharField(max_length=10, choices=DEVICE_CHOICES, db_index=True)
    
    date = models.DateField(auto_now_add=True, db_index=True)
    
    class Meta:
        db_table = 'analytics_page_views'
        indexes = [
            models.Index(fields=['source', 'date']),
            models.Index(fields=['date', 'country']),
        ]
        ordering = ['-created_at']
