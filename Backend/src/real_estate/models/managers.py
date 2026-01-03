from django.db import models
from django.db.models import Prefetch, Count, Q


class PropertyQuerySet(models.QuerySet):
    """
    Custom QuerySet for Property model with performance optimizations
    """
    
    def published(self):
        return self.filter(is_published=True, is_public=True)
    
    def active(self):
        return self.filter(is_active=True)
    
    def without_seo(self):
        """
        Defer SEO fields for better performance in listing queries
        Usage: Property.objects.published().without_seo()
        """
        return self.defer(
            'meta_title', 'meta_description',
            'og_title', 'og_description', 'og_image_id',
            'canonical_url', 'robots_meta',
            'structured_data', 'hreflang_data'
        )
    
    def with_relations(self):

        from django.db.models import Prefetch
        from src.real_estate.models.media import PropertyImage
        
        return self.select_related(
            'property_type',
            'state',
            'agent',
            'agent__agency',
            'agent__user',
            'agency',
            'city',
            'province',
            'region'
        ).prefetch_related(
            'labels',
            'tags',
            'features',
            Prefetch(
                'images',
                queryset=PropertyImage.objects.select_related('image').order_by('-is_main', 'order', 'created_at'),
                to_attr='all_images'
            )
        )
    
    def for_admin_listing(self):
        """
        Optimized for admin listing - High Performance (Divar Scale)
        
        ✅ Optimizations:
        - select_related for ALL single FKs used in list (including og_image)
        - annotate(total_media_count) in SQL to avoid Python-level counts
        - removed defer() on fields used by the Serializer (meta_title, meta_description)
        - only() strictly limited to fields needed by the serializer
        - Prefetch for agents to avoid heavy JOINs
        """
        from django.db.models import Prefetch, Count, PositiveIntegerField
        from django.db.models.functions import Coalesce
        from src.real_estate.models.media import PropertyImage, PropertyVideo, PropertyAudio, PropertyDocument
        from src.user.models.admin_profile import AdminProfile
        from src.real_estate.models.label import PropertyLabel
        from src.real_estate.models.tag import PropertyTag
        from src.real_estate.models.feature import PropertyFeature
        
        return self.select_related(
            'property_type',
            'state',
            'agent',
            'agent__user',
            'agent__agency',
            'agency',
            'city',
            'city__province',
            'province',
            'region',
            'og_image', # ✅ Needed for SEO status check
        ).prefetch_related(
            Prefetch('labels', queryset=PropertyLabel.objects.all()),
            Prefetch('tags', queryset=PropertyTag.objects.all()),
            Prefetch('features', queryset=PropertyFeature.objects.all()),
            Prefetch(
                'agent__user__admin_profile',
                queryset=AdminProfile.objects.only('id', 'first_name', 'last_name', 'profile_picture_id')
            ),
            Prefetch(
                'images',
                queryset=PropertyImage.objects.select_related('image')
                    .filter(is_main=True)
                    .only('id', 'image_id', 'is_main', 'order', 'property_id'),
                to_attr='main_image_prefetch'
            ),
            Prefetch(
                'videos',
                queryset=PropertyVideo.objects.select_related('video', 'cover_image')
                    .only('id', 'video_id', 'cover_image_id', 'property_id')
                    .order_by('order', 'created_at'),
                to_attr='primary_video_prefetch'
            ),
            Prefetch(
                'audios',
                queryset=PropertyAudio.objects.select_related('audio', 'cover_image')
                    .only('id', 'audio_id', 'cover_image_id', 'property_id')
                    .order_by('order', 'created_at'),
                to_attr='primary_audio_prefetch'
            ),
            Prefetch(
                'documents',
                queryset=PropertyDocument.objects.select_related('document', 'cover_image')
                    .only('id', 'document_id', 'cover_image_id', 'title', 'property_id')
                    .order_by('order', 'created_at'),
                to_attr='primary_document_prefetch'
            ),

        ).annotate(

            # ✅ SQL-level counts for high performance
            labels_count=Count('labels', distinct=True),
            tags_count=Count('tags', distinct=True),
            features_count=Count('features', distinct=True),
            total_images_count=Count('images', distinct=True),
            total_videos_count=Count('videos', distinct=True),
            total_audios_count=Count('audios', distinct=True),
            total_docs_count=Count('documents', distinct=True),
        ).annotate(
            # ✅ Coalesce to ensure we don't have NULL
            total_media_count=Coalesce(
                models.F('total_images_count') + 
                models.F('total_videos_count') + 
                models.F('total_audios_count') + 
                models.F('total_docs_count'),
                0,
                output_field=models.PositiveIntegerField()
            )
        ).defer(

            # ✅ Only heavy fields that are NOT used in the list serializer
            'og_title', 'og_description',
            'canonical_url', 'robots_meta',
            'structured_data', 'hreflang_data',
            'description',
            'address',
            'extra_attributes',
            'search_vector'
        ).only(
            'id', 'public_id', 'title', 'slug', 'short_description',
            'is_published', 'is_featured', 'is_public', 'is_active',
            'property_type_id', 'state_id', 'agent_id', 'agency_id',
            'city_id', 'region_id', 'province_id', 'neighborhood',
            'price', 'sale_price', 'pre_sale_price', 'price_per_sqm',
            'monthly_rent', 'rent_amount', 'mortgage_amount',
            'land_area', 'built_area',
            'bedrooms', 'bathrooms', 'kitchens', 'living_rooms',
            'year_built', 'build_years', 'floors_in_building', 'floor_number',
            'parking_spaces', 'storage_rooms', 'document_type', 'has_document',
            'views_count', 'favorites_count', 'inquiries_count',
            'published_at', 'created_at', 'updated_at',
            'meta_title', 'meta_description', # ✅ Kept for serializer
            'og_image_id', # ✅ Needed for SQL join, must be in only()
        )


    
    def for_public_listing(self):
        """
        Optimized for public listing - SEO fields deferred for performance
        """
        return self.published().with_relations().defer(
            # SEO fields - only needed on detail page
            'meta_title', 'meta_description',
            'og_title', 'og_description', 'og_image_id',
            'canonical_url', 'robots_meta',
            'structured_data', 'hreflang_data',
            # Heavy fields
            'description',
            'address',
            'extra_attributes',
            'search_vector'
        )
    
    def for_detail(self):
        from django.db.models import Prefetch
        from src.real_estate.models.media import PropertyImage, PropertyVideo, PropertyAudio, PropertyDocument
        
        return self.select_related(
            'property_type',
            'state',
            'agent',
            'agent__agency',
            'agent__user',
            'agency',
            'region',
            'city',
            'province'
        ).prefetch_related(
            'labels',
            'tags',
            'features',
            Prefetch(
                'images',
                queryset=PropertyImage.objects.select_related('image').order_by('is_main', 'order', 'created_at'),
                to_attr='all_images'
            ),
            'images__image',
            Prefetch(
                'videos',
                queryset=PropertyVideo.objects.select_related('video', 'video__cover_image', 'cover_image').order_by('order', 'created_at')
            ),
            'videos__video',
            'videos__video__cover_image',
            Prefetch(
                'audios',
                queryset=PropertyAudio.objects.select_related('audio', 'audio__cover_image', 'cover_image').order_by('order', 'created_at')
            ),
            'audios__audio',
            'audios__audio__cover_image',
            Prefetch(
                'documents',
                queryset=PropertyDocument.objects.select_related('document', 'document__cover_image', 'cover_image').order_by('order', 'created_at')
            ),
            'documents__document',
            'documents__document__cover_image'
        )
    
    def search(self, query):
        return self.filter(
            Q(title__icontains=query) |
            Q(description__icontains=query) |
            Q(address__icontains=query) |
            Q(city__name__icontains=query) |
            Q(region__name__icontains=query)
        ).distinct()
    
    def featured(self):
        return self.filter(is_featured=True)
    
    def by_city(self, city_id):
        return self.filter(city_id=city_id)
    
    def by_property_type(self, type_id):
        return self.filter(property_type_id=type_id)
    
    def by_state(self, state_id):
        return self.filter(state_id=state_id)
    
    def price_range(self, min_price=None, max_price=None):
        qs = self
        if min_price is not None:
            qs = qs.filter(price__gte=min_price)
        if max_price is not None:
            qs = qs.filter(price__lte=max_price)
        return qs
    
    def area_range(self, min_area=None, max_area=None):
        qs = self
        if min_area is not None:
            qs = qs.filter(built_area__gte=min_area)
        if max_area is not None:
            qs = qs.filter(built_area__lte=max_area)
        return qs
    
    def bedrooms_range(self, min_bedrooms=None, max_bedrooms=None):
        qs = self
        if min_bedrooms is not None:
            qs = qs.filter(bedrooms__gte=min_bedrooms)
        if max_bedrooms is not None:
            qs = qs.filter(bedrooms__lte=max_bedrooms)
        return qs
    
    def fast_filter(self, filters):

        qs = self.filter(is_published=True, is_public=True, is_active=True)

        if filters.get('city'):
            qs = qs.filter(city_id=filters['city'])
        
        if filters.get('property_type'):
            qs = qs.filter(property_type_id=filters['property_type'])
        
        if filters.get('bedrooms'):
            qs = qs.filter(bedrooms=filters['bedrooms'])
        
        if filters.get('bathrooms'):
            qs = qs.filter(bathrooms=filters['bathrooms'])
        
        if filters.get('parking_spaces') is not None:
            qs = qs.filter(parking_spaces=filters['parking_spaces'])
        
        if filters.get('min_price'):
            qs = qs.filter(price__gte=filters['min_price'])
        
        if filters.get('max_price'):
            qs = qs.filter(price__lte=filters['max_price'])
        
        if filters.get('year_from'):
            qs = qs.filter(year_built__gte=filters['year_from'])
        
        if filters.get('year_to'):
            qs = qs.filter(year_built__lte=filters['year_to'])
        
        if filters.get('min_area'):
            qs = qs.filter(built_area__gte=filters['min_area'])
        
        if filters.get('max_area'):
            qs = qs.filter(built_area__lte=filters['max_area'])

        if filters.get('region'):
            qs = qs.filter(region_id=filters['region'])

        if filters.get('neighborhood'):
            qs = qs.filter(neighborhood__icontains=filters['neighborhood'])

        if filters.get('state'):
            qs = qs.filter(state_id=filters['state'])

        if filters.get('featured') is not None:
            qs = qs.filter(is_featured=filters['featured'])
        
        return qs
    
    # ==================== Geo Methods (PostgreSQL Standard) ====================
    
    def with_map_coords(self):
        """املاک با مختصات برای نمایش روی نقشه"""
        return self.filter(
            latitude__isnull=False,
            longitude__isnull=False
        )
    
    def nearby(self, latitude, longitude, radius_km=2.0):
        """
        جستجوی املاک نزدیک با bbox ساده (بهینه شده)
        
        Args:
            latitude: عرض جغرافیایی
            longitude: طول جغرافیایی  
            radius_km: شعاع به کیلومتر
        
        Returns:
            QuerySet املاک در bbox (مستطیل) مشخص شده
        
        Note: این متد از PropertyGeoService استفاده می‌کند
        """
        from src.real_estate.services.admin.property_geo_services import PropertyGeoService
        return PropertyGeoService.search_nearby(
            latitude=latitude,
            longitude=longitude,
            radius_km=radius_km,
            queryset=self
        )
    
    def in_bbox(self, min_lat, max_lat, min_lon, max_lon):
        """
        جستجوی در محدوده مستطیلی
        
        Note: این متد از PropertyGeoService استفاده می‌کند
        """
        from src.real_estate.services.admin.property_geo_services import PropertyGeoService
        return PropertyGeoService.search_in_bbox(
            min_lat=min_lat,
            max_lat=max_lat,
            min_lon=min_lon,
            max_lon=max_lon,
            queryset=self
        )


