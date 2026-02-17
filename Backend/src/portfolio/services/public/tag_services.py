from django.core.cache import cache
from django.db.models import Count, Q
from src.portfolio.models.tag import PortfolioTag
from src.portfolio.serializers.public.tag_serializer import PortfolioTagPublicSerializer
from src.portfolio.utils.cache_public import PortfolioTagPublicCacheKeys
from src.portfolio.utils import cache_ttl

class PortfolioTagPublicService:
    ALLOWED_ORDERING_FIELDS = {'name', 'portfolio_count', 'created_at'}
    LIST_CACHE_TTL = cache_ttl.TAXONOMY_LIST_TTL
    DETAIL_CACHE_TTL = cache_ttl.TAXONOMY_DETAIL_TTL
    POPULAR_CACHE_TTL = cache_ttl.TAXONOMY_POPULAR_TTL

    @staticmethod
    def _normalize_ordering(ordering):
        if not ordering:
            return ('-portfolio_count', 'name')

        candidate = ordering.split(',')[0].strip()
        descending = candidate.startswith('-')
        field = candidate[1:] if descending else candidate

        if field not in PortfolioTagPublicService.ALLOWED_ORDERING_FIELDS:
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
        return PortfolioTag.objects.filter(
            is_active=True,
            is_public=True,
        ).annotate(
            portfolio_count=Count(
                'portfolio_tags',
                filter=Q(
                    portfolio_tags__is_active=True,
                    portfolio_tags__is_public=True,
                    portfolio_tags__status='published',
                ),
            )
        ).filter(portfolio_count__gt=0)

    @staticmethod
    def get_tag_queryset(filters=None, search=None, ordering=None):
        queryset = PortfolioTagPublicService._base_queryset()
        
        if filters:
            if filters.get('name'):
                queryset = queryset.filter(name__icontains=filters['name'])
            min_portfolio_count = PortfolioTagPublicService._parse_int(filters.get('min_portfolio_count'))
            if min_portfolio_count is not None:
                queryset = queryset.filter(portfolio_count__gte=min_portfolio_count)
        
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search)
            )
        
        queryset = queryset.order_by(*PortfolioTagPublicService._normalize_ordering(ordering))
        return queryset
    
    @staticmethod
    def get_tag_by_slug(slug):
        return PortfolioTagPublicService._base_queryset().filter(
            slug=slug, 
        ).first()

    @staticmethod
    def get_tag_by_public_id(public_id):
        return PortfolioTagPublicService._base_queryset().filter(
            public_id=public_id,
        ).first()

    @staticmethod
    def get_tag_by_id(tag_id):
        return PortfolioTagPublicService._base_queryset().filter(
            id=tag_id,
        ).first()
    
    @staticmethod
    def get_popular_tags(limit=10):
        queryset = PortfolioTagPublicService._base_queryset().order_by('-portfolio_count', 'name')[:limit]
        return queryset

    @staticmethod
    def get_tag_list_data(filters=None, search=None, ordering=None):
        cache_key = PortfolioTagPublicCacheKeys.list(filters=filters, search=search, ordering=ordering)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        queryset = PortfolioTagPublicService.get_tag_queryset(filters=filters, search=search, ordering=ordering)
        data = list(PortfolioTagPublicSerializer(queryset, many=True).data)
        cache.set(cache_key, data, PortfolioTagPublicService.LIST_CACHE_TTL)
        return data

    @staticmethod
    def get_tag_detail_by_slug_data(slug):
        cache_key = PortfolioTagPublicCacheKeys.detail_slug(slug)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        tag = PortfolioTagPublicService.get_tag_by_slug(slug)
        if not tag:
            return None

        data = dict(PortfolioTagPublicSerializer(tag).data)
        cache.set(cache_key, data, PortfolioTagPublicService.DETAIL_CACHE_TTL)
        return data

    @staticmethod
    def get_tag_detail_by_public_id_data(public_id):
        cache_key = PortfolioTagPublicCacheKeys.detail_public_id(public_id)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        tag = PortfolioTagPublicService.get_tag_by_public_id(public_id)
        if not tag:
            return None

        data = dict(PortfolioTagPublicSerializer(tag).data)
        cache.set(cache_key, data, PortfolioTagPublicService.DETAIL_CACHE_TTL)
        return data

    @staticmethod
    def get_tag_detail_by_id_data(tag_id):
        cache_key = PortfolioTagPublicCacheKeys.detail_id(tag_id)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        tag = PortfolioTagPublicService.get_tag_by_id(tag_id)
        if not tag:
            return None

        data = dict(PortfolioTagPublicSerializer(tag).data)
        cache.set(cache_key, data, PortfolioTagPublicService.DETAIL_CACHE_TTL)
        return data

    @staticmethod
    def get_popular_tags_data(limit=10):
        cache_key = PortfolioTagPublicCacheKeys.popular(limit)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        tags = PortfolioTagPublicService.get_popular_tags(limit=limit)
        data = list(PortfolioTagPublicSerializer(tags, many=True).data)
        cache.set(cache_key, data, PortfolioTagPublicService.POPULAR_CACHE_TTL)
        return data

