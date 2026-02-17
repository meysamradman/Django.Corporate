import hashlib
import json

from django.core.cache import cache
from django.db.models import Count, Q
from src.portfolio.models.tag import PortfolioTag

class PortfolioTagPublicService:
    ALLOWED_ORDERING_FIELDS = {'name', 'portfolio_count', 'created_at'}

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
    def get_popular_tags(limit=10):
        queryset = PortfolioTagPublicService._base_queryset().order_by('-portfolio_count', 'name')[:limit]
        return queryset

