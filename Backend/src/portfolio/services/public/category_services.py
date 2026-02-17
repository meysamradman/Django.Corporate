from django.core.cache import cache
from django.db.models import Count, Q
from src.portfolio.models.category import PortfolioCategory
from src.portfolio.serializers.public.category_serializer import PortfolioCategoryPublicSerializer
from src.portfolio.utils.cache_public import PortfolioCategoryPublicCacheKeys
from src.portfolio.utils import cache_ttl

class PortfolioCategoryPublicService:
    ALLOWED_ORDERING_FIELDS = {'name', 'portfolio_count', 'created_at'}
    LIST_CACHE_TTL = cache_ttl.TAXONOMY_LIST_TTL
    DETAIL_CACHE_TTL = cache_ttl.TAXONOMY_DETAIL_TTL
    TREE_CACHE_TTL = cache_ttl.TAXONOMY_TREE_TTL
    ROOTS_CACHE_TTL = cache_ttl.TAXONOMY_ROOTS_TTL

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

    @staticmethod
    def _build_category_maps(items):
        category_list = list(items)
        if not category_list:
            return {'category_parent_map': {}, 'category_children_map': {}}

        by_path = {getattr(item, 'path', None): item for item in category_list}
        parent_map = {}
        children_map = {item.id: [] for item in category_list}

        for item in category_list:
            path = getattr(item, 'path', '')
            depth = getattr(item, 'depth', 0)
            steplen = getattr(item, 'steplen', 4)

            if depth > 1 and path:
                parent_path = path[:-steplen]
                parent = by_path.get(parent_path)
                if parent:
                    parent_map[item.id] = {
                        'public_id': parent.public_id,
                        'name': parent.name,
                        'slug': parent.slug,
                    }
                    children_map[parent.id].append({
                        'public_id': item.public_id,
                        'name': item.name,
                        'slug': item.slug,
                    })

        return {
            'category_parent_map': parent_map,
            'category_children_map': children_map,
        }

    @staticmethod
    def _serialize_categories(items):
        maps = PortfolioCategoryPublicService._build_category_maps(items)
        serializer = PortfolioCategoryPublicSerializer(
            items,
            many=True,
            context={
                'category_parent_map': maps['category_parent_map'],
                'category_children_map': maps['category_children_map'],
            },
        )
        return list(serializer.data)

    @staticmethod
    def _serialize_category(item):
        maps = PortfolioCategoryPublicService._build_category_maps([item])
        serializer = PortfolioCategoryPublicSerializer(
            item,
            context={
                'category_parent_map': maps['category_parent_map'],
                'category_children_map': maps['category_children_map'],
            },
        )
        return dict(serializer.data)

    @staticmethod
    def get_category_list_data(filters=None, search=None, ordering=None):
        cache_key = PortfolioCategoryPublicCacheKeys.list(filters=filters, search=search, ordering=ordering)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        queryset = PortfolioCategoryPublicService.get_category_queryset(filters=filters, search=search, ordering=ordering)
        data = PortfolioCategoryPublicService._serialize_categories(queryset)
        cache.set(cache_key, data, PortfolioCategoryPublicService.LIST_CACHE_TTL)
        return data

    @staticmethod
    def get_tree_data_serialized():
        cache_key = PortfolioCategoryPublicCacheKeys.tree()
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        queryset = PortfolioCategoryPublicService.get_tree_data()
        data = PortfolioCategoryPublicService._serialize_categories(queryset)
        cache.set(cache_key, data, PortfolioCategoryPublicService.TREE_CACHE_TTL)
        return data

    @staticmethod
    def get_root_categories_serialized():
        cache_key = PortfolioCategoryPublicCacheKeys.roots()
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        categories = PortfolioCategoryPublicService.get_root_categories()
        data = PortfolioCategoryPublicService._serialize_categories(categories)
        cache.set(cache_key, data, PortfolioCategoryPublicService.ROOTS_CACHE_TTL)
        return data

    @staticmethod
    def get_category_detail_by_slug_data(slug):
        cache_key = PortfolioCategoryPublicCacheKeys.detail_slug(slug)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        category = PortfolioCategoryPublicService.get_category_by_slug(slug)
        if not category:
            return None

        data = PortfolioCategoryPublicService._serialize_category(category)
        cache.set(cache_key, data, PortfolioCategoryPublicService.DETAIL_CACHE_TTL)
        return data

    @staticmethod
    def get_category_detail_by_public_id_data(public_id):
        cache_key = PortfolioCategoryPublicCacheKeys.detail_public_id(public_id)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        category = PortfolioCategoryPublicService.get_category_by_public_id(public_id)
        if not category:
            return None

        data = PortfolioCategoryPublicService._serialize_category(category)
        cache.set(cache_key, data, PortfolioCategoryPublicService.DETAIL_CACHE_TTL)
        return data

