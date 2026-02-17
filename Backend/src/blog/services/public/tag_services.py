from django.core.cache import cache
from django.db.models import Count, Q
from src.blog.models.tag import BlogTag
from src.blog.serializers.public.tag_serializer import BlogTagPublicSerializer
from src.blog.utils.cache_public import BlogTagPublicCacheKeys
from src.blog.utils import cache_ttl

class BlogTagPublicService:
    ALLOWED_ORDERING_FIELDS = {'name', 'blog_count', 'created_at'}
    LIST_CACHE_TTL = cache_ttl.TAXONOMY_LIST_TTL
    DETAIL_CACHE_TTL = cache_ttl.TAXONOMY_DETAIL_TTL
    POPULAR_CACHE_TTL = cache_ttl.TAXONOMY_POPULAR_TTL

    @staticmethod
    def _normalize_ordering(ordering):
        if not ordering:
            return ('-blog_count', 'name')

        candidate = ordering.split(',')[0].strip()
        descending = candidate.startswith('-')
        field = candidate[1:] if descending else candidate

        if field not in BlogTagPublicService.ALLOWED_ORDERING_FIELDS:
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
        return BlogTag.objects.filter(
            is_active=True,
            is_public=True,
        ).annotate(
            blog_count=Count(
                'blog_tags',
                filter=Q(
                    blog_tags__is_active=True,
                    blog_tags__is_public=True,
                    blog_tags__status='published',
                ),
            )
        ).filter(blog_count__gt=0)

    @staticmethod
    def get_tag_queryset(filters=None, search=None, ordering=None):
        queryset = BlogTagPublicService._base_queryset()
        
        if filters:
            if filters.get('name'):
                queryset = queryset.filter(name__icontains=filters['name'])
            min_blog_count = BlogTagPublicService._parse_int(filters.get('min_blog_count'))
            if min_blog_count is not None:
                queryset = queryset.filter(blog_count__gte=min_blog_count)
        
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search)
            )
        
        queryset = queryset.order_by(*BlogTagPublicService._normalize_ordering(ordering))
        return queryset
    
    @staticmethod
    def get_tag_by_slug(slug):
        return BlogTagPublicService._base_queryset().filter(
            slug=slug, 
        ).first()

    @staticmethod
    def get_tag_by_public_id(public_id):
        return BlogTagPublicService._base_queryset().filter(
            public_id=public_id,
        ).first()
    
    @staticmethod
    def get_popular_tags(limit=10):
        queryset = BlogTagPublicService._base_queryset().order_by('-blog_count', 'name')[:limit]
        return queryset

    @staticmethod
    def get_tag_list_data(filters=None, search=None, ordering=None):
        cache_key = BlogTagPublicCacheKeys.list(filters=filters, search=search, ordering=ordering)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        queryset = BlogTagPublicService.get_tag_queryset(filters=filters, search=search, ordering=ordering)
        data = list(BlogTagPublicSerializer(queryset, many=True).data)
        cache.set(cache_key, data, BlogTagPublicService.LIST_CACHE_TTL)
        return data

    @staticmethod
    def get_tag_detail_by_slug_data(slug):
        cache_key = BlogTagPublicCacheKeys.detail_slug(slug)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        tag = BlogTagPublicService.get_tag_by_slug(slug)
        if not tag:
            return None

        data = dict(BlogTagPublicSerializer(tag).data)
        cache.set(cache_key, data, BlogTagPublicService.DETAIL_CACHE_TTL)
        return data

    @staticmethod
    def get_tag_detail_by_public_id_data(public_id):
        cache_key = BlogTagPublicCacheKeys.detail_public_id(public_id)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        tag = BlogTagPublicService.get_tag_by_public_id(public_id)
        if not tag:
            return None

        data = dict(BlogTagPublicSerializer(tag).data)
        cache.set(cache_key, data, BlogTagPublicService.DETAIL_CACHE_TTL)
        return data

    @staticmethod
    def get_popular_tags_data(limit=10):
        cache_key = BlogTagPublicCacheKeys.popular(limit)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        tags = BlogTagPublicService.get_popular_tags(limit=limit)
        data = list(BlogTagPublicSerializer(tags, many=True).data)
        cache.set(cache_key, data, BlogTagPublicService.POPULAR_CACHE_TTL)
        return data

