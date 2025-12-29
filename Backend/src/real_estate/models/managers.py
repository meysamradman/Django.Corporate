from django.db import models
from django.db.models import Prefetch, Count, Q


class PropertyQuerySet(models.QuerySet):
    
    def published(self):
        return self.filter(is_published=True, is_public=True)
    
    def active(self):
        return self.filter(is_active=True)
    
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
            'country',
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
        from src.real_estate.models.media import PropertyImage, PropertyVideo, PropertyAudio, PropertyDocument
        
        queryset = self.select_related(
            'property_type',
            'state',
            'agent',
            'agent__user',
            'agent__agency',
            'agency',
            'city',
            'city__province',
            'province',
            'country',
            'region'
        ).prefetch_related(
            'labels',
            'tags',
            'features',
            Prefetch(
                'images',
                queryset=PropertyImage.objects.select_related('image')
                    .filter(is_main=True)
                    .only('id', 'image_id', 'is_main', 'order'),
                to_attr='main_image_prefetch'
            ),
            Prefetch(
                'videos',
                queryset=PropertyVideo.objects.select_related('video', 'cover_image').order_by('order', 'created_at')
            ),
            Prefetch(
                'audios',
                queryset=PropertyAudio.objects.select_related('audio', 'cover_image').order_by('order', 'created_at')
            ),
            Prefetch(
                'documents',
                queryset=PropertyDocument.objects.select_related('document', 'cover_image').order_by('order', 'created_at')
            )
        ).annotate(
            labels_count=Count('labels', distinct=True),
            tags_count=Count('tags', distinct=True),
            features_count=Count('features', distinct=True)
        ).only(
            'id', 'public_id', 'title', 'slug', 'short_description',
            'is_published', 'is_featured', 'is_public', 'is_verified', 'is_active',
            'property_type_id', 'state_id', 'agent_id', 'agency_id',
            'city_id', 'region_id', 'province_id', 'country_id', 'neighborhood',
            'price', 'sale_price',
            'bedrooms', 'bathrooms', 'built_area', 'land_area',
            'parking_spaces', 'year_built',
            'views_count', 'favorites_count', 'inquiries_count',
            'published_at', 'created_at', 'updated_at'
        )
    
    def for_public_listing(self):
        return self.published().with_relations()
    
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
            'province',
            'country'
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
    
    def verified(self):
        return self.filter(is_verified=True)
    
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
    
    def by_category(self, category):
        return self.filter(category=category)
    
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
