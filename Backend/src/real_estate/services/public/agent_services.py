from datetime import datetime
from django.core.cache import cache
from django.db.models import Count, Q

from src.real_estate.models.agent import PropertyAgent
from src.real_estate.messages.messages import AGENT_ERRORS
from src.real_estate.serializers.public.agent_serializer import (
    PropertyAgentPublicDetailSerializer,
    PropertyAgentPublicListSerializer,
)
from src.real_estate.utils.cache_public import AgentPublicCacheKeys
from src.real_estate.utils.cache_ttl import (
    PUBLIC_AGENT_DETAIL_TTL,
    PUBLIC_AGENT_LIST_TTL,
    PUBLIC_AGENT_STATS_TTL,
)

class PropertyAgentPublicService:

    ALLOWED_ORDERING_FIELDS = {
        'rating',
        'total_sales',
        'total_reviews',
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
            return ('-rating', '-total_sales')

        candidate = ordering.split(',')[0].strip()
        descending = candidate.startswith('-')
        field = candidate[1:] if descending else candidate

        if field not in PropertyAgentPublicService.ALLOWED_ORDERING_FIELDS:
            return ('-rating', '-total_sales')

        return (f"-{field}" if descending else field,)

    @staticmethod
    def _base_queryset():

        return PropertyAgent.objects.filter(
            is_active=True
        ).select_related(
            'user',
            'user__admin_profile',
            'user__admin_profile__city',
            'user__admin_profile__province',
            'agency',
            'profile_picture'
        ).prefetch_related(
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
            )
        )

    @staticmethod
    def get_agent_queryset(filters=None, search=None, ordering=None):

        queryset = PropertyAgentPublicService._base_queryset()

        if filters:
            agency_id = PropertyAgentPublicService._parse_int(filters.get('agency_id'))
            if agency_id is not None:
                queryset = queryset.filter(agency_id=agency_id)

            is_verified = PropertyAgentPublicService._parse_bool(filters.get('is_verified'))
            if is_verified is not None:
                queryset = queryset.filter(is_verified=is_verified)

            specialization = filters.get('specialization')
            if specialization:
                queryset = queryset.filter(specialization__icontains=specialization)

            min_rating = PropertyAgentPublicService._parse_float(filters.get('min_rating'))
            if min_rating is not None:
                queryset = queryset.filter(rating__gte=min_rating)

            city_id = PropertyAgentPublicService._parse_int(filters.get('city_id'))
            if city_id is not None:
                queryset = queryset.filter(user__admin_profile__city_id=city_id)

            province_id = PropertyAgentPublicService._parse_int(filters.get('province_id'))
            if province_id is not None:
                queryset = queryset.filter(user__admin_profile__province_id=province_id)

        if search:
            queryset = queryset.filter(
                Q(user__admin_profile__first_name__icontains=search) |
                Q(user__admin_profile__last_name__icontains=search) |
                Q(specialization__icontains=search) |
                Q(bio__icontains=search)
            )

        queryset = queryset.order_by(*PropertyAgentPublicService._normalize_ordering(ordering))
        return queryset.distinct()

    @staticmethod
    def get_agent_by_slug(slug):

        try:
            return PropertyAgentPublicService._base_queryset().get(slug=slug)
        except PropertyAgent.DoesNotExist:
            return None

    @staticmethod
    def get_agent_by_public_id(public_id):

        try:
            return PropertyAgentPublicService._base_queryset().get(public_id=public_id)
        except PropertyAgent.DoesNotExist:
            return None

    @staticmethod
    def get_agent_by_id(agent_id):

        try:
            return PropertyAgentPublicService._base_queryset().get(id=agent_id)
        except PropertyAgent.DoesNotExist:
            return None

    @staticmethod
    def get_featured_agents(limit=6):

        return PropertyAgentPublicService._base_queryset().filter(
            is_verified=True
        ).order_by('-rating', '-total_sales', '-total_reviews')[:limit]

    @staticmethod
    def get_top_rated_agents(limit=10):

        return PropertyAgentPublicService._base_queryset().filter(
            is_verified=True,
            rating__gte=4.0
        ).order_by('-rating', '-total_reviews')[:limit]

    @staticmethod
    def get_agents_by_agency(agency_id, limit=None):

        queryset = PropertyAgentPublicService._base_queryset().filter(
            agency_id=agency_id
        ).order_by('-rating', '-total_sales')
        
        if limit:
            queryset = queryset[:limit]
        
        return queryset

    @staticmethod
    def get_agent_statistics(agent_id):

        from django.db.models import Sum, Avg
        from src.real_estate.models.statistics import AgentStatistics
        
        try:
            agent = PropertyAgent.objects.get(id=agent_id, is_active=True)
        except PropertyAgent.DoesNotExist:
            return None
        
        stats = AgentStatistics.objects.filter(agent=agent).aggregate(
            total_sales_value=Sum('total_sales_value'),
            total_commissions=Sum('total_commissions'),
            properties_sold=Sum('properties_sold'),
            properties_rented=Sum('properties_rented'),
            avg_conversion_rate=Avg('conversion_rate'),
            avg_deal_time=Avg('avg_deal_time'),
        )
        
        return {
            'agent_id': agent.id,
            'agent_name': agent.full_name,
            'rating': agent.rating,
            'total_sales': agent.total_sales,
            'total_reviews': agent.total_reviews,
            **stats
        }

    @staticmethod
    def search_agents(query, filters=None):

        queryset = PropertyAgentPublicService._base_queryset()
        
        if query:
            queryset = queryset.filter(
                Q(user__admin_profile__first_name__icontains=query) |
                Q(user__admin_profile__last_name__icontains=query) |
                Q(specialization__icontains=query) |
                Q(bio__icontains=query) |
                Q(license_number__icontains=query)
            )
        
        if filters:
            is_verified = PropertyAgentPublicService._parse_bool(filters.get('is_verified'))
            if is_verified is not None:
                queryset = queryset.filter(is_verified=is_verified)
            
            min_rating = PropertyAgentPublicService._parse_float(filters.get('min_rating'))
            if min_rating is not None:
                queryset = queryset.filter(rating__gte=min_rating)
        
        return queryset.order_by('-rating', '-total_sales').distinct()

    @staticmethod
    def get_agent_list_data(filters=None, search=None, ordering=None):
        cache_key = AgentPublicCacheKeys.list(filters=filters, search=search, ordering=ordering)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        queryset = PropertyAgentPublicService.get_agent_queryset(filters=filters, search=search, ordering=ordering)
        data = PropertyAgentPublicListSerializer(queryset, many=True).data
        cache.set(cache_key, data, PUBLIC_AGENT_LIST_TTL)
        return data

    @staticmethod
    def get_agent_detail_by_slug_data(slug):
        cache_key = AgentPublicCacheKeys.detail_slug(slug)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        agent = PropertyAgentPublicService.get_agent_by_slug(slug)
        if not agent:
            return None

        data = PropertyAgentPublicDetailSerializer(agent).data
        cache.set(cache_key, data, PUBLIC_AGENT_DETAIL_TTL)
        return data

    @staticmethod
    def get_featured_agents_data(limit=6):
        cache_key = AgentPublicCacheKeys.featured(limit)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        queryset = PropertyAgentPublicService.get_featured_agents(limit=limit)
        data = PropertyAgentPublicListSerializer(queryset, many=True).data
        cache.set(cache_key, data, PUBLIC_AGENT_LIST_TTL)
        return data

    @staticmethod
    def get_top_rated_agents_data(limit=10):
        cache_key = AgentPublicCacheKeys.top_rated(limit)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        queryset = PropertyAgentPublicService.get_top_rated_agents(limit=limit)
        data = PropertyAgentPublicListSerializer(queryset, many=True).data
        cache.set(cache_key, data, PUBLIC_AGENT_LIST_TTL)
        return data

    @staticmethod
    def get_agents_by_agency_data(agency_id, limit=None):
        cache_key = AgentPublicCacheKeys.by_agency(agency_id, limit)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        queryset = PropertyAgentPublicService.get_agents_by_agency(agency_id=agency_id, limit=limit)
        data = PropertyAgentPublicListSerializer(queryset, many=True).data
        cache.set(cache_key, data, PUBLIC_AGENT_LIST_TTL)
        return data

    @staticmethod
    def get_agent_statistics_data(agent_id):
        cache_key = AgentPublicCacheKeys.statistics(agent_id)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        stats = PropertyAgentPublicService.get_agent_statistics(agent_id)
        if stats is None:
            return None

        cache.set(cache_key, stats, PUBLIC_AGENT_STATS_TTL)
        return stats
