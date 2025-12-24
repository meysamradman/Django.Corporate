from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.postgres.indexes import GinIndex, BrinIndex
from django.contrib.postgres.search import SearchVectorField
from src.core.models import BaseModel
from src.real_estate.models.seo import SEOMixin
from src.real_estate.models.location import Country, Province, City, Region, District
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
    
    district = models.ForeignKey(
        District,
        on_delete=models.PROTECT,
        related_name='properties',
        db_index=True,
        verbose_name="District",
        help_text="District or neighborhood (can be selected via map)"
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
    
    bedrooms = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(50)],
        db_index=True,
        verbose_name="Bedrooms",
        help_text="Number of bedrooms"
    )
    bathrooms = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(50)],
        db_index=True,
        verbose_name="Bathrooms",
        help_text="Number of bathrooms"
    )
    kitchens = models.IntegerField(
        default=1,
        validators=[MinValueValidator(0)],
        verbose_name="Kitchens",
        help_text="Number of kitchens"
    )
    living_rooms = models.IntegerField(
        default=1,
        validators=[MinValueValidator(0)],
        verbose_name="Living Rooms",
        help_text="Number of living rooms"
    )
    
    year_built = models.IntegerField(
        null=True,
        blank=True,
        db_index=True,
        verbose_name="Year Built",
        help_text="Year the property was built"
    )
    build_years = models.IntegerField(
        null=True,
        blank=True,
        db_index=True,
        verbose_name="Build Years",
        help_text="Number of years since the property was built"
    )
    floors_in_building = models.IntegerField(
        null=True,
        blank=True,
        verbose_name="Floors in Building",
        help_text="Total floors in the building"
    )
    floor_number = models.IntegerField(
        null=True,
        blank=True,
        verbose_name="Floor Number",
        help_text="Floor number of the property"
    )
    
    parking_spaces = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        verbose_name="Parking Spaces",
        help_text="Number of parking spaces"
    )
    storage_rooms = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        verbose_name="Storage Rooms",
        help_text="Number of storage rooms"
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
    
    objects = PropertyQuerySet.as_manager()
    
    class Meta(BaseModel.Meta, SEOMixin.Meta):
        db_table = 'real_estate_properties'
        verbose_name = 'Property'
        verbose_name_plural = 'Properties'
        ordering = ['-is_featured', '-published_at', '-created_at']
        indexes = [
            models.Index(fields=['is_published', 'is_public', 'city', 'property_type', '-price']),
            models.Index(fields=['is_published', 'is_public', 'state', '-published_at']),
            models.Index(fields=['is_published', 'is_public', 'is_featured', '-views_count']),
            models.Index(fields=['city', 'property_type', 'bedrooms', '-price']),
            models.Index(fields=['agent', 'is_published', 'is_public', '-created_at']),
            models.Index(fields=['agency', 'is_published', 'is_public', '-created_at']),
            models.Index(fields=['is_published', 'is_public', 'price']),
            models.Index(fields=['is_published', 'is_public', 'sale_price']),
            models.Index(fields=['is_published', 'is_public', 'monthly_rent']),
            models.Index(fields=['is_published', 'is_public', 'rent_amount']),
            models.Index(fields=['land_area', 'built_area']),
            GinIndex(fields=['search_vector']),
            BrinIndex(fields=['created_at', 'updated_at']),
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
                condition=models.Q(bedrooms__gte=0) & models.Q(bedrooms__lte=50),
                name='property_bedrooms_range'
            ),
            models.CheckConstraint(
                condition=models.Q(bathrooms__gte=0) & models.Q(bathrooms__lte=50),
                name='property_bathrooms_range'
            ),
            models.CheckConstraint(
                condition=models.Q(parking_spaces__gte=0),
                name='property_parking_spaces_non_negative'
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
        cache_key = PropertyCacheKeys.main_image(self.pk)
        main_image = cache.get(cache_key)
        
        if main_image is None:
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
            except Exception:
                main_image = False
            
            cache.set(cache_key, main_image, 1800)
        
        return main_image if main_image else None
    
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
                "keywords": tags,
                "amenityFeature": [
                    {
                        "@type": "LocationFeatureSpecification",
                        "name": feature
                    } for feature in features
                ] if features else None,
            }
            
            cache.set(cache_key, structured_data, 1800)
        
        return structured_data
    
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
        
        # Auto-populate location (denormalization)
        if self.district_id and not self.city_id:
            # District now belongs to Region, Region belongs to City
            self.city = self.district.region.city
        if self.city_id and not self.province_id:
            self.province = self.city.province
        if self.province_id and not self.country_id:
            # Assuming Iran as default country - adjust as needed
            from src.real_estate.models.location import Country
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
