import hashlib
import json
from datetime import date

from django.db.models import Q
from django.core.cache import cache
from src.blog.models.blog import Blog
from src.blog.utils.cache import BlogCacheKeys

class BlogPublicService:
    ALLOWED_ORDERING_FIELDS = {'created_at', 'title', 'is_featured'}

    @staticmethod
    def _build_cache_key(prefix, payload):
        serialized = json.dumps(payload, sort_keys=True, default=str)
        digest = hashlib.md5(serialized.encode('utf-8')).hexdigest()
        return f"{prefix}:{digest}"

    @staticmethod
    def _normalize_ordering(ordering):
        if not ordering:
            return '-created_at'

        candidate = ordering.split(',')[0].strip()
        descending = candidate.startswith('-')
        field = candidate[1:] if descending else candidate

        if field not in BlogPublicService.ALLOWED_ORDERING_FIELDS:
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
    def get_blog_queryset(filters=None, search=None, ordering=None):
        payload = {
            'filters': filters or {},
            'search': search or '',
            'ordering': BlogPublicService._normalize_ordering(ordering),
        }
        cache_key = BlogPublicService._build_cache_key('blog_public_list', payload)
        cached_result = cache.get(cache_key)
        if cached_result is not None:
            return cached_result
        
        queryset = Blog.objects.active().published().for_public_listing()
        
        if filters:
            if filters.get('category_slug'):
                queryset = queryset.filter(categories__slug=filters['category_slug'])
            if filters.get('is_featured') is not None:
                queryset = queryset.filter(is_featured=filters['is_featured'])
            if filters.get('tag_slug'):
                queryset = queryset.filter(tags__slug=filters['tag_slug'])
            created_after = BlogPublicService._parse_date(filters.get('created_after'))
            created_before = BlogPublicService._parse_date(filters.get('created_before'))
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
        
        queryset = queryset.order_by(BlogPublicService._normalize_ordering(ordering))
        cache.set(cache_key, queryset, 300)
        return queryset
    
    @staticmethod
    def get_blog_by_slug(slug):
        cache_key = BlogCacheKeys.blog(f"public_slug_{slug}")
        cached_blog = cache.get(cache_key)
        if cached_blog is not None:
            return cached_blog
        
        blog = Blog.objects.active().published().filter(
            slug=slug,
        ).for_detail().first()
        
        if blog:
            cache.set(cache_key, blog, 600)
        return blog
    
    @staticmethod
    def get_blog_by_public_id(public_id):
        cache_key = BlogCacheKeys.blog(f"public_id_{public_id}")
        cached_blog = cache.get(cache_key)
        if cached_blog is not None:
            return cached_blog
        
        blog = Blog.objects.active().published().filter(
            public_id=public_id,
        ).for_detail().first()
        
        if blog:
            cache.set(cache_key, blog, 600)
        return blog
    
    @staticmethod
    def get_featured_blogs(limit=6):
        cache_key = f"blog_public_featured_{limit}"
        cached_result = cache.get(cache_key)
        if cached_result is not None:
            return cached_result
        
        blogs = Blog.objects.active().published().filter(
            is_featured=True
        ).for_public_listing().order_by('-created_at')[:limit]
        
        cache.set(cache_key, blogs, 300)
        return blogs
    
    @staticmethod
    def get_related_blogs(blog, limit=4):
        cache_key = f"blog_public_related_{blog.id}_{limit}"
        cached_result = cache.get(cache_key)
        if cached_result is not None:
            return cached_result
        
        category_ids = blog.categories.values_list('id', flat=True)
        blogs = Blog.objects.active().published().filter(
            categories__id__in=category_ids
        ).exclude(
            id=blog.id
        ).for_public_listing().distinct().order_by('-created_at')[:limit]
        
        cache.set(cache_key, blogs, 300)
        return blogs