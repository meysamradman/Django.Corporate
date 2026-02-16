import hashlib
import json

from django.core.cache import cache
from django.db.models import Count, Q
from src.portfolio.models.option import PortfolioOption

class PortfolioOptionPublicService:
    ALLOWED_ORDERING_FIELDS = {'name', 'slug', 'portfolio_count', 'created_at'}

    @staticmethod
    def _build_cache_key(prefix, payload):
        serialized = json.dumps(payload, sort_keys=True, default=str)
        digest = hashlib.md5(serialized.encode('utf-8')).hexdigest()
        return f"{prefix}:{digest}"

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
        payload = {
            'filters': filters or {},
            'search': search or '',
            'ordering': PortfolioOptionPublicService._normalize_ordering(ordering),
        }
        cache_key = PortfolioOptionPublicService._build_cache_key('portfolio_public_option_list', payload)
        cached_result = cache.get(cache_key)
        if cached_result is not None:
            return cached_result

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
        cache.set(cache_key, queryset, 300)
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
    def get_options_by_name(name, limit=10):
        return PortfolioOptionPublicService._base_queryset().filter(
            name=name,
        ).order_by('-portfolio_count', 'name')[:limit]

