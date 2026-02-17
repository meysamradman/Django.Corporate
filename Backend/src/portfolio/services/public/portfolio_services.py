from datetime import date

from django.core.cache import cache
from django.db.models import Q
from src.portfolio.models.portfolio import Portfolio
from src.portfolio.serializers.public.portfolio_serializer import (
    PortfolioPublicDetailSerializer,
    PortfolioPublicListSerializer,
)
from src.portfolio.utils.cache_public import PortfolioPublicCacheKeys

class PortfolioPublicService:
    ALLOWED_ORDERING_FIELDS = {'created_at', 'title', 'is_featured'}
    LIST_CACHE_TTL = 90
    DETAIL_CACHE_TTL = 180
    FEATURED_CACHE_TTL = 90
    RELATED_CACHE_TTL = 90

    @staticmethod
    def _normalize_ordering(ordering):
        if not ordering:
            return '-created_at'

        candidate = ordering.split(',')[0].strip()
        descending = candidate.startswith('-')
        field = candidate[1:] if descending else candidate

        if field not in PortfolioPublicService.ALLOWED_ORDERING_FIELDS:
            return '-created_at'

        return f"-{field}" if descending else field

    @staticmethod
    def _parse_date(value):
        if not value:
            return None
        try:
            return date.fromisoformat(str(value))
        except (TypeError, ValueError):
            return None

    @staticmethod
    def get_portfolio_queryset(filters=None, search=None, ordering=None):
        queryset = Portfolio.objects.active().published().for_public_listing().prefetch_related('options')
        
        if filters:
            if filters.get('category_slug'):
                queryset = queryset.filter(categories__slug=filters['category_slug'])
            if filters.get('is_featured') is not None:
                queryset = queryset.filter(is_featured=filters['is_featured'])
            if filters.get('tag_slug'):
                queryset = queryset.filter(tags__slug=filters['tag_slug'])
            created_after = PortfolioPublicService._parse_date(filters.get('created_after'))
            created_before = PortfolioPublicService._parse_date(filters.get('created_before'))
            if created_after:
                queryset = queryset.filter(created_at__date__gte=created_after)
            if created_before:
                queryset = queryset.filter(created_at__date__lte=created_before)
        
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(short_description__icontains=search) |
                Q(description__icontains=search) |
                Q(categories__name__icontains=search) |
                Q(tags__name__icontains=search)
            ).distinct()
        
        queryset = queryset.order_by(PortfolioPublicService._normalize_ordering(ordering))
        return queryset
    
    @staticmethod
    def get_portfolio_by_slug(slug):
        portfolio = Portfolio.objects.active().published().filter(
            slug=slug,
        ).for_detail().first()
        return portfolio
    
    @staticmethod
    def get_portfolio_by_public_id(public_id):
        portfolio = Portfolio.objects.active().published().filter(
            public_id=public_id,
        ).for_detail().first()
        return portfolio
    
    @staticmethod
    def get_featured_portfolios(limit=6):
        portfolios = Portfolio.objects.active().published().filter(
            is_featured=True
        ).for_public_listing().prefetch_related('options').order_by('-created_at')[:limit]
        return portfolios
    
    @staticmethod
    def get_related_portfolios(portfolio, limit=4):
        category_ids = portfolio.categories.values_list('id', flat=True)
        portfolios = Portfolio.objects.active().published().filter(
            categories__id__in=category_ids
        ).exclude(
            id=portfolio.id
        ).for_public_listing().prefetch_related('options').distinct().order_by('-created_at')[:limit]
        return portfolios

    @staticmethod
    def get_portfolio_list_data(filters=None, search=None, ordering=None):
        cache_key = PortfolioPublicCacheKeys.list(filters=filters, search=search, ordering=ordering)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        queryset = PortfolioPublicService.get_portfolio_queryset(filters=filters, search=search, ordering=ordering)
        data = list(PortfolioPublicListSerializer(queryset, many=True).data)
        cache.set(cache_key, data, PortfolioPublicService.LIST_CACHE_TTL)
        return data

    @staticmethod
    def get_portfolio_detail_by_slug_data(slug):
        cache_key = PortfolioPublicCacheKeys.detail_slug(slug)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        portfolio = PortfolioPublicService.get_portfolio_by_slug(slug)
        if not portfolio:
            return None

        data = dict(PortfolioPublicDetailSerializer(portfolio).data)
        cache.set(cache_key, data, PortfolioPublicService.DETAIL_CACHE_TTL)
        return data

    @staticmethod
    def get_portfolio_detail_by_public_id_data(public_id):
        cache_key = PortfolioPublicCacheKeys.detail_public_id(public_id)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        portfolio = PortfolioPublicService.get_portfolio_by_public_id(public_id)
        if not portfolio:
            return None

        data = dict(PortfolioPublicDetailSerializer(portfolio).data)
        cache.set(cache_key, data, PortfolioPublicService.DETAIL_CACHE_TTL)
        return data

    @staticmethod
    def get_featured_portfolios_data(limit=6):
        cache_key = PortfolioPublicCacheKeys.featured(limit)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        portfolios = PortfolioPublicService.get_featured_portfolios(limit=limit)
        data = list(PortfolioPublicListSerializer(portfolios, many=True).data)
        cache.set(cache_key, data, PortfolioPublicService.FEATURED_CACHE_TTL)
        return data

    @staticmethod
    def get_related_portfolios_by_slug_data(slug, limit=4):
        cache_key = PortfolioPublicCacheKeys.related(slug, limit)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        portfolio = PortfolioPublicService.get_portfolio_by_slug(slug)
        if not portfolio:
            return None

        related_portfolios = PortfolioPublicService.get_related_portfolios(portfolio, limit=limit)
        data = list(PortfolioPublicListSerializer(related_portfolios, many=True).data)
        cache.set(cache_key, data, PortfolioPublicService.RELATED_CACHE_TTL)
        return data