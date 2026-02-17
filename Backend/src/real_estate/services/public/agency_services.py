from datetime import datetime
from django.core.cache import cache
from django.db.models import Count, Q

from src.real_estate.models.agency import RealEstateAgency
from src.real_estate.messages.messages import AGENCY_ERRORS
from src.real_estate.serializers.public.agency_serializer import (
    RealEstateAgencyPublicDetailSerializer,
    RealEstateAgencyPublicListSerializer,
)
from src.real_estate.serializers.public.agent_serializer import PropertyAgentPublicListSerializer
from src.real_estate.utils.cache_public import AgencyPublicCacheKeys
from src.real_estate.utils.cache_ttl import (
    PUBLIC_AGENCY_DETAIL_TTL,
    PUBLIC_AGENCY_LIST_TTL,
    PUBLIC_AGENCY_STATS_TTL,
    PUBLIC_AGENCY_WITH_AGENTS_TTL,
)

class RealEstateAgencyPublicService:

    ALLOWED_ORDERING_FIELDS = {
        'rating',
        'total_reviews',
        'name',
        'created_at',
    }

    @staticmethod
    def _parse_int(value):

        try:
            return int(value)
        except (TypeError, ValueError):
            return None

    @staticmethod
    def _parse_float(value):

        try:
            return float(value)
        except (TypeError, ValueError):
            return None

    @staticmethod
    def _parse_bool(value):

        if value is None:
            return None
        if isinstance(value, bool):
            return value
        if isinstance(value, str):
            return value.lower() in ('1', 'true', 'yes', 'on')
        return None

    @staticmethod
    def _normalize_ordering(ordering):

        if not ordering:
            return ('-rating', 'name')

        candidate = ordering.split(',')[0].strip()
        descending = candidate.startswith('-')
        field = candidate[1:] if descending else candidate

        if field not in RealEstateAgencyPublicService.ALLOWED_ORDERING_FIELDS:
            return ('-rating', 'name')

        return (f"-{field}" if descending else field,)

    @staticmethod
    def _base_queryset():

        return RealEstateAgency.objects.filter(
            is_active=True
        ).select_related(
            'province',
            'city',
            'profile_picture'
        ).prefetch_related(
            'agents',
            'social_media',
            'social_media__icon'
        ).annotate(
            property_count=Count(
                'properties',
                filter=Q(
                    properties__is_active=True,
                    properties__is_public=True,
                    properties__is_published=True,
                ),
                distinct=True,
            ),
            agent_count=Count(
                'agents',
                filter=Q(agents__is_active=True),
                distinct=True,
            )
        )

    @staticmethod
    def get_agency_queryset(filters=None, search=None, ordering=None):

        queryset = RealEstateAgencyPublicService._base_queryset()

        if filters:
            province_id = RealEstateAgencyPublicService._parse_int(filters.get('province_id'))
            if province_id is not None:
                queryset = queryset.filter(province_id=province_id)

            city_id = RealEstateAgencyPublicService._parse_int(filters.get('city_id'))
            if city_id is not None:
                queryset = queryset.filter(city_id=city_id)

            min_rating = RealEstateAgencyPublicService._parse_float(filters.get('min_rating'))
            if min_rating is not None:
                queryset = queryset.filter(rating__gte=min_rating)

            min_agents = RealEstateAgencyPublicService._parse_int(filters.get('min_agents'))
            if min_agents is not None:
                queryset = queryset.filter(agent_count__gte=min_agents)

            min_properties = RealEstateAgencyPublicService._parse_int(filters.get('min_properties'))
            if min_properties is not None:
                queryset = queryset.filter(property_count__gte=min_properties)

        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search) |
                Q(address__icontains=search) |
                Q(license_number__icontains=search)
            )

        queryset = queryset.order_by(*RealEstateAgencyPublicService._normalize_ordering(ordering))
        return queryset.distinct()

    @staticmethod
    def get_agency_by_slug(slug):

        try:
            return RealEstateAgencyPublicService._base_queryset().get(slug=slug)
        except RealEstateAgency.DoesNotExist:
            return None

    @staticmethod
    def get_agency_by_public_id(public_id):

        try:
            return RealEstateAgencyPublicService._base_queryset().get(public_id=public_id)
        except RealEstateAgency.DoesNotExist:
            return None

    @staticmethod
    def get_agency_by_id(agency_id):

        try:
            return RealEstateAgencyPublicService._base_queryset().get(id=agency_id)
        except RealEstateAgency.DoesNotExist:
            return None

    @staticmethod
    def get_featured_agencies(limit=6):

        return RealEstateAgencyPublicService._base_queryset().order_by('-rating', '-total_reviews')[:limit]

    @staticmethod
    def get_top_rated_agencies(limit=10):

        return RealEstateAgencyPublicService._base_queryset().filter(
            rating__gte=4.0
        ).order_by('-rating', '-total_reviews')[:limit]

    @staticmethod
    def get_agencies_by_city(city_id, limit=None):

        queryset = RealEstateAgencyPublicService._base_queryset().filter(
            city_id=city_id
        ).order_by('-rating', 'name')
        
        if limit:
            queryset = queryset[:limit]
        
        return queryset

    @staticmethod
    def get_agencies_by_province(province_id, limit=None):

        queryset = RealEstateAgencyPublicService._base_queryset().filter(
            province_id=province_id
        ).order_by('-rating', 'name')
        
        if limit:
            queryset = queryset[:limit]
        
        return queryset

    @staticmethod
    def get_agency_with_agents(slug_or_id):

        try:
            if isinstance(slug_or_id, str):
                agency = RealEstateAgencyPublicService._base_queryset().prefetch_related(
                    'agents__user__admin_profile'
                ).get(slug=slug_or_id)
            else:
                agency = RealEstateAgencyPublicService._base_queryset().prefetch_related(
                    'agents__user__admin_profile'
                ).get(id=slug_or_id)
            
            return {
                'agency': agency,
                'agents': agency.agents.filter(is_active=True).select_related(
                    'user', 'user__admin_profile'
                ).order_by('-rating', '-total_sales')
            }
        except RealEstateAgency.DoesNotExist:
            return None

    @staticmethod
    def get_agency_statistics(agency_id):

        from django.db.models import Sum, Avg
        
        try:
            agency = RealEstateAgency.objects.get(id=agency_id, is_active=True)
        except RealEstateAgency.DoesNotExist:
            return None
        
        agents_stats = agency.agents.filter(is_active=True).aggregate(
            total_agents=Count('id'),
            verified_agents=Count('id', filter=Q(is_verified=True)),
            avg_agent_rating=Avg('rating'),
            total_sales_by_agents=Sum('total_sales'),
        )
        
        properties_stats = agency.properties.filter(
            is_active=True, is_published=True
        ).aggregate(
            total_properties=Count('id'),
            featured_properties=Count('id', filter=Q(is_featured=True)),
        )
        
        return {
            'agency_id': agency.id,
            'agency_name': agency.name,
            'rating': agency.rating,
            'total_reviews': agency.total_reviews,
            **agents_stats,
            **properties_stats
        }

    @staticmethod
    def search_agencies(query, filters=None):

        queryset = RealEstateAgencyPublicService._base_queryset()
        
        if query:
            queryset = queryset.filter(
                Q(name__icontains=query) |
                Q(description__icontains=query) |
                Q(address__icontains=query) |
                Q(license_number__icontains=query) |
                Q(city__name__icontains=query) |
                Q(province__name__icontains=query)
            )
        
        if filters:
            min_rating = RealEstateAgencyPublicService._parse_float(filters.get('min_rating'))
            if min_rating is not None:
                queryset = queryset.filter(rating__gte=min_rating)
            
            city_id = RealEstateAgencyPublicService._parse_int(filters.get('city_id'))
            if city_id is not None:
                queryset = queryset.filter(city_id=city_id)
        
        return queryset.order_by('-rating', 'name').distinct()

    @staticmethod
    def get_nearby_agencies(latitude, longitude, radius_km=10, limit=10):

        return RealEstateAgencyPublicService._base_queryset().order_by('-rating')[:limit]

    @staticmethod
    def get_agency_list_data(filters=None, search=None, ordering=None):
        cache_key = AgencyPublicCacheKeys.list(filters=filters, search=search, ordering=ordering)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        queryset = RealEstateAgencyPublicService.get_agency_queryset(filters=filters, search=search, ordering=ordering)
        data = RealEstateAgencyPublicListSerializer(queryset, many=True).data
        cache.set(cache_key, data, PUBLIC_AGENCY_LIST_TTL)
        return data

    @staticmethod
    def get_agency_detail_by_slug_data(slug):
        cache_key = AgencyPublicCacheKeys.detail_slug(slug)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        agency = RealEstateAgencyPublicService.get_agency_by_slug(slug)
        if not agency:
            return None

        data = RealEstateAgencyPublicDetailSerializer(agency).data
        cache.set(cache_key, data, PUBLIC_AGENCY_DETAIL_TTL)
        return data

    @staticmethod
    def get_featured_agencies_data(limit=6):
        cache_key = AgencyPublicCacheKeys.featured(limit)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        queryset = RealEstateAgencyPublicService.get_featured_agencies(limit=limit)
        data = RealEstateAgencyPublicListSerializer(queryset, many=True).data
        cache.set(cache_key, data, PUBLIC_AGENCY_LIST_TTL)
        return data

    @staticmethod
    def get_top_rated_agencies_data(limit=10):
        cache_key = AgencyPublicCacheKeys.top_rated(limit)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        queryset = RealEstateAgencyPublicService.get_top_rated_agencies(limit=limit)
        data = RealEstateAgencyPublicListSerializer(queryset, many=True).data
        cache.set(cache_key, data, PUBLIC_AGENCY_LIST_TTL)
        return data

    @staticmethod
    def get_agencies_by_city_data(city_id, limit=None):
        cache_key = AgencyPublicCacheKeys.by_city(city_id, limit)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        queryset = RealEstateAgencyPublicService.get_agencies_by_city(city_id=city_id, limit=limit)
        data = RealEstateAgencyPublicListSerializer(queryset, many=True).data
        cache.set(cache_key, data, PUBLIC_AGENCY_LIST_TTL)
        return data

    @staticmethod
    def get_agencies_by_province_data(province_id, limit=None):
        cache_key = AgencyPublicCacheKeys.by_province(province_id, limit)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        queryset = RealEstateAgencyPublicService.get_agencies_by_province(province_id=province_id, limit=limit)
        data = RealEstateAgencyPublicListSerializer(queryset, many=True).data
        cache.set(cache_key, data, PUBLIC_AGENCY_LIST_TTL)
        return data

    @staticmethod
    def get_agency_statistics_data(agency_id):
        cache_key = AgencyPublicCacheKeys.statistics(agency_id)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        stats = RealEstateAgencyPublicService.get_agency_statistics(agency_id)
        if stats is None:
            return None

        cache.set(cache_key, stats, PUBLIC_AGENCY_STATS_TTL)
        return stats

    @staticmethod
    def get_agency_with_agents_data(slug):
        cache_key = AgencyPublicCacheKeys.with_agents(slug)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        agency_data = RealEstateAgencyPublicService.get_agency_with_agents(slug)
        if not agency_data:
            return None

        payload = {
            'agency': RealEstateAgencyPublicDetailSerializer(agency_data['agency']).data,
            'agents': PropertyAgentPublicListSerializer(agency_data['agents'], many=True).data,
        }
        cache.set(cache_key, payload, PUBLIC_AGENCY_WITH_AGENTS_TTL)
        return payload
