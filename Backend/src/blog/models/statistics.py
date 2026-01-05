from django.db import models
from django.contrib.postgres.indexes import BrinIndex
from src.analytics.choices import ANALYTICS_SOURCE_CHOICES


class BlogStatistics(models.Model):
    blog = models.ForeignKey(
        'blog.Blog',
        on_delete=models.CASCADE,
        related_name='daily_stats',
        db_index=True,
        verbose_name="Blog",
        help_text="Blog post these statistics belong to"
    )
    date = models.DateField(
        db_index=True,
        verbose_name="Date",
        help_text="Date for these statistics"
    )
    
    views = models.IntegerField(
        default=0,
        verbose_name="Views",
        help_text="Total views on this date"
    )
    unique_views = models.IntegerField(
        default=0,
        verbose_name="Unique Views",
        help_text="Unique views on this date"
    )
    favorites = models.IntegerField(
        default=0,
        verbose_name="Favorites",
        help_text="Number of favorites on this date"
    )
    shares = models.IntegerField(
        default=0,
        verbose_name="Shares",
        help_text="Number of shares on this date"
    )
    
    # Source breakdown
    web_views = models.IntegerField(
        default=0,
        verbose_name="Web Views",
        help_text="Views from website on this date"
    )
    app_views = models.IntegerField(
        default=0,
        verbose_name="App Views",
        help_text="Views from app on this date"
    )
    
    # Distributions
    countries = models.JSONField(default=dict, blank=True)
    platforms = models.JSONField(default=dict, blank=True)
    
    class Meta:
        db_table = 'blog_statistics'
        verbose_name = 'Blog Statistics'
        verbose_name_plural = 'Blog Statistics'
        unique_together = [['blog', 'date']]
        ordering = ['-date']
        indexes = [
            models.Index(fields=['blog', '-date']),
            models.Index(fields=['date']),
            BrinIndex(fields=['date']),
        ]
    
    def __str__(self):
        return f"{self.blog.title} - {self.date}"


class BlogViewLog(models.Model):
    """
    لاگ بازدیدهای وبلاگ (برای آمارهای دقیق‌تر)
    """
    blog = models.ForeignKey(
        'blog.Blog',
        on_delete=models.CASCADE,
        related_name='view_logs',
        db_index=True,
        verbose_name="Blog"
    )
    
    source = models.CharField(
        max_length=10,
        choices=ANALYTICS_SOURCE_CHOICES,
        default='web',
        db_index=True,
        verbose_name="Source"
    )
    site_id = models.CharField(max_length=50, default='default', db_index=True)
    
    user = models.ForeignKey(
        'user.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='blog_views',
        verbose_name="User",
        help_text="User who viewed (if authenticated)"
    )
    
    # Anonymous tracking
    ip_address = models.GenericIPAddressField(
        db_index=True,
        verbose_name="IP Address"
    )
    country = models.CharField(max_length=5, blank=True, db_index=True)
    device = models.CharField(max_length=20, blank=True, db_index=True)
    browser = models.CharField(max_length=50, blank=True)
    os = models.CharField(max_length=50, blank=True)
    
    user_agent = models.TextField(
        blank=True,
        verbose_name="User Agent",
        help_text="Browser user agent string"
    )
    
    # Referrer tracking
    referrer = models.URLField(
        blank=True,
        null=True,
        verbose_name="Referrer",
        help_text="URL of the referrer page"
    )
    
    # Timestamp
    viewed_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        verbose_name="Viewed At"
    )
    
    class Meta:
        db_table = 'blog_view_logs'
        verbose_name = 'Blog View Log'
        verbose_name_plural = 'Blog View Logs'
        ordering = ['-viewed_at']
        indexes = [
            models.Index(fields=['blog', '-viewed_at']),
            models.Index(fields=['user', '-viewed_at']),
            models.Index(fields=['-viewed_at']),
            BrinIndex(fields=['viewed_at']),
        ]
    
    def __str__(self):
        user_str = self.user.email if self.user else self.ip_address
        return f"{self.blog.title} - {user_str} - {self.viewed_at}"
