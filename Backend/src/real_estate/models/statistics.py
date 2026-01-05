from django.db import models
from django.contrib.postgres.indexes import BrinIndex
from src.analytics.choices import ANALYTICS_SOURCE_CHOICES


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
    
    # Advanced KPIs (Professional Scenario)
    conversion_rate = models.DecimalField(
        max_digits=5, decimal_places=2, default=0,
        verbose_name="Conversion Rate (%)",
        help_text="Percentage of inquiries converted to deals"
    )
    avg_deal_time = models.IntegerField(
        default=0,
        verbose_name="Avg Deal Time (Days)",
        help_text="Average days from listing to closing"
    )
    lead_to_contract_rate = models.DecimalField(
        max_digits=5, decimal_places=2, default=0,
        verbose_name="Lead-to-Contract Rate (%)"
    )
    failure_rate = models.DecimalField(
        max_digits=5, decimal_places=2, default=0,
        verbose_name="Deal Failure Rate (%)",
        help_text="Percentage of cancelled/failed deals"
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


class AgencyStatistics(models.Model):
    """
    آمار ماهانه آژانس‌ها
    """
    agency = models.ForeignKey(
        'real_estate.RealEstateAgency',
        on_delete=models.CASCADE,
        related_name='monthly_stats',
        db_index=True,
        verbose_name="Agency",
        help_text="Agency these statistics belong to"
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
    
    # Monthly metrics
    active_agents = models.IntegerField(
        default=0,
        verbose_name="Active Agents",
        help_text="Number of active agents this month"
    )
    properties_listed = models.IntegerField(
        default=0,
        verbose_name="Properties Listed",
        help_text="Total properties listed by agency this month"
    )
    properties_sold = models.IntegerField(
        default=0,
        verbose_name="Properties Sold",
        help_text="Total properties sold this month"
    )
    properties_rented = models.IntegerField(
        default=0,
        verbose_name="Properties Rented",
        help_text="Total properties rented this month"
    )
    total_sales_value = models.BigIntegerField(
        default=0,
        verbose_name="Total Sales Value",
        help_text="Total value of all sales this month"
    )
    total_commissions = models.BigIntegerField(
        default=0,
        verbose_name="Total Commissions",
        help_text="Total commissions earned by agency this month"
    )
    new_clients = models.IntegerField(
        default=0,
        verbose_name="New Clients",
        help_text="Number of new clients acquired this month"
    )
    
    # Advanced KPIs (Professional Scenario)
    conversion_rate = models.DecimalField(
        max_digits=5, decimal_places=2, default=0,
        verbose_name="Agency Conversion Rate (%)"
    )
    avg_deal_time = models.IntegerField(
        default=0,
        verbose_name="Avg Deal Time (Days)"
    )
    market_share_growth = models.DecimalField(
        max_digits=5, decimal_places=2, default=0,
        verbose_name="Market Share Growth (%)"
    )
    
    class Meta:
        db_table = 'real_estate_agency_statistics'
        verbose_name = 'Agency Statistics'
        verbose_name_plural = 'Agency Statistics'
        unique_together = [['agency', 'year', 'month']]
        ordering = ['-year', '-month']
        indexes = [
            models.Index(fields=['agency', '-year', '-month']),
            models.Index(fields=['year', 'month']),
        ]
    
    def __str__(self):
        return f"{self.agency.name} - {self.year}/{self.month:02d}"


class PropertyViewLog(models.Model):
    """
    لاگ بازدیدهای املاک (برای آمارهای دقیق‌تر)
    
    توجه: این جدول می‌تواند خیلی بزرگ شود
    باید از time-series database یا partitioning استفاده کرد
    """
    property = models.ForeignKey(
        'real_estate.Property',
        on_delete=models.CASCADE,
        related_name='view_logs',
        db_index=True,
        verbose_name="Property"
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
        related_name='property_views',
        verbose_name="User",
        help_text="User who viewed (if authenticated)"
    )
    
    # Anonymous tracking
    ip_address = models.GenericIPAddressField(
        db_index=True,
        verbose_name="IP Address",
        help_text="IP address of the viewer"
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
        db_table = 'real_estate_property_view_logs'
        verbose_name = 'Property View Log'
        verbose_name_plural = 'Property View Logs'
        ordering = ['-viewed_at']
        indexes = [
            models.Index(fields=['property', '-viewed_at']),
            models.Index(fields=['user', '-viewed_at']),
            models.Index(fields=['-viewed_at']),
            BrinIndex(fields=['viewed_at']),  # PostgreSQL BRIN for time-series
        ]
        # Consider partitioning by date for large datasets
    
    def __str__(self):
        user_str = self.user.email if self.user else self.ip_address
        return f"{self.property.title} - {user_str} - {self.viewed_at}"


class PropertyInquiry(models.Model):
    """
    استعلام‌های املاک (درخواست اطلاعات بیشتر)
    """
    property = models.ForeignKey(
        'real_estate.Property',
        on_delete=models.CASCADE,
        related_name='inquiries',
        db_index=True,
        verbose_name="Property"
    )
    user = models.ForeignKey(
        'user.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='property_inquiries',
        verbose_name="User"
    )
    
    # Contact info (for anonymous users)
    name = models.CharField(
        max_length=200,
        verbose_name="Name"
    )
    email = models.EmailField(
        verbose_name="Email"
    )
    phone = models.CharField(
        max_length=20,
        blank=True,
        verbose_name="Phone"
    )
    
    # Inquiry details
    message = models.TextField(
        verbose_name="Message"
    )
    inquiry_type = models.CharField(
        max_length=50,
        choices=[
            ('info', 'Request Information'),
            ('visit', 'Schedule Visit'),
            ('offer', 'Make Offer'),
            ('other', 'Other')
        ],
        default='info',
        verbose_name="Inquiry Type"
    )
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=[
            ('new', 'New'),
            ('contacted', 'Contacted'),
            ('closed', 'Closed')
        ],
        default='new',
        db_index=True,
        verbose_name="Status"
    )
    
    # Timestamps
    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        verbose_name="Created At"
    )
    responded_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Responded At"
    )
    
    class Meta:
        db_table = 'real_estate_property_inquiries'
        verbose_name = 'Property Inquiry'
        verbose_name_plural = 'Property Inquiries'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['property', '-created_at']),
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['-created_at']),
        ]
    
    def __str__(self):
        return f"{self.property.title} - {self.name} - {self.created_at}"


