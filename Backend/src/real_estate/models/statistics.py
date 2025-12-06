from django.db import models
from django.contrib.postgres.indexes import BrinIndex


class PropertyStatistics(models.Model):
    property = models.ForeignKey(
        'real_estate.Property',
        on_delete=models.CASCADE,
        related_name='daily_stats',
        db_index=True,
        verbose_name="Property",
        help_text="Property these statistics belong to"
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
    inquiries = models.IntegerField(
        default=0,
        verbose_name="Inquiries",
        help_text="Number of inquiries on this date"
    )
    shares = models.IntegerField(
        default=0,
        verbose_name="Shares",
        help_text="Number of shares on this date"
    )
    
    class Meta:
        db_table = 'real_estate_property_statistics'
        verbose_name = 'Property Statistics'
        verbose_name_plural = 'Property Statistics'
        unique_together = [['property', 'date']]
        ordering = ['-date']
        indexes = [
            models.Index(fields=['property', '-date']),
            models.Index(fields=['date']),
            BrinIndex(fields=['date']),
        ]
    
    def __str__(self):
        return f"{self.property.title} - {self.date}"


class AgentStatistics(models.Model):
    agent = models.ForeignKey(
        'real_estate.PropertyAgent',
        on_delete=models.CASCADE,
        related_name='monthly_stats',
        db_index=True,
        verbose_name="Agent",
        help_text="Agent these statistics belong to"
    )
    year = models.IntegerField(
        db_index=True,
        verbose_name="Year",
        help_text="Year for these statistics"
    )
    month = models.IntegerField(
        db_index=True,
        verbose_name="Month",
        help_text="Month for these statistics (1-12)"
    )
    
    properties_listed = models.IntegerField(
        default=0,
        verbose_name="Properties Listed",
        help_text="Number of properties listed this month"
    )
    properties_sold = models.IntegerField(
        default=0,
        verbose_name="Properties Sold",
        help_text="Number of properties sold this month"
    )
    properties_rented = models.IntegerField(
        default=0,
        verbose_name="Properties Rented",
        help_text="Number of properties rented this month"
    )
    total_sales_value = models.BigIntegerField(
        default=0,
        verbose_name="Total Sales Value",
        help_text="Total value of sales this month"
    )
    total_commissions = models.BigIntegerField(
        default=0,
        verbose_name="Total Commissions",
        help_text="Total commissions earned this month"
    )
    
    class Meta:
        db_table = 'real_estate_agent_statistics'
        verbose_name = 'Agent Statistics'
        verbose_name_plural = 'Agent Statistics'
        unique_together = [['agent', 'year', 'month']]
        ordering = ['-year', '-month']
        indexes = [
            models.Index(fields=['agent', '-year', '-month']),
            models.Index(fields=['year', 'month']),
        ]
    
    def __str__(self):
        return f"{self.agent.full_name} - {self.year}/{self.month:02d}"
