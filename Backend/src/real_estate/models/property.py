from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from django.contrib.postgres.indexes import GinIndex, BrinIndex
from django.contrib.postgres.search import SearchVectorField
from django.db.models import Q
from src.core.models import BaseModel, Province, City
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
from src.real_estate.models.constants import PROPERTY_STATUS_CHOICES

class Property(BaseModel, SEOMixin):

    title = models.CharField(max_length=100, db_index=True, verbose_name="Title")
    slug = models.CharField(
        max_length=120, 
        unique=True, 
        db_index=True, 
        verbose_name="URL Slug",
        help_text="Unique URL slug (supports Persian and English)"
    )
    short_description = models.CharField(max_length=300, blank=True, verbose_name="Short Description")
    description = models.TextField(blank=True, null=True, verbose_name="Description")

    agent = models.ForeignKey(
        PropertyAgent, 
        on_delete=models.PROTECT, 
        related_name='properties',
        null=True,
        blank=True,
        help_text="Property agent (auto-assigned if not provided)"
    )
    agency = models.ForeignKey(
        RealEstateAgency, 
        on_delete=models.PROTECT, 
        related_name='properties', 
        null=True, 
        blank=True
    )
    property_type = models.ForeignKey(PropertyType, on_delete=models.PROTECT, related_name='properties')
    state = models.ForeignKey(PropertyState, on_delete=models.PROTECT, related_name='properties')
    
    province = models.ForeignKey(Province, on_delete=models.PROTECT, related_name='real_estate_properties')
    city = models.ForeignKey(City, on_delete=models.PROTECT, related_name='real_estate_properties')
    region = models.ForeignKey(CityRegion, on_delete=models.SET_NULL, related_name='properties', null=True, blank=True)

    labels = models.ManyToManyField(PropertyLabel, blank=True, related_name='properties')
    tags = models.ManyToManyField(PropertyTag, blank=True, related_name='properties')
    features = models.ManyToManyField(PropertyFeature, blank=True, related_name='properties')

    neighborhood = models.CharField(max_length=120, blank=True)
    address = models.TextField()
    postal_code = models.CharField(max_length=20, blank=True)
    
    latitude = models.DecimalField(
        max_digits=10, 
        decimal_places=8, 
        null=True, 
        blank=True,
        db_index=True,
        verbose_name="Latitude",
        help_text="Geographic latitude for map display"
    )
    longitude = models.DecimalField(
        max_digits=11, 
        decimal_places=8, 
        null=True, 
        blank=True,
        db_index=True,
        verbose_name="Longitude",
        help_text="Geographic longitude for map display"
    )

    price = models.BigIntegerField(null=True, blank=True)
    sale_price = models.BigIntegerField(null=True, blank=True)
    pre_sale_price = models.BigIntegerField(null=True, blank=True)
    price_per_sqm = models.IntegerField(null=True, blank=True, editable=False)
    
    monthly_rent = models.BigIntegerField(null=True, blank=True)
    rent_amount = models.BigIntegerField(null=True, blank=True)
    mortgage_amount = models.BigIntegerField(null=True, blank=True)
    security_deposit = models.BigIntegerField(null=True, blank=True)

    land_area = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        validators=[MinValueValidator(0)],
        null=True,
        blank=True,
        help_text="Land area in square meters (optional)"
    )
    built_area = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        validators=[MinValueValidator(0)],
        null=True,
        blank=True,
        help_text="Built area in square meters (optional)"
    )

    BEDROOM_CHOICES = [
        (0, 'Studio'),
        (1, '1 Bedroom'),
        (2, '2 Bedroom'),
        (3, '3 Bedroom'),
        (4, '4 Bedroom'),
        (5, '5 Bedroom'),
        (6, '6 Bedroom'),
        (7, '7 Bedroom'),
        (8, '8 Bedroom'),
        (9, '9 Bedroom'),
        (10, '10 Bedroom'),
        (11, '11 Bedroom'),
        (12, '12 Bedroom'),
        (13, '13 Bedroom'),
        (14, '14 Bedroom'),
        (15, '15 Bedroom'),
        (16, '16 Bedroom'),
        (17, '17 Bedroom'),
        (18, '18 Bedroom'),
        (19, '19 Bedroom'),
        (20, '20+ Bedroom'),
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
        (0, 'No Bathroom'),
        (1, '1 Bathroom'),
        (2, '2 Bathroom'),
        (3, '3 Bathroom'),
        (4, '4 Bathroom'),
        (5, '5 Bathroom'),
        (6, '6 Bathroom'),
        (7, '7 Bathroom'),
        (8, '8 Bathroom'),
        (9, '9 Bathroom'),
        (10, '10 Bathroom'),
        (11, '11 Bathroom'),
        (12, '12 Bathroom'),
        (13, '13 Bathroom'),
        (14, '14 Bathroom'),
        (15, '15 Bathroom'),
        (16, '16 Bathroom'),
        (17, '17 Bathroom'),
        (18, '18 Bathroom'),
        (19, '19 Bathroom'),
        (20, '20+ Bathroom'),
    ]
    
    bathrooms = models.SmallIntegerField(
        choices=BATHROOM_CHOICES,
        default=1,
        validators=[MinValueValidator(0), MaxValueValidator(20)],
        db_index=True,
        verbose_name="Bathrooms",
        help_text="Number of bathrooms"
    )

    CAPACITY_CHOICES = [
        (1, '1 Person'),
        (2, '2 People'),
        (3, '3 People'),
        (4, '4 People'),
        (5, '5 People'),
        (6, '6 People'),
        (7, '7 People'),
        (8, '8 People'),
        (9, '9 People'),
        (10, '10 People'),
        (12, '12 People'),
        (15, '15 People'),
        (20, '20 People'),
        (25, '25 People'),
        (30, '30+ People'),
    ]
    
    capacity = models.SmallIntegerField(
        null=True,
        blank=True,
        choices=CAPACITY_CHOICES,
        validators=[MinValueValidator(1), MaxValueValidator(50)],
        verbose_name="Capacity",
        help_text="Maximum number of people (mainly for short-term rentals)"
    )
    
    KITCHEN_CHOICES = [
        (0, 'No Kitchen'),
        (1, '1 Kitchen'),
        (2, '2 Kitchen'),
        (3, '3 Kitchen'),
        (4, '4 Kitchen'),
        (5, '5 Kitchen'),
        (6, '6 Kitchen'),
        (7, '7 Kitchen'),
        (8, '8 Kitchen'),
        (9, '9 Kitchen'),
        (10, '10 Kitchen'),
    ]
    
    kitchens = models.SmallIntegerField(
        choices=KITCHEN_CHOICES,
        default=1,
        validators=[MinValueValidator(0), MaxValueValidator(10)],
        verbose_name="Kitchens",
        help_text="Number of kitchens"
    )
    
    LIVING_ROOM_CHOICES = [
        (0, 'No Living Room'),
        (1, '1 Living Room'),
        (2, '2 Living Room'),
        (3, '3 Living Room'),
        (4, '4 Living Room'),
        (5, '5 Living Room'),
        (6, '6 Living Room'),
        (7, '7 Living Room'),
        (8, '8 Living Room'),
        (9, '9 Living Room'),
        (10, '10 Living Room'),
    ]
    
    living_rooms = models.SmallIntegerField(
        choices=LIVING_ROOM_CHOICES,
        default=1,
        validators=[MinValueValidator(0), MaxValueValidator(10)],
        verbose_name="Living Rooms",
        help_text="Number of living rooms"
    )
    
    YEAR_MIN = 1300
    YEAR_BUFFER = 5
    
    @classmethod
    def get_current_shamsi_year(cls):
        try:
            import jdatetime
            return jdatetime.datetime.now().year
        except ImportError:
            from datetime import datetime
            return datetime.now().year - 621
    
    @classmethod
    def get_year_max(cls):
        return cls.get_current_shamsi_year() + cls.YEAR_BUFFER
    
    @classmethod
    def get_year_built_choices(cls):

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
        verbose_name="Build Years",
        help_text="Number of years since the property was built"
    )
    floors_in_building = models.SmallIntegerField(
        null=True,
        blank=True,
        verbose_name="Floors in Building",
        help_text="Total floors in the building"
    )

    FLOOR_CHOICES = [
        (-2, '2nd Basement'),
        (-1, 'Basement'),
        (0, 'Ground Floor'),
        (1, '1st Floor'),
        (2, '2nd Floor'),
        (3, '3rd Floor'),
        (4, '4th Floor'),
        (5, '5th Floor'),
        (6, '6th Floor'),
        (7, '7th Floor'),
        (8, '8th Floor'),
        (9, '9th Floor'),
        (10, '10th Floor'),
        (11, '11th Floor'),
        (12, '12th Floor'),
        (13, '13th Floor'),
        (14, '14th Floor'),
        (15, '15th Floor'),
        (16, '16th Floor'),
        (17, '17th Floor'),
        (18, '18th Floor'),
        (19, '19th Floor'),
        (20, '20th Floor'),
        (21, '21st Floor'),
        (22, '22nd Floor'),
        (23, '23rd Floor'),
        (24, '24th Floor'),
        (25, '25th Floor'),
        (30, '30th Floor'),
        (35, '35th Floor'),
        (40, '40th Floor'),
        (45, '45th Floor'),
        (50, '50+ Floor'),
    ]
    
    floor_number = models.SmallIntegerField(
        null=True,
        blank=True,
        choices=FLOOR_CHOICES,
        verbose_name="Floor Number",
        help_text="Floor number of the property (-2 to 50, -1=Basement, 0=Ground floor)"
    )

    PARKING_CHOICES = [
        (0, 'No Parking'),
        (1, '1 Parking'),
        (2, '2 Parking'),
        (3, '3 Parking'),
        (4, '4 Parking'),
        (5, '5 Parking'),
        (6, '6 Parking'),
        (7, '7 Parking'),
        (8, '8 Parking'),
        (9, '9 Parking'),
        (10, '10 Parking'),
        (11, '11 Parking'),
        (12, '12 Parking'),
        (13, '13 Parking'),
        (14, '14 Parking'),
        (15, '15 Parking'),
        (16, '16 Parking'),
        (17, '17 Parking'),
        (18, '18 Parking'),
        (19, '19 Parking'),
        (20, '20+ Parking'),
    ]
    
    parking_spaces = models.SmallIntegerField(
        choices=PARKING_CHOICES,
        default=0,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(20)],
        db_index=True,
        verbose_name="Parking Spaces",
        help_text="Number of parking spaces (optional)"
    )

    STORAGE_CHOICES = [
        (0, 'No Storage'),
        (1, '1 Storage'),
        (2, '2 Storage'),
        (3, '3 Storage'),
        (4, '4 Storage'),
        (5, '5 Storage'),
        (6, '6 Storage'),
        (7, '7 Storage'),
        (8, '8 Storage'),
        (9, '9 Storage'),
        (10, '10+ Storage'),
    ]
    
    storage_rooms = models.SmallIntegerField(
        choices=STORAGE_CHOICES,
        default=0,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(10)],
        db_index=True,
        verbose_name="Storage Rooms",
        help_text="Number of storage rooms (optional, 0 = No storage)"
    )
    
    document_type = models.CharField(
        max_length=32,
        null=True,
        blank=True,
        db_index=True,
        verbose_name="Document Type",
        help_text="Type of property ownership document (official, contract, cooperative, etc.)"
    )
    has_document = models.BooleanField(
        default=True,
        verbose_name="Has Document",
        help_text="Whether the property has any ownership document"
    )
    
    is_published = models.BooleanField(
        default=False,
        verbose_name="Published",
        help_text="Whether property is published"
    )
    is_featured = models.BooleanField(
        default=False,
        verbose_name="Featured",
        help_text="Whether property is featured"
    )
    is_public = models.BooleanField(
        default=True,
        verbose_name="Public",
        help_text="Designates whether this property is publicly visible"
    )
    published_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Published At",
        help_text="Date and time when property was published"
    )
    closed_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Closed At",
        help_text="Date and time when property was sold or rented"
    )

    status = models.CharField(
        max_length=20,
        choices=PROPERTY_STATUS_CHOICES,
        default='active',
        db_index=True,
        verbose_name="Listing Status",
        help_text="Lifecycle status of the listing (Active -> Pending -> Sold)"
    )
    
    views_count = models.IntegerField(
        default=0,
        db_index=True,
        verbose_name="Total Views",
        help_text="Total number of views (Web + App)"
    )
    web_views_count = models.IntegerField(
        default=0,
        verbose_name="Web Views",
        help_text="Number of views from the website"
    )
    app_views_count = models.IntegerField(
        default=0,
        verbose_name="App Views",
        help_text="Number of views from the application"
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
        editable=False,
        verbose_name="Search Vector",
        help_text="Full-text search vector (PostgreSQL)"
    )
    
    extra_attributes = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Extra Attributes",
        help_text="Flexible attributes for specific property types"
    )
    
    objects = PropertyQuerySet.as_manager()
    
    class Meta(BaseModel.Meta, SEOMixin.Meta):
        db_table = 'real_estate_properties'
        verbose_name = 'Property'
        verbose_name_plural = 'Properties'
        ordering = ['-created_at']
        indexes = [

            models.Index(
                fields=['is_published', 'is_public', 'city', 'property_type', 'bedrooms', '-price'],
                condition=models.Q(is_published=True, is_public=True, is_active=True),
                name='idx_main_search'
            ),
            
            models.Index(
                fields=['city', 'region', 'neighborhood', '-created_at'],
                condition=models.Q(is_published=True, is_public=True),
                name='idx_location_search'
            ),

            models.Index(
                fields=['is_published', 'is_public', 'price', 'sale_price', 'monthly_rent'],
                condition=models.Q(is_published=True, is_public=True),
                name='idx_price_range'
            ),
            
            models.Index(
                fields=['city', 'year_built', 'floor_number', 'parking_spaces', 'storage_rooms'],
                condition=models.Q(is_published=True, year_built__isnull=False),
                name='idx_property_details'
            ),
            
            models.Index(
                fields=['city', 'document_type', '-price'],
                condition=models.Q(is_published=True, is_public=True),
                name='idx_document_type'
            ),
            
            models.Index(
                fields=['is_featured', '-views_count', '-created_at'],
                condition=models.Q(is_published=True, is_public=True, is_featured=True),
                name='idx_featured_props'
            ),
            
            models.Index(
                fields=['is_active', '-created_at', 'id'],
                name='idx_admin_list_order'
            ),
            
            models.Index(
                fields=['agent', 'is_published', '-created_at'],
                name='idx_agent_dashboard'
            ),
            models.Index(
                fields=['agency', 'is_published', '-created_at'],
                name='idx_agency_dashboard'
            ),
            
            models.Index(
                fields=['latitude', 'longitude', 'city'],
                condition=models.Q(latitude__isnull=False, longitude__isnull=False),
                name='idx_map_search'
            ),
            
            GinIndex(
                fields=['search_vector'],
                name='idx_gin_fulltext'
            ),

            GinIndex(
                fields=['extra_attributes'],
                name='idx_gin_json_attrs'
            ),

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
    
    @property
    def decade_built(self):

        if not self.year_built:
            return None
        return (self.year_built // 10) * 10  # مثلاً 1395 → 1390
    
    @property
    def age_years(self):

        if not self.year_built:
            return None
        try:
            import jdatetime
            current_year = jdatetime.datetime.now().year
            return current_year - self.year_built
        except ImportError:
            from datetime import datetime
            current_year = datetime.now().year
            shamsi_year = current_year - 621
            return shamsi_year - self.year_built
    
    @property
    def has_region(self):
        return self.region is not None and self.city is not None
    
    @property
    def country_code(self):
        return "IR"
    
    @property
    def country_name(self):
        return "ایران"
    
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

        from src.real_estate.services.admin.property_media_services import PropertyAdminMediaService
        return PropertyAdminMediaService.get_main_image_for_model(self)
    
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
                    "addressCountry": "IR",  # Iran
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
                } if self.price else None,
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
        super().clean()

        if self.year_built is not None:
            year_max = self.__class__.get_year_max()
            
            if self.year_built < self.YEAR_MIN:
                raise ValidationError({
                    'year_built': f'Year built cannot be less than {self.YEAR_MIN}.'
                })
            
            if self.year_built > year_max:
                raise ValidationError({
                    'year_built': f'Year built cannot be greater than {year_max} (current year + {self.YEAR_BUFFER}).'
                })
    
    def save(self, *args, **kwargs):
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

        if self.built_area and self.built_area > 0:
            if self.price:
                self.price_per_sqm = int(self.price / float(self.built_area))
            elif self.sale_price:
                self.price_per_sqm = int(self.sale_price / float(self.built_area))
            elif self.pre_sale_price:
                self.price_per_sqm = int(self.pre_sale_price / float(self.built_area))

        if self.city_id and not self.province_id:
            self.province = self.city.province
        
        if self.is_published and not self.published_at:
            from django.utils import timezone
            self.published_at = timezone.now()

        is_new = self.pk is None
        super().save(*args, **kwargs)

        if is_new:
            from django.contrib.postgres.search import SearchVector
            Property.objects.filter(pk=self.pk).update(
                search_vector=(
                    SearchVector('title', weight='A', config='english') +
                    SearchVector('description', weight='B', config='english') +
                    SearchVector('address', weight='C', config='english')
                )
            )

        if self.pk:
            PropertyCacheManager.invalidate_property(self.pk)
            PropertyCacheManager.invalidate_list()
    
    def delete(self, *args, **kwargs):
        property_id = self.pk
        super().delete(*args, **kwargs)
        if property_id:
            PropertyCacheManager.invalidate_property(property_id)
            PropertyCacheManager.invalidate_list()