class PropertyTypeStatistics(models.Model):
    """
    آمار تجمیعی روزانه بر اساس نوع ملک (آپارتمان، ویلا و ...)
    برای تحلیل تقاضای بازار
    """
    property_type = models.ForeignKey(
        'real_estate.PropertyType',
        on_delete=models.CASCADE,
        related_name='daily_stats',
        db_index=True
    )
    date = models.DateField(db_index=True)
    
    views = models.PositiveIntegerField(default=0)
    inquiries = models.PositiveIntegerField(default=0)
    favorites = models.PositiveIntegerField(default=0)
    
    class Meta:
        db_table = 'real_estate_property_type_stats'
        unique_together = [['property_type', 'date']]
        ordering = ['-date']
        indexes = [
            models.Index(fields=['property_type', '-date']),
            BrinIndex(fields=['date']),
        ]

    def __str__(self):
        return f"{self.property_type.title} - {self.date}"


class PropertyStateStatistics(models.Model):
    """
    آمار تجمیعی روزانه بر اساس وضعیت ملک (فروشی، اجاره‌ای و ...)
    برای تحلیل رفتار بازار
    """
    state = models.ForeignKey(
        'real_estate.PropertyState',
        on_delete=models.CASCADE,
        related_name='daily_stats',
        db_index=True
    )
    date = models.DateField(db_index=True)
    
    views = models.PositiveIntegerField(default=0)
    inquiries = models.PositiveIntegerField(default=0)
    favorites = models.PositiveIntegerField(default=0)
    
    class Meta:
        db_table = 'real_estate_property_state_stats'
        unique_together = [['state', 'date']]
        ordering = ['-date']
        indexes = [
            models.Index(fields=['state', '-date']),
            BrinIndex(fields=['date']),
        ]

    def __str__(self):
        return f"{self.state.title} - {self.date}"


class RegionalStatistics(models.Model):
    """
    آمار تجمیعی منطقه‌ای (استان، شهر، منطقه)
    برای تحلیل مناطق پرطرفدار و قیمت‌های میانگین
    """
    province = models.ForeignKey('core.Province', on_delete=models.CASCADE)
    city = models.ForeignKey('core.City', on_delete=models.CASCADE)
    region = models.ForeignKey('real_estate.CityRegion', on_delete=models.CASCADE, null=True, blank=True)
    
    date = models.DateField(db_index=True)
    
    # Engagement
    views = models.PositiveIntegerField(default=0)
    inquiries = models.PositiveIntegerField(default=0)
    
    # Market Data (Snapshots)
    avg_price_sale = models.BigIntegerField(default=0) # میانگین قیمت فروش
    avg_rent_monthly = models.BigIntegerField(default=0) # میانگین اجاره ماهانه
    total_active_listings = models.PositiveIntegerField(default=0)
    
    class Meta:
        db_table = 'real_estate_regional_stats'
        unique_together = [['province', 'city', 'region', 'date']]
        ordering = ['-date']
        indexes = [
            models.Index(fields=['province', 'city', 'region', '-date']),
            BrinIndex(fields=['date']),
        ]

    def __str__(self):
        location = f"{self.province.name} > {self.city.name}"
        if self.region:
            location += f" (Region {self.region.code})"
        return f"{location} - {self.date}"