class PropertyTypeQuerySet(models.QuerySet):
    
    def active(self):
        return self.filter(is_active=True)
    
    def public(self):
        """Active types only"""
        return self.filter(is_active=True)
    
    def with_counts(self):
        """Annotate with property count"""
        return self.annotate(
            property_count=Count('properties', 
                                filter=Q(properties__is_published=True))
        )
    
    def roots(self):
        """Get only root types (depth=1)"""
        return self.filter(depth=1)
    
    def for_tree(self):
        """Optimized fields for tree display"""
        return self.only('id', 'title', 'slug', 'depth', 'path', 'public_id', 'display_order')


class PropertyStateQuerySet(models.QuerySet):
    
    def active(self):
        return self.filter(is_active=True)
    
    def with_counts(self):
        return self.annotate(
            properties_count=Count('properties', 
                                filter=Q(properties__is_published=True))
        )


class PropertyLabelQuerySet(models.QuerySet):
    
    def active(self):
        return self.filter(is_active=True)
    
    def with_counts(self):
        return self.annotate(
            properties_count=Count('properties', 
                                filter=Q(properties__is_published=True))
        )


class PropertyFeatureQuerySet(models.QuerySet):
    
    def active(self):
        return self.filter(is_active=True)
    
    def by_group(self, group):
        return self.filter(group=group)
    
    def with_counts(self):
        return self.annotate(
            properties_count=Count('properties', 
                                filter=Q(properties__is_published=True))
        )


