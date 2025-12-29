from django.db import models
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from django.contrib.postgres.indexes import GinIndex, BrinIndex
from django.contrib.postgres.search import SearchVectorField
from django.db.models import Q
from src.core.models import BaseModel, Country, Province, City
from src.real_estate.models.seo import SEOMixin
from src.real_estate.models.location import CityRegion
from src.real_estate.models.type import PropertyType
from src.real_estate.models.state import PropertyState
from src.real_estate.models.label import PropertyLabel
from src.real_estate.models.feature import PropertyFeature
from src.real_estate.models.tag import PropertyTag
from src.real_estate.models.agency import RealEstateAgency
from src.real_estate.models.agent import PropertyAgent
from src.real_estate.utils.cache import PropertyCacheKeys, PropertyCacheManager
from src.real_estate.models.managers import PropertyQuerySet


class Property(BaseModel, SEOMixin):
    
    title = models.CharField(
        max_length=200,
        db_index=True,
        verbose_name="Title",
        help_text="Property title"
    )
    short_description = models.CharField(
        max_length=300,
        blank=True,
        verbose_name="Short Description",
        help_text="Brief summary of the property"
    )
    description = models.TextField(
        verbose_name="Description",
        help_text="Full property description"
    )
    slug = models.SlugField(
        max_length=200,
        unique=True,
        db_index=True,
        allow_unicode=True,
        verbose_name="URL Slug",
        help_text="URL-friendly identifier"
    )
    
    agent = models.ForeignKey(
        PropertyAgent,
        on_delete=models.PROTECT,
        related_name='properties',
        db_index=True,
        verbose_name="Agent",
        help_text="Agent responsible for this property"
    )
    agency = models.ForeignKey(
        RealEstateAgency,
        on_delete=models.PROTECT,
        related_name='properties',
        null=True,
        blank=True,
        db_index=True,
        verbose_name="Agency",
        help_text="Agency this property belongs to"
    )

    property_type = models.ForeignKey(
        PropertyType,
        on_delete=models.PROTECT,
        related_name='properties',
        db_index=True,
        verbose_name="Property Type",
        help_text="Type of property (Apartment, Villa, etc.)"
    )
    state = models.ForeignKey(
        PropertyState,
        on_delete=models.PROTECT,
        related_name='properties',
        db_index=True,
        verbose_name="State",
        help_text="Property state (For Sale, For Rent, etc.)"
    )
    labels = models.ManyToManyField(
        PropertyLabel,
        blank=True,
        related_name='properties',
        verbose_name="Labels",
        help_text="Property labels (Featured, Hot Deal, etc.)"
    )
    tags = models.ManyToManyField(
        PropertyTag,
        blank=True,
        related_name='properties',
        verbose_name="Tags",
        help_text="Flexible tags for the property"
    )
    features = models.ManyToManyField(
        PropertyFeature,
        blank=True,
        related_name='properties',
        verbose_name="Features",
        help_text="Property features (Parking, Elevator, etc.)"
    )
    
    region = models.ForeignKey(
        CityRegion,
        on_delete=models.SET_NULL,
        related_name='properties',
        null=True,
        blank=True,
        db_index=True,
        verbose_name="Region",
        help_text="City region (only for major cities like Tehran)"
    )

    # محله به صورت متنی آزاد (ساده و سریع)
    neighborhood = models.CharField(
        max_length=120,
        blank=True,
        db_index=True,
        verbose_name="Neighborhood",
        help_text="Neighborhood name as text (from map or user input)"
    )
    city = models.ForeignKey(
        City,
        on_delete=models.PROTECT,
        related_name='real_estate_properties',
        db_index=True,
        verbose_name="City",
        help_text="City where property is located (denormalized for performance)"
    )
    province = models.ForeignKey(
        Province,
        on_delete=models.PROTECT,
        related_name='real_estate_properties',
        db_index=True,
        verbose_name="Province",
        help_text="Province where property is located (denormalized for performance)"
    )
    country = models.ForeignKey(
        Country,
        on_delete=models.PROTECT,
        related_name='properties',
        db_index=True,
        verbose_name="Country",
        help_text="Country where property is located (denormalized for performance)"
    )
    address = models.TextField(
        verbose_name="Address",
        help_text="Full address of the property"
    )
    postal_code = models.CharField(
        max_length=20,
        blank=True,
        db_index=True,
        verbose_name="Postal Code",
        help_text="Postal or ZIP code"
    )
    latitude = models.DecimalField(
        max_digits=10,
        decimal_places=8,
        null=True,
        blank=True,
        db_index=True,
        verbose_name="Latitude",
        help_text="Geographic latitude (for map selection and reverse geocoding)"
    )
    longitude = models.DecimalField(
        max_digits=11,
        decimal_places=8,
        null=True,
        blank=True,
        db_index=True,
        verbose_name="Longitude",
        help_text="Geographic longitude (for map selection and reverse geocoding)"
    )
    
    price = models.BigIntegerField(
        null=True,
        blank=True,
        db_index=True,
        verbose_name="Price",
        help_text="Property price (in smallest currency unit)"
    )
    sale_price = models.BigIntegerField(
        null=True,
        blank=True,
        db_index=True,
        verbose_name="Sale Price",
        help_text="Sale price (in smallest currency unit)"
    )
    pre_sale_price = models.BigIntegerField(
        null=True,
        blank=True,
        db_index=True,
        verbose_name="Pre Sale Price",
        help_text="Pre-sale price (in smallest currency unit)"
    )
    price_per_sqm = models.IntegerField(
        null=True,
        blank=True,
        db_index=True,
        editable=False,
        verbose_name="Price per SQM",
        help_text="Price per square meter (auto-calculated)"
    )
    currency = models.CharField(
        max_length=3,
        default='USD',
        db_index=True,
        verbose_name="Currency",
        help_text="Currency code (USD, EUR, etc.)"
    )
    is_negotiable = models.BooleanField(
        default=True,
        verbose_name="Negotiable",
        help_text="Whether price is negotiable"
    )
    
    monthly_rent = models.BigIntegerField(
        null=True,
        blank=True,
        db_index=True,
        verbose_name="Monthly Rent",
        help_text="Monthly rent amount (for rental properties)"
    )
    rent_amount = models.BigIntegerField(
        null=True,
        blank=True,
        db_index=True,
        verbose_name="Rent Amount",
        help_text="Rent amount (for rental properties)"
    )
    mortgage_amount = models.BigIntegerField(
        null=True,
        blank=True,
        db_index=True,
        verbose_name="Mortgage Amount",
        help_text="Mortgage amount (for rental properties)"
    )
    security_deposit = models.BigIntegerField(
        null=True,
        blank=True,
        verbose_name="Security Deposit",
        help_text="Security deposit amount"
    )
    
    land_area = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        db_index=True,
        verbose_name="Land Area",
        help_text="Land area in square meters"
    )
    built_area = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        db_index=True,
        verbose_name="Built Area",
        help_text="Built area in square meters"
    )
    
    BEDROOM_CHOICES = [
        (0, 'استودیو / بدون خواب'),
        (1, '۱ خوابه'),
        (2, '۲ خوابه'),
        (3, '۳ خوابه'),
        (4, '۴ خوابه'),
        (5, '۵ خوابه'),
        (6, '۶ خوابه'),
        (7, '۷ خوابه'),
        (8, '۸ خوابه'),
        (9, '۹ خوابه'),
        (10, '۱۰ خوابه'),
        (11, '۱۱ خوابه'),
        (12, '۱۲ خوابه'),
        (13, '۱۳ خوابه'),
        (14, '۱۴ خوابه'),
        (15, '۱۵ خوابه'),
        (16, '۱۶ خوابه'),
        (17, '۱۷ خوابه'),
        (18, '۱۸ خوابه'),
        (19, '۱۹ خوابه'),
        (20, '۲۰+ خوابه'),
    ]
    
    bedrooms = models.SmallIntegerField(
        choices=BEDROOM_CHOICES,
        default=1,
        validators=[MinValueValidator(0), MaxValueValidator(20)],
        db_index=True,
        verbose_name="Bedrooms",
        help_text="Number of bedrooms (0 = Studio)"
    )
    
    BATHROOM_CHOICES = [
        (0, 'بدون سرویس بهداشتی'),
        (1, '۱ سرویس'),
        (2, '۲ سرویس'),
        (3, '۳ سرویس'),
        (4, '۴ سرویس'),
        (5, '۵ سرویس'),
        (6, '۶ سرویس'),
        (7, '۷ سرویس'),
        (8, '۸ سرویس'),
        (9, '۹ سرویس'),
        (10, '۱۰ سرویس'),
        (11, '۱۱ سرویس'),
        (12, '۱۲ سرویس'),
        (13, '۱۳ سرویس'),
        (14, '۱۴ سرویس'),
        (15, '۱۵ سرویس'),
        (16, '۱۶ سرویس'),
        (17, '۱۷ سرویس'),
        (18, '۱۸ سرویس'),
        (19, '۱۹ سرویس'),
        (20, '۲۰+ سرویس'),
    ]
    
    bathrooms = models.SmallIntegerField(
        choices=BATHROOM_CHOICES,
        default=1,
        validators=[MinValueValidator(0), MaxValueValidator(20)],
        db_index=True,
        verbose_name="Bathrooms",
        help_text="Number of bathrooms"
    )
    
    kitchens = models.SmallIntegerField(
        default=1,
        validators=[MinValueValidator(0), MaxValueValidator(10)],
        verbose_name="Kitchens",
        help_text="Number of kitchens"
    )
    living_rooms = models.SmallIntegerField(
        default=1,
        validators=[MinValueValidator(0), MaxValueValidator(10)],
        verbose_name="Living Rooms",
        help_text="Number of living rooms"
    )
    
    # =====================================================
    # ✅ OPTIMIZED: Year Built (سال شمسی - با CHOICES)
    # =====================================================
    YEAR_MIN = 1300
    YEAR_BUFFER = 5
    
    @classmethod
    def get_current_shamsi_year(cls):
        """دریافت سال شمسی فعلی"""
        try:
            import jdatetime
            return jdatetime.datetime.now().year
        except ImportError:
            from datetime import datetime
            return datetime.now().year - 621
    
    @classmethod
    def get_year_max(cls):
        """سال حداکثر: سال فعلی + 5 سال (پروژه‌های در دست ساخت)"""
        return cls.get_current_shamsi_year() + cls.YEAR_BUFFER
    
    @classmethod
    def get_year_built_choices(cls):
        """
        تولید CHOICES دینامیک برای year_built
        از سال جدید به قدیم (برای راحتی انتخاب)
        """
        year_max = cls.get_year_max()
        return [
            (year, f'{year}')
            for year in range(year_max, cls.YEAR_MIN - 1, -1)
        ]
    
    year_built = models.SmallIntegerField(
        null=True,
        blank=True,
        db_index=True,
        verbose_name="Year Built (Shamsi)",
        help_text="Year the property was built in Solar calendar (e.g., 1402). Updated automatically."
    )
    build_years = models.SmallIntegerField(
        null=True,
        blank=True,
        db_index=True,
        verbose_name="Build Years",
        help_text="Number of years since the property was built"
    )
    floors_in_building = models.SmallIntegerField(
        null=True,
        blank=True,
        verbose_name="Floors in Building",
        help_text="Total floors in the building"
    )
    
    # ✅ طبقه با همکف و زیرهمکف
    FLOOR_CHOICES = [
        (-2, 'زیرزمین دوم'),
        (-1, 'زیرزمین / زیرهمکف'),
        (0, 'همکف'),
        (1, 'طبقه ۱'),
        (2, 'طبقه ۲'),
        (3, 'طبقه ۳'),
        (4, 'طبقه ۴'),
        (5, 'طبقه ۵'),
        (6, 'طبقه ۶'),
        (7, 'طبقه ۷'),
        (8, 'طبقه ۸'),
        (9, 'طبقه ۹'),
        (10, 'طبقه ۱۰'),
        (11, 'طبقه ۱۱'),
        (12, 'طبقه ۱۲'),
        (13, 'طبقه ۱۳'),
        (14, 'طبقه ۱۴'),
        (15, 'طبقه ۱۵'),
        (16, 'طبقه ۱۶'),
        (17, 'طبقه ۱۷'),
        (18, 'طبقه ۱۸'),
        (19, 'طبقه ۱۹'),
        (20, 'طبقه ۲۰'),
        (21, 'طبقه ۲۱'),
        (22, 'طبقه ۲۲'),
        (23, 'طبقه ۲۳'),
        (24, 'طبقه ۲۴'),
        (25, 'طبقه ۲۵'),
        (30, 'طبقه ۳۰'),
        (35, 'طبقه ۳۵'),
        (40, 'طبقه ۴۰'),
        (45, 'طبقه ۴۵'),
        (50, 'طبقه ۵۰+'),
    ]
    
    floor_number = models.SmallIntegerField(
        null=True,
        blank=True,
        choices=FLOOR_CHOICES,
        db_index=True,
        verbose_name="Floor Number",
        help_text="Floor number of the property (-2 to 50, -1=Basement, 0=Ground floor)"
    )
    
    PARKING_CHOICES = [
        (0, 'بدون پارکینگ'),
        (1, '۱ پارکینگ'),
        (2, '۲ پارکینگ'),
        (3, '۳ پارکینگ'),
        (4, '۴ پارکینگ'),
        (5, '۵ پارکینگ'),
        (6, '۶ پارکینگ'),
        (7, '۷ پارکینگ'),
        (8, '۸ پارکینگ'),
        (9, '۹ پارکینگ'),
        (10, '۱۰ پارکینگ'),
        (11, '۱۱ پارکینگ'),
        (12, '۱۲ پارکینگ'),
        (13, '۱۳ پارکینگ'),
        (14, '۱۴ پارکینگ'),
        (15, '۱۵ پارکینگ'),
        (16, '۱۶ پارکینگ'),
        (17, '۱۷ پارکینگ'),
        (18, '۱۸ پارکینگ'),
        (19, '۱۹ پارکینگ'),
        (20, '۲۰+ پارکینگ'),
    ]
    
    parking_spaces = models.SmallIntegerField(
        choices=PARKING_CHOICES,
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(20)],
        db_index=True,
        verbose_name="Parking Spaces",
        help_text="Number of parking spaces"
    )
    # ✅ انباری با CHOICES (دارد/ندارد + تعداد)
    STORAGE_CHOICES = [
        (0, 'بدون انباری'),
        (1, '۱ انباری'),
        (2, '۲ انباری'),
        (3, '۳ انباری'),
        (4, '۴ انباری'),
        (5, '۵+ انباری'),
    ]
    
    storage_rooms = models.SmallIntegerField(
        choices=STORAGE_CHOICES,
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(5)],
        db_index=True,
        verbose_name="Storage Rooms",
        help_text="Number of storage rooms (0 = No storage)"
    )
    
    # ✅ نوع کاربری ملک (مسکونی، تجاری، اداری)
    USAGE_TYPE_CHOICES = [
        ('residential', 'مسکونی'),
        ('commercial', 'تجاری'),
        ('office', 'اداری'),
        ('industrial', 'صنعتی'),
        ('agricultural', 'کشاورزی'),
        ('warehouse', 'انبار'),
        ('clinic', 'مطب / کلینیک'),
        ('educational', 'آموزشی'),
        ('mixed', 'مختلط'),
    ]
    
    usage_type = models.CharField(
        max_length=20,
        choices=USAGE_TYPE_CHOICES,
        default='residential',
        db_index=True,
        verbose_name="Usage Type",
        help_text="Type of property usage (residential, commercial, office, etc.)"
    )
    
    # ✅ نوع سند (اداری، قولنامه‌ای، فاقد سند)
    DOCUMENT_TYPE_CHOICES = [
        ('official', 'سند اداری / ششدانگ'),
        ('pre_official', 'در حال اخذ سند'),
        ('contract', 'قولنامه‌ای'),
        ('cooperative', 'تعاونی'),
        ('agricultural', 'سند زراعی'),
        ('endowment', 'وقفی'),
        ('court', 'حکم دادگاه'),
        ('none', 'فاقد سند'),
    ]
    
    document_type = models.CharField(
        max_length=20,
        choices=DOCUMENT_TYPE_CHOICES,
        null=True,
        blank=True,
        db_index=True,
        verbose_name="Document Type",
        help_text="Type of property ownership document"
    )
    
    is_published = models.BooleanField(
        default=False,
        db_index=True,
        verbose_name="Published",
        help_text="Whether property is published"
    )
    is_featured = models.BooleanField(
        default=False,
        db_index=True,
        verbose_name="Featured",
        help_text="Whether property is featured"
    )
    is_public = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name="Public",
        help_text="Designates whether this property is publicly visible"
    )
    is_verified = models.BooleanField(
        default=False,
        db_index=True,
        verbose_name="Verified",
        help_text="Whether property is verified"
    )
    published_at = models.DateTimeField(
        null=True,
        blank=True,
        db_index=True,
        verbose_name="Published At",
        help_text="Date and time when property was published"
    )
    
    views_count = models.IntegerField(
        default=0,
        db_index=True,
        verbose_name="Views Count",
        help_text="Total number of views"
    )
    favorites_count = models.IntegerField(
        default=0,
        verbose_name="Favorites Count",
        help_text="Total number of favorites"
    )
    inquiries_count = models.IntegerField(
        default=0,
        verbose_name="Inquiries Count",
        help_text="Total number of inquiries"
    )
    
    search_vector = SearchVectorField(
        null=True,
        blank=True,
        verbose_name="Search Vector",
        help_text="Full-text search vector (PostgreSQL)"
    )
    
    # ═══════════════════════════════════════════════════
    # ✅ FLEXIBLE ATTRIBUTES: برای ویژگی‌های خاص هر نوع ملک
    # ═══════════════════════════════════════════════════
    extra_attributes = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Extra Attributes",
        help_text="""
        Flexible attributes for specific property types:
        
        • اجاره کوتاه مدت (Short-term Rental):
          {
            "short_term": {
              "capacity_standard": 4,
              "capacity_extra": 2,
              "weekday_price": 3000000,
              "weekend_price": 4500000,
              "price_per_extra_person": 500000
            }
          }
        
        • پیش فروش (Pre-sale):
          {
            "pre_sale": {
              "unit_type": "A",
              "document_status": "in_progress",
              "payment_plan": "24 months",
              "completion_year": 1404
            }
          }
        
        • پروژه‌های ساخت و ساز (Construction Projects):
          {
            "construction": {
              "current_status": "foundation",
              "location_status": "city_center",
              "partnership_type": "investment"
            }
          }
        """
    )
    
    objects = PropertyQuerySet.as_manager()
    
    class Meta(BaseModel.Meta, SEOMixin.Meta):
        db_table = 'real_estate_properties'
        verbose_name = 'Property'
        verbose_name_plural = 'Properties'
        ordering = ['-is_featured', '-published_at', '-created_at']
        indexes = [
            # ═══════════════════════════════════════════════════════════════════════
            # 🎯 PRIMARY INDEXES: 80% of queries use these (Optimized for 1M+ properties)
            # ═══════════════════════════════════════════════════════════════════════
            
            # 1. Main Search & Filter (Most Common Query Pattern)
            models.Index(
                fields=['is_published', 'is_public', 'city', 'property_type', 'bedrooms', '-price'],
                condition=models.Q(is_published=True, is_public=True, is_active=True),
                name='idx_main_search'
            ),
            
            # 2. Location-Based Search (City + Region + Neighborhood)
            models.Index(
                fields=['city', 'region', 'neighborhood', '-created_at'],
                condition=models.Q(is_published=True, is_public=True),
                name='idx_location_search'
            ),
            
            # 3. Price Range Filter (Most Filtered Field)
            models.Index(
                fields=['is_published', 'is_public', 'price', 'sale_price', 'monthly_rent'],
                condition=models.Q(is_published=True, is_public=True),
                name='idx_price_range'
            ),
            
            # 4. Property Details Filter (Year, Floor, Parking, Storage)
            models.Index(
                fields=['city', 'year_built', 'floor_number', 'parking_spaces', 'storage_rooms'],
                condition=models.Q(is_published=True, year_built__isnull=False),
                name='idx_property_details'
            ),
            
            # 5. Usage & Document Type Filter (Commercial/Residential)
            models.Index(
                fields=['city', 'usage_type', 'document_type', '-price'],
                condition=models.Q(is_published=True, is_public=True),
                name='idx_usage_document'
            ),
            
            # ═══════════════════════════════════════════════════════════════════════
            # 🔍 SECONDARY INDEXES: For specific use cases
            # ═══════════════════════════════════════════════════════════════════════
            
            # 6. Featured Properties (Homepage, Landing Pages)
            models.Index(
                fields=['is_featured', '-views_count', '-created_at'],
                condition=models.Q(is_published=True, is_public=True, is_featured=True),
                name='idx_featured_props'
            ),
            
            # 7. Agent/Agency Dashboard (Admin Panel)
            models.Index(
                fields=['agent', 'is_published', '-created_at'],
                name='idx_agent_dashboard'
            ),
            models.Index(
                fields=['agency', 'is_published', '-created_at'],
                name='idx_agency_dashboard'
            ),
            
            # 8. Map Search (Geo-spatial)
            models.Index(
                fields=['latitude', 'longitude', 'city'],
                condition=models.Q(latitude__isnull=False, longitude__isnull=False),
                name='idx_map_search'
            ),
            
            # ═══════════════════════════════════════════════════════════════════════
            # 🚀 SPECIALIZED INDEXES: PostgreSQL-specific optimizations
            # ═══════════════════════════════════════════════════════════════════════
            
            # 9. Full-Text Search (GIN Index for search_vector)
            GinIndex(
                fields=['search_vector'],
                name='idx_gin_fulltext'
            ),
            
            # 10. JSON Field Search (Extra Attributes for Short-term Rent, Pre-sale)
            GinIndex(
                fields=['extra_attributes'],
                name='idx_gin_json_attrs'
            ),
            
            # 11. Time-Series Data (BRIN for large datasets)
            BrinIndex(
                fields=['created_at'],
                pages_per_range=128,
                name='idx_brin_created'
            ),
            BrinIndex(
                fields=['published_at'],
                pages_per_range=128,
                name='idx_brin_published'
            ),
        ]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(price__isnull=True) | models.Q(price__gte=0),
                name='property_price_non_negative'
            ),
            models.CheckConstraint(
                condition=models.Q(sale_price__isnull=True) | models.Q(sale_price__gte=0),
                name='property_sale_price_non_negative'
            ),
            models.CheckConstraint(
                condition=models.Q(pre_sale_price__isnull=True) | models.Q(pre_sale_price__gte=0),
                name='property_pre_sale_price_non_negative'
            ),
            models.CheckConstraint(
                condition=models.Q(monthly_rent__isnull=True) | models.Q(monthly_rent__gte=0),
                name='property_monthly_rent_non_negative'
            ),
            models.CheckConstraint(
                condition=models.Q(rent_amount__isnull=True) | models.Q(rent_amount__gte=0),
                name='property_rent_amount_non_negative'
            ),
            models.CheckConstraint(
                condition=models.Q(mortgage_amount__isnull=True) | models.Q(mortgage_amount__gte=0),
                name='property_mortgage_amount_non_negative'
            ),
            models.CheckConstraint(
                condition=models.Q(land_area__gte=0),
                name='property_land_area_non_negative'
            ),
            models.CheckConstraint(
                condition=models.Q(built_area__gte=0),
                name='property_built_area_non_negative'
            ),
            models.CheckConstraint(
                condition=models.Q(bedrooms__gte=0) & models.Q(bedrooms__lte=20),
                name='property_bedrooms_range'
            ),
            models.CheckConstraint(
                condition=models.Q(bathrooms__gte=0) & models.Q(bathrooms__lte=20),
                name='property_bathrooms_range'
            ),
            models.CheckConstraint(
                condition=models.Q(parking_spaces__gte=0) & models.Q(parking_spaces__lte=20),
                name='property_parking_range'
            ),
            # Year Built: Constraint ثابت تا سال 1500 (هیچ Migration سالانه لازم نیست)
            models.CheckConstraint(
                condition=Q(year_built__isnull=True) | 
                         (Q(year_built__gte=1300) & Q(year_built__lte=1500)),
                name='property_year_built_safe_range'
            ),
            models.CheckConstraint(
                condition=models.Q(storage_rooms__gte=0),
                name='property_storage_rooms_non_negative'
            ),
            models.CheckConstraint(
                condition=models.Q(security_deposit__isnull=True) | models.Q(security_deposit__gte=0),
                name='property_security_deposit_non_negative'
            ),
            models.CheckConstraint(
                condition=models.Q(kitchens__gte=0),
                name='property_kitchens_non_negative'
            ),
            models.CheckConstraint(
                condition=models.Q(living_rooms__gte=0),
                name='property_living_rooms_non_negative'
            ),
        ]
    
    # =====================================================
    # ✅ Helper Methods
    # =====================================================
    
    @property
    def decade_built(self):
        """گروه‌بندی دهه‌ای سال ساخت (برای فیلتر)"""
        if not self.year_built:
            return None
        return (self.year_built // 10) * 10  # مثلاً 1395 → 1390
    
    @property
    def age_years(self):
        """سن ملک به سال (شمسی)"""
        if not self.year_built:
            return None
        try:
            import jdatetime
            current_year = jdatetime.datetime.now().year
            return current_year - self.year_built
        except ImportError:
            # اگر jdatetime نصب نیست، از سال میلادی تقریبی استفاده کن
            from datetime import datetime
            current_year = datetime.now().year
            # تقریبی: سال شمسی ≈ سال میلادی - 621
            shamsi_year = current_year - 621
            return shamsi_year - self.year_built
    
    @property
    def has_region(self):
        """آیا این شهر منطقه دارد؟"""
        return self.region is not None and self.city is not None
    
    def __str__(self):
        return self.title
    
    def get_public_url(self):
        return f"/property/{self.slug}/"
    
    def get_main_image(self):
        if hasattr(self, 'all_images'):
            all_images = getattr(self, 'all_images', [])
            main_images = [m for m in all_images if m.is_main]
            if main_images and len(main_images) > 0:
                return main_images[0].image if main_images[0].image else None
            return None
        
        from django.core.cache import cache
        from src.media.models.media import ImageMedia
        cache_key = PropertyCacheKeys.main_image(self.pk)
        main_image_id = cache.get(cache_key)
        
        if main_image_id is None:
            try:
                main_media = self.images.select_related('image').filter(is_main=True).first()
                if main_media:
                    main_image = main_media.image
                else:
                    video = self.videos.select_related('video__cover_image').first()
                    if video and video.video.cover_image:
                        main_image = video.video.cover_image
                    else:
                        audio = self.audios.select_related('audio__cover_image').first()
                        if audio and audio.audio.cover_image:
                            main_image = audio.audio.cover_image
                        else:
                            document = self.documents.select_related('document__cover_image').first()
                            if document and document.document.cover_image:
                                main_image = document.document.cover_image
                            else:
                                main_image = None
                
                # Cache only the ID, not the object
                if main_image:
                    cache.set(cache_key, main_image.id, 1800)
                    return main_image
                else:
                    cache.set(cache_key, False, 1800)
                    return None
            except Exception:
                cache.set(cache_key, False, 1800)
                return None
        else:
            # If cached value is False, return None
            if main_image_id is False:
                return None
            # Otherwise, fetch the object by ID
            try:
                return ImageMedia.objects.get(id=main_image_id)
            except ImageMedia.DoesNotExist:
                cache.delete(cache_key)
                return None
    
    def get_main_image_details(self):
        main_image = self.get_main_image()
        if main_image and main_image.file:
            file_url = main_image.file.url if main_image.file else None
            return {
                'id': main_image.id,
                'url': file_url,
                'file_url': file_url,
                'title': main_image.title,
                'alt_text': main_image.alt_text
            }
        return None
    
    def generate_structured_data(self):
        from django.core.cache import cache
        
        cache_key = PropertyCacheKeys.structured_data(self.pk)
        structured_data = cache.get(cache_key)
        
        if structured_data is None:
            main_image = self.get_main_image()
            
            tags = list(self.tags.values_list('title', flat=True)[:5])
            features = list(self.features.values_list('title', flat=True)[:5])
            
            # ایجاد آدرس کامل با منطق جدید
            address_parts = []
            if self.neighborhood:
                address_parts.append(self.neighborhood)
            if self.region:
                address_parts.append(f"منطقه {self.region.code}")
            if self.city:
                address_parts.append(self.city.name)
            if self.province:
                address_parts.append(self.province.name)

            full_address = ", ".join(address_parts) if address_parts else self.address

            structured_data = {
                "@context": "https://schema.org",
                "@type": "RealEstateListing",
                "name": self.get_meta_title(),
                "description": self.get_meta_description(),
                "url": self.get_public_url(),
                "image": main_image.file.url if main_image and main_image.file else None,
                "dateCreated": self.created_at.isoformat() if self.created_at else None,
                "dateModified": self.updated_at.isoformat() if self.updated_at else None,
                "address": {
                    "@type": "PostalAddress",
                    "streetAddress": self.address,
                    "addressLocality": self.city.name if self.city else None,
                    "addressRegion": self.province.name if self.province else None,
                    "postalCode": self.postal_code or None,
                    "addressCountry": self.country.code if self.country else None,
                },
                "geo": {
                    "@type": "GeoCoordinates",
                    "latitude": float(self.latitude) if self.latitude else None,
                    "longitude": float(self.longitude) if self.longitude else None,
                } if self.latitude and self.longitude else None,
                "numberOfRooms": self.bedrooms,
                "numberOfBathroomsTotal": self.bathrooms,
                "floorSize": {
                    "@type": "QuantitativeValue",
                    "value": float(self.built_area),
                    "unitCode": "MTK"
                } if self.built_area else None,
                "price": {
                    "@type": "PriceSpecification",
                    "price": float(self.price),
                    "priceCurrency": self.currency,
                },
                "keywords": tags + ([self.neighborhood] if self.neighborhood else []),
                "amenityFeature": [
                    {
                        "@type": "LocationFeatureSpecification",
                        "name": feature
                    } for feature in features
                ] if features else None,
            }
            
            cache.set(cache_key, structured_data, 1800)
        
        return structured_data
    
    def clean(self):
        """
        Validation دینامیک برای فیلدهای Model
        برای year_built: validation بر اساس سال فعلی
        """
        super().clean()
        
        # Validation دینامیک برای year_built
        if self.year_built is not None:
            year_max = self.__class__.get_year_max()  # استفاده از classmethod
            
            if self.year_built < self.YEAR_MIN:
                raise ValidationError({
                    'year_built': f'سال ساخت نباید کمتر از {self.YEAR_MIN} باشد.'
                })
            
            if self.year_built > year_max:
                raise ValidationError({
                    'year_built': f'سال ساخت نباید بیشتر از {year_max} (سال فعلی + {self.YEAR_BUFFER}) باشد.'
                })
    
    def save(self, *args, **kwargs):
        # Auto-populate SEO fields
        if not self.meta_title and self.title:
            self.meta_title = self.title[:70]
        
        if not self.meta_description:
            if self.short_description:
                self.meta_description = self.short_description[:300]
            elif self.description:
                self.meta_description = self.description[:300]
        
        if not self.og_title and self.meta_title:
            self.og_title = self.meta_title
        
        if not self.og_description and self.meta_description:
            self.og_description = self.meta_description
        
        # Auto-calculate price_per_sqm
        if self.built_area and self.built_area > 0:
            if self.price:
                self.price_per_sqm = int(self.price / float(self.built_area))
            elif self.sale_price:
                self.price_per_sqm = int(self.sale_price / float(self.built_area))
            elif self.pre_sale_price:
                self.price_per_sqm = int(self.pre_sale_price / float(self.built_area))
        
        # Auto-populate location (denormalization) - ساده شده
        if self.city_id and not self.province_id:
            self.province = self.city.province
        if self.province_id and not self.country_id:
            # Assuming Iran as default country - adjust as needed
            from src.core.models import Country
            iran_country, _ = Country.objects.get_or_create(
                code='IRN',
                defaults={'name': 'Iran'}
            )
            self.country = iran_country
        
        # Auto-set published_at
        if self.is_published and not self.published_at:
            from django.utils import timezone
            self.published_at = timezone.now()
        
        # Note: search_vector is updated via signals (see signals.py)
        # This ensures proper indexing with PostgreSQL SearchVector
        
        super().save(*args, **kwargs)
        
        # Clear caches
        if self.pk:
            PropertyCacheManager.invalidate_property(self.pk)
            PropertyCacheManager.invalidate_list()
    
    def delete(self, *args, **kwargs):
        property_id = self.pk
        super().delete(*args, **kwargs)
        if property_id:
            PropertyCacheManager.invalidate_property(property_id)
            PropertyCacheManager.invalidate_list()
