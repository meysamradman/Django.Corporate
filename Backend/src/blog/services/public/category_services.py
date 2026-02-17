from django.core.cache import cache
from django.db.models import Count, Q
from src.blog.models.category import BlogCategory
from src.blog.serializers.public.category_serializer import BlogCategoryPublicSerializer
from src.blog.utils.cache_public import BlogCategoryPublicCacheKeys
from src.blog.utils import cache_ttl

class BlogCategoryPublicService:
    ALLOWED_ORDERING_FIELDS = {'name', 'blog_count', 'created_at'}
    LIST_CACHE_TTL = cache_ttl.TAXONOMY_LIST_TTL
    DETAIL_CACHE_TTL = cache_ttl.TAXONOMY_DETAIL_TTL
    TREE_CACHE_TTL = cache_ttl.TAXONOMY_TREE_TTL
    ROOTS_CACHE_TTL = cache_ttl.TAXONOMY_ROOTS_TTL

    @staticmethod
    def _normalize_ordering(ordering):
        if not ordering:
            return ('-blog_count', 'name')

        candidate = ordering.split(',')[0].strip()
        descending = candidate.startswith('-')
        field = candidate[1:] if descending else candidate

        if field not in BlogCategoryPublicService.ALLOWED_ORDERING_FIELDS:
            return ('-blog_count', 'name')

        return (f"-{field}" if descending else field,)

    @staticmethod
    def _parse_int(value):
        try:
            return int(value)
        except (TypeError, ValueError):
            return None

    @staticmethod
    def _base_queryset():
        return BlogCategory.objects.filter(
            is_active=True,
            is_public=True,
        ).annotate(
            blog_count=Count(
                'blog_categories',
                filter=Q(
                    blog_categories__is_active=True,
                    blog_categories__is_public=True,
                    blog_categories__status='published',
                ),
            )
        ).filter(blog_count__gt=0)

    @staticmethod
    def get_category_queryset(filters=None, search=None, ordering=None):
        queryset = BlogCategoryPublicService._base_queryset().select_related('image')
        
        if filters:
            if filters.get('name'):
                queryset = queryset.filter(name__icontains=filters['name'])
            if filters.get('parent_slug'):
                queryset = queryset.filter(parent__slug=filters['parent_slug'])
            depth = BlogCategoryPublicService._parse_int(filters.get('depth'))
            min_blog_count = BlogCategoryPublicService._parse_int(filters.get('min_blog_count'))
            if depth is not None:
                queryset = queryset.filter(depth=depth)
            if min_blog_count is not None:
                queryset = queryset.filter(blog_count__gte=min_blog_count)
        
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search)
            )
        
        queryset = queryset.order_by(*BlogCategoryPublicService._normalize_ordering(ordering))
        return queryset
    
    @staticmethod
    def get_category_by_slug(slug):
        return BlogCategoryPublicService._base_queryset().filter(
            slug=slug, 
        ).select_related('image').first()

    @staticmethod
    def get_category_by_public_id(public_id):
        return BlogCategoryPublicService._base_queryset().filter(
            public_id=public_id,
        ).select_related('image').first()
    
    @staticmethod
    def get_tree_data():
        queryset = BlogCategoryPublicService._base_queryset().select_related('image').order_by('path')
        return queryset
    
    @staticmethod
    def get_root_categories():
        return BlogCategoryPublicService._base_queryset().filter(
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
        maps = BlogCategoryPublicService._build_category_maps(items)
        serializer = BlogCategoryPublicSerializer(
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
        maps = BlogCategoryPublicService._build_category_maps([item])
        serializer = BlogCategoryPublicSerializer(
            item,
            context={
                'category_parent_map': maps['category_parent_map'],
                'category_children_map': maps['category_children_map'],
            },
        )
        return dict(serializer.data)

    @staticmethod
    def get_category_list_data(filters=None, search=None, ordering=None):
        cache_key = BlogCategoryPublicCacheKeys.list(filters=filters, search=search, ordering=ordering)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        queryset = BlogCategoryPublicService.get_category_queryset(filters=filters, search=search, ordering=ordering)
        data = BlogCategoryPublicService._serialize_categories(queryset)
        cache.set(cache_key, data, BlogCategoryPublicService.LIST_CACHE_TTL)
        return data

    @staticmethod
    def get_tree_data_serialized():
        cache_key = BlogCategoryPublicCacheKeys.tree()
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        queryset = BlogCategoryPublicService.get_tree_data()
        data = BlogCategoryPublicService._serialize_categories(queryset)
        cache.set(cache_key, data, BlogCategoryPublicService.TREE_CACHE_TTL)
        return data

    @staticmethod
    def get_root_categories_serialized():
        cache_key = BlogCategoryPublicCacheKeys.roots()
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        categories = BlogCategoryPublicService.get_root_categories()
        data = BlogCategoryPublicService._serialize_categories(categories)
        cache.set(cache_key, data, BlogCategoryPublicService.ROOTS_CACHE_TTL)
        return data

    @staticmethod
    def get_category_detail_by_slug_data(slug):
        cache_key = BlogCategoryPublicCacheKeys.detail_slug(slug)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        category = BlogCategoryPublicService.get_category_by_slug(slug)
        if not category:
            return None

        data = BlogCategoryPublicService._serialize_category(category)
        cache.set(cache_key, data, BlogCategoryPublicService.DETAIL_CACHE_TTL)
        return data

    @staticmethod
    def get_category_detail_by_public_id_data(public_id):
        cache_key = BlogCategoryPublicCacheKeys.detail_public_id(public_id)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        category = BlogCategoryPublicService.get_category_by_public_id(public_id)
        if not category:
            return None

        data = BlogCategoryPublicService._serialize_category(category)
        cache.set(cache_key, data, BlogCategoryPublicService.DETAIL_CACHE_TTL)
        return data

