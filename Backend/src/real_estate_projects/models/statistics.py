from django.db import models
from django.contrib.postgres.indexes import BrinIndex

from src.analytics.choices import ANALYTICS_SOURCE_CHOICES


class RealEstateProjectStatistics(models.Model):
    project = models.ForeignKey(
        "real_estate_projects.RealEstateProject",
        on_delete=models.CASCADE,
        related_name="daily_stats",
        db_index=True,
        verbose_name="Project",
    )
    date = models.DateField(
        db_index=True,
        verbose_name="Date",
    )

    views = models.PositiveIntegerField(default=0, verbose_name="Views")
    unique_views = models.PositiveIntegerField(default=0, verbose_name="Unique Views")
    favorites = models.PositiveIntegerField(default=0, verbose_name="Favorites")
    inquiries = models.PositiveIntegerField(default=0, verbose_name="Inquiries")
    shares = models.PositiveIntegerField(default=0, verbose_name="Shares")

    web_views = models.PositiveIntegerField(default=0, verbose_name="Web Views")
    app_views = models.PositiveIntegerField(default=0, verbose_name="App Views")

    countries = models.JSONField(default=dict, blank=True)
    platforms = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "real_estate_project_statistics"
        verbose_name = "Real Estate Project Statistics"
        verbose_name_plural = "Real Estate Project Statistics"
        unique_together = [["project", "date"]]
        ordering = ["-date"]
        indexes = [
            models.Index(fields=["project", "-date"]),
            models.Index(fields=["date"]),
            BrinIndex(fields=["date"]),
        ]

    def __str__(self):
        return f"{self.project.title} - {self.date}"


class RealEstateProjectViewLog(models.Model):
    project = models.ForeignKey(
        "real_estate_projects.RealEstateProject",
        on_delete=models.CASCADE,
        related_name="view_logs",
        db_index=True,
        verbose_name="Project",
    )
    source = models.CharField(
        max_length=10,
        choices=ANALYTICS_SOURCE_CHOICES,
        default="web",
        db_index=True,
        verbose_name="Source",
    )
    site_id = models.CharField(max_length=50, default="default", db_index=True)

    user = models.ForeignKey(
        "user.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="project_views",
        verbose_name="User",
    )

    ip_address = models.GenericIPAddressField(db_index=True, verbose_name="IP Address")
    country = models.CharField(max_length=5, blank=True, db_index=True)
    device = models.CharField(max_length=20, blank=True, db_index=True)
    browser = models.CharField(max_length=50, blank=True)
    os = models.CharField(max_length=50, blank=True)
    user_agent = models.TextField(blank=True, verbose_name="User Agent")
    referrer = models.URLField(blank=True, null=True, verbose_name="Referrer")
    viewed_at = models.DateTimeField(auto_now_add=True, db_index=True, verbose_name="Viewed At")

    class Meta:
        db_table = "real_estate_project_view_logs"
        verbose_name = "Real Estate Project View Log"
        verbose_name_plural = "Real Estate Project View Logs"
        ordering = ["-viewed_at"]
        indexes = [
            models.Index(fields=["project", "-viewed_at"]),
            models.Index(fields=["user", "-viewed_at"]),
            models.Index(fields=["-viewed_at"]),
            BrinIndex(fields=["viewed_at"]),
        ]

    def __str__(self):
        user_value = self.user.email if self.user else self.ip_address
        return f"{self.project.title} - {user_value} - {self.viewed_at}"
