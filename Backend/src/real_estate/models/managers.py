from django.db import models
from django.db.models import Prefetch, Count, Q
from django.contrib.postgres.search import SearchQuery, SearchRank

class PropertyQuerySet(models.QuerySet):

    def published(self):
        return self.filter(is_published=True, is_public=True)
    
    def active(self):
        return self.filter(is_active=True)
    
    def without_seo(self):
        
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
            'created_by',
            'created_by__admin_profile',
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
        
        from django.db.models import Prefetch
        from src.real_estate.models.media import PropertyImage
        
        return self.select_related(
            'property_type',
            'state',
            'agent',
            'agent__profile_picture',
            'agent__user',
            'agent__user__admin_profile',
            'agent__user__admin_profile__profile_picture',
            'agency',
            'agency__profile_picture',
            'city',
            'province',
            'region',
            'og_image', # ✅ Needed for SEO status check
        ).prefetch_related(
            Prefetch(
                'images',
                queryset=PropertyImage.objects.select_related('image')
                    .filter(is_main=True)
                    .order_by('property_id', 'order', 'created_at', 'id')
                    .distinct('property_id')
                    .only(
                        'id', 'image_id', 'is_main', 'order', 'property_id',
                        'image__id', 'image__file', 'image__title', 'image__alt_text'
                    ),
                to_attr='main_image_prefetch'
            ),
        ).defer(

            'og_title', 'og_description',
            'canonical_url', 'robots_meta',
            'structured_data', 'hreflang_data',
            'description',
            'address',
            'extra_attributes',
            'search_vector'
        ).only(
            'id', 'public_id', 'title', 'slug', 'short_description',
            'is_published', 'is_featured', 'is_public', 'is_active', 'status',
            'property_type_id', 'state_id', 'agent_id', 'agency_id',
            'city_id', 'region_id', 'province_id', 'neighborhood',
            'price', 'sale_price', 'pre_sale_price', 'price_per_sqm',
            'monthly_rent', 'rent_amount', 'mortgage_amount',
            'land_area', 'built_area',
            'bedrooms', 'bathrooms', 'kitchens', 'living_rooms',
            'year_built', 'build_years', 'floors_in_building', 'floor_number',
            'parking_spaces', 'storage_rooms', 'document_type', 'has_document',
            'views_count', 'web_views_count', 'app_views_count', 'favorites_count', 'inquiries_count',
            'published_at', 'created_at', 'updated_at',
            'meta_title', 'meta_description', # ✅ Kept for serializer
            'og_image_id', # ✅ Needed for SQL join, must be in only()
            'property_type__id', 'property_type__public_id', 'property_type__title', 'property_type__display_order',
            'state__id', 'state__public_id', 'state__title',
            'agent__id', 'agent__public_id', 'agent__user_id', 'agent__license_number', 'agent__profile_picture_id',
            'agent__user__id', 'agent__user__mobile', 'agent__user__email',
            'agent__user__admin_profile__first_name', 'agent__user__admin_profile__last_name',
            'agent__profile_picture__id', 'agent__profile_picture__file',
            'agent__user__admin_profile__id', 'agent__user__admin_profile__profile_picture_id',
            'agent__user__admin_profile__profile_picture__id', 'agent__user__admin_profile__profile_picture__file',
            'agency__id', 'agency__public_id', 'agency__name', 'agency__slug', 'agency__phone',
            'agency__email', 'agency__license_number', 'agency__profile_picture_id',
            'agency__profile_picture__id', 'agency__profile_picture__file',
            'city__id', 'city__name', 'province__id', 'province__name', 'region__id', 'region__name',
        )

    def for_public_listing(self):
        
        return self.published().with_relations().defer(
            'meta_title', 'meta_description',
            'og_title', 'og_description', 'og_image_id',
            'canonical_url', 'robots_meta',
            'structured_data', 'hreflang_data',
            'description',
            'address',
            'extra_attributes',
            'search_vector'
        )
    
    def for_detail(self):
        from django.db.models import Prefetch
        from src.real_estate.models.media import PropertyImage, PropertyVideo, PropertyAudio, PropertyDocument
        from src.real_estate.models.floor_plan import RealEstateFloorPlan
        from src.real_estate.models.floor_plan_media import FloorPlanImage
        
        return self.select_related(
            'property_type',
            'state',
            'agent',
            'agent__agency',
            'agent__user',
            'agent__user__admin_profile',
            'agency',
            'region',
            'city',
            'province',
            'og_image',
            'created_by',
            'created_by__admin_profile'
        ).prefetch_related(
            'labels',
            'tags',
            'features',
            Prefetch(
                'images',
                queryset=PropertyImage.objects.select_related('image').order_by('is_main', 'order', 'created_at'),
                to_attr='all_images'
            ),
            Prefetch(
                'videos',
                queryset=PropertyVideo.objects.select_related('video', 'video__cover_image', 'cover_image').order_by('order', 'created_at')
            ),
            Prefetch(
                'audios',
                queryset=PropertyAudio.objects.select_related('audio', 'audio__cover_image', 'cover_image').order_by('order', 'created_at')
            ),
            Prefetch(
                'documents',
                queryset=PropertyDocument.objects.select_related('document', 'document__cover_image', 'cover_image').order_by('order', 'created_at')
            ),
            Prefetch(
                'floor_plans',
                queryset=RealEstateFloorPlan.objects.filter(is_active=True)
                    .order_by('display_order', 'floor_number')
                    .prefetch_related(
                        Prefetch(
                            'images',
                            queryset=FloorPlanImage.objects.select_related('image').order_by('order', 'created_at')
                        )
                    )
            )
        )
    
    def search(self, query):
        query = (query or '').strip()
        if not query or len(query) < 2:
            return self

        search_query = SearchQuery(query, search_type='websearch', config='english')

        return self.annotate(
            search_rank=SearchRank(models.F('search_vector'), search_query)
        ).filter(
            Q(search_vector=search_query) |
            Q(title__icontains=query) |
            Q(city__name__icontains=query) |
            Q(province__name__icontains=query) |
            Q(region__name__icontains=query) |
            Q(neighborhood__icontains=query) |
            Q(slug__icontains=query)
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

    def with_map_coords(self):
        
        return self.filter(
            latitude__isnull=False,
            longitude__isnull=False
        )
    
    def nearby(self, latitude, longitude, radius_km=2.0):
        
        from src.real_estate.services.admin.property_geo_services import PropertyGeoService
        return PropertyGeoService.search_nearby(
            latitude=latitude,
            longitude=longitude,
            radius_km=radius_km,
            queryset=self
        )
    
    def in_bbox(self, min_lat, max_lat, min_lon, max_lon):
        
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
        
        return self.filter(is_active=True)
    
    def with_counts(self):
        
        return self.annotate(
            property_count=Count('properties', 
                                filter=Q(properties__is_published=True))
        )
    
    def roots(self):
        
        return self.filter(depth=1)
    
    def for_tree(self):
        
        return self.only('id', 'title', 'slug', 'depth', 'path', 'public_id', 'display_order')

class ListingTypeQuerySet(models.QuerySet):
    
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
        
        return self.select_related('agency', 'agency__city', 'user', 'city', 'avatar', 'cover_image')
    
    def with_counts(self):
        
        return self.annotate(
            properties_count=Count('properties', 
                                filter=Q(properties__is_published=True))
        )
    
    def by_city(self, city_id):
        return self.filter(city_id=city_id)
    
    def by_agency(self, agency_id):
        return self.filter(agency_id=agency_id)
    
    def independent(self):
        
        return self.filter(agency__isnull=True)
