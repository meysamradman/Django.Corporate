from django.db.models import Count, Q
from src.portfolio.models.category import PortfolioCategory

class PortfolioCategoryPublicService:
    ALLOWED_ORDERING_FIELDS = {'name', 'portfolio_count', 'created_at'}

    @staticmethod
    def _normalize_ordering(ordering):
        if not ordering:
            return ('-portfolio_count', 'name')

        candidate = ordering.split(',')[0].strip()
        descending = candidate.startswith('-')
        field = candidate[1:] if descending else candidate

        if field not in PortfolioCategoryPublicService.ALLOWED_ORDERING_FIELDS:
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
        return PortfolioCategory.objects.filter(
            is_active=True,
            is_public=True,
        ).annotate(
            portfolio_count=Count(
                'portfolio_categories',
                filter=Q(
                    portfolio_categories__is_active=True,
                    portfolio_categories__is_public=True,
                    portfolio_categories__status='published',
                ),
            )
        ).filter(portfolio_count__gt=0)

    @staticmethod
    def get_category_queryset(filters=None, search=None, ordering=None):
        queryset = PortfolioCategoryPublicService._base_queryset().select_related('image')
        
        if filters:
            if filters.get('name'):
                queryset = queryset.filter(name__icontains=filters['name'])
            if filters.get('parent_slug'):
                queryset = queryset.filter(parent__slug=filters['parent_slug'])
            depth = PortfolioCategoryPublicService._parse_int(filters.get('depth'))
            min_portfolio_count = PortfolioCategoryPublicService._parse_int(filters.get('min_portfolio_count'))
            if depth is not None:
                queryset = queryset.filter(depth=depth)
            if min_portfolio_count is not None:
                queryset = queryset.filter(portfolio_count__gte=min_portfolio_count)
        
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search)
            )
        
        queryset = queryset.order_by(*PortfolioCategoryPublicService._normalize_ordering(ordering))
        return queryset
    
    @staticmethod
    def get_category_by_slug(slug):
        return PortfolioCategoryPublicService._base_queryset().filter(
            slug=slug, 
        ).select_related('image').first()

    @staticmethod
    def get_category_by_public_id(public_id):
        return PortfolioCategoryPublicService._base_queryset().filter(
            public_id=public_id,
        ).select_related('image').first()
    
    @staticmethod
    def get_tree_data():
        queryset = PortfolioCategoryPublicService._base_queryset().select_related('image').order_by('path')
        return queryset
    
    @staticmethod
    def get_root_categories():
        return PortfolioCategoryPublicService._base_queryset().filter(
            depth=1
        ).order_by('name')

