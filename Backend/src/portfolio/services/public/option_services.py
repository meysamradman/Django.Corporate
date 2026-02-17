from django.core.cache import cache
from django.db.models import Count, Q
from src.portfolio.models.option import PortfolioOption
from src.portfolio.serializers.public.option_serializer import PortfolioOptionPublicSerializer
from src.portfolio.utils.cache_public import PortfolioOptionPublicCacheKeys
from src.portfolio.utils import cache_ttl

class PortfolioOptionPublicService:
    ALLOWED_ORDERING_FIELDS = {'name', 'slug', 'portfolio_count', 'created_at'}
    LIST_CACHE_TTL = cache_ttl.TAXONOMY_LIST_TTL
    DETAIL_CACHE_TTL = cache_ttl.TAXONOMY_DETAIL_TTL
    BY_NAME_CACHE_TTL = cache_ttl.TAXONOMY_BY_NAME_TTL

    @staticmethod
    def _normalize_ordering(ordering):
        if not ordering:
            return ('-portfolio_count', 'name')

        candidate = ordering.split(',')[0].strip()
        descending = candidate.startswith('-')
        field = candidate[1:] if descending else candidate

        if field not in PortfolioOptionPublicService.ALLOWED_ORDERING_FIELDS:
            return ('-portfolio_count', 'name')

        return (f"-{field}" if descending else field,)

    @staticmethod
    def _parse_int(value):
        try:
            return int(value)
        except (TypeError, ValueError):
            return None

    @staticmethod
    def _base_queryset():
        return PortfolioOption.objects.filter(
            is_active=True,
            is_public=True,
        ).annotate(
            portfolio_count=Count(
                'portfolio_options',
                filter=Q(
                    portfolio_options__is_active=True,
                    portfolio_options__is_public=True,
                    portfolio_options__status='published',
                ),
            )
        ).filter(portfolio_count__gt=0)

    @staticmethod
    def get_option_queryset(filters=None, search=None, ordering=None):
        queryset = PortfolioOptionPublicService._base_queryset()
        
        if filters:
            if filters.get('name'):
                queryset = queryset.filter(name__icontains=filters['name'])
            min_portfolio_count = PortfolioOptionPublicService._parse_int(filters.get('min_portfolio_count'))
            if min_portfolio_count is not None:
                queryset = queryset.filter(portfolio_count__gte=min_portfolio_count)
        
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(slug__icontains=search) |
                Q(description__icontains=search)
            )
        
        queryset = queryset.order_by(*PortfolioOptionPublicService._normalize_ordering(ordering))
        return queryset
    
    @staticmethod
    def get_option_by_slug(slug):
        return PortfolioOptionPublicService._base_queryset().filter(
            slug=slug, 
        ).first()

    @staticmethod
    def get_option_by_public_id(public_id):
        return PortfolioOptionPublicService._base_queryset().filter(
            public_id=public_id,
        ).first()

    @staticmethod
    def get_option_by_id(option_id):
        return PortfolioOptionPublicService._base_queryset().filter(
            id=option_id,
        ).first()
    
    @staticmethod
    def get_options_by_name(name, limit=10):
        return PortfolioOptionPublicService._base_queryset().filter(
            name=name,
        ).order_by('-portfolio_count', 'name')[:limit]

    @staticmethod
    def get_option_list_data(filters=None, search=None, ordering=None):
        cache_key = PortfolioOptionPublicCacheKeys.list(filters=filters, search=search, ordering=ordering)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        queryset = PortfolioOptionPublicService.get_option_queryset(filters=filters, search=search, ordering=ordering)
        data = list(PortfolioOptionPublicSerializer(queryset, many=True).data)
        cache.set(cache_key, data, PortfolioOptionPublicService.LIST_CACHE_TTL)
        return data

    @staticmethod
    def get_option_detail_by_slug_data(slug):
        cache_key = PortfolioOptionPublicCacheKeys.detail_slug(slug)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        option = PortfolioOptionPublicService.get_option_by_slug(slug)
        if not option:
            return None

        data = dict(PortfolioOptionPublicSerializer(option).data)
        cache.set(cache_key, data, PortfolioOptionPublicService.DETAIL_CACHE_TTL)
        return data

    @staticmethod
    def get_option_detail_by_public_id_data(public_id):
        cache_key = PortfolioOptionPublicCacheKeys.detail_public_id(public_id)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        option = PortfolioOptionPublicService.get_option_by_public_id(public_id)
        if not option:
            return None

        data = dict(PortfolioOptionPublicSerializer(option).data)
        cache.set(cache_key, data, PortfolioOptionPublicService.DETAIL_CACHE_TTL)
        return data

    @staticmethod
    def get_option_detail_by_id_data(option_id):
        cache_key = PortfolioOptionPublicCacheKeys.detail_id(option_id)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        option = PortfolioOptionPublicService.get_option_by_id(option_id)
        if not option:
            return None

        data = dict(PortfolioOptionPublicSerializer(option).data)
        cache.set(cache_key, data, PortfolioOptionPublicService.DETAIL_CACHE_TTL)
        return data

    @staticmethod
    def get_options_by_name_data(name, limit=10):
        cache_key = PortfolioOptionPublicCacheKeys.by_name(name=name, limit=limit)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        options = PortfolioOptionPublicService.get_options_by_name(name=name, limit=limit)
        data = list(PortfolioOptionPublicSerializer(options, many=True).data)
        cache.set(cache_key, data, PortfolioOptionPublicService.BY_NAME_CACHE_TTL)
        return data