class PropertyTagQuerySet(models.QuerySet):
    
    def active(self):
        return self.filter(is_public=True, is_active=True)
    
    def public(self):
        return self.filter(is_public=True)
    
    def popular(self, limit=10):
        return self.filter(is_public=True).annotate(
            usage_count=Count('properties', filter=Q(properties__is_published=True, properties__is_public=True))
        ).order_by('-usage_count')[:limit]
    
    def with_counts(self):
        return self.annotate(
            properties_count=Count('properties', 
                                filter=Q(properties__is_published=True, properties__is_public=True))
        )




class RealEstateAgencyQuerySet(models.QuerySet):
    
    def active(self):
        return self.filter(is_active=True)
    
    def verified(self):
        return self.filter(is_verified=True)
    
    def with_counts(self):
        return self.annotate(
            agents_count=Count('agents', filter=Q(agents__is_active=True)),
            properties_count=Count('properties', 
                                filter=Q(properties__is_published=True))
        )


class PropertyAgentQuerySet(models.QuerySet):
    
    def active(self):
        return self.filter(is_active=True)
    
    def verified(self):
        return self.filter(is_verified=True)
    
    def with_agency(self):
        """Load agent with agency, user, and city relations to avoid N+1"""
        return self.select_related('agency', 'agency__city', 'user', 'city', 'avatar', 'cover_image')
    
    def with_counts(self):
        """Annotate with property count"""
        return self.annotate(
            properties_count=Count('properties', 
                                filter=Q(properties__is_published=True))
        )
    
    def by_city(self, city_id):
        return self.filter(city_id=city_id)
    
    def by_agency(self, agency_id):
        return self.filter(agency_id=agency_id)
    
    def independent(self):
        """Agents without agency"""
        return self.filter(agency__isnull=True)
