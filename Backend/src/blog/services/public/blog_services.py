from django.db.models import Q, Prefetch
from django.core.cache import cache
from src.blog.models.blog import Blog
from src.blog.models.media import BlogImage
from src.blog.utils.cache import BlogCacheKeys


class BlogPublicService:
    @staticmethod
    def get_blog_queryset(filters=None, search=None):
        cache_key = f"blog_public_list:{filters}:{search}"
        cached_result = cache.get(cache_key)
        if cached_result is not None:
            return cached_result
        
        queryset = Blog.objects.filter(
            is_active=True,
            is_public=True
        ).select_related(
            'created_by'
        ).prefetch_related(
            'categories',
            'tags',
            Prefetch(
                'images',
                queryset=BlogImage.objects.filter(
                    is_main=True
                ).select_related('image')
            )
        )
        
        if filters:
            if filters.get('category_slug'):
                queryset = queryset.filter(categories__slug=filters['category_slug'])
            if filters.get('is_featured') is not None:
                queryset = queryset.filter(is_featured=filters['is_featured'])
            if filters.get('tag_slug'):
                queryset = queryset.filter(tags__slug=filters['tag_slug'])
        
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(short_description__icontains=search) |
                Q(description__icontains=search) |
                Q(categories__name__icontains=search) |
                Q(tags__name__icontains=search)
            ).distinct()
        
        queryset = queryset.order_by('-is_featured', '-created_at')
        cache.set(cache_key, queryset, 300)
        return queryset
    
    @staticmethod
    def get_blog_by_slug(slug):
        cache_key = BlogCacheKeys.blog(f"public_slug_{slug}")
        cached_blog = cache.get(cache_key)
        if cached_blog is not None:
            return cached_blog
        
        blog = Blog.objects.filter(
            slug=slug,
            is_active=True,
            is_public=True
        ).select_related(
            'created_by', 'og_image'
        ).prefetch_related(
            'categories',
            'tags',
            'images__image',
            'videos__video',
            'audios__audio',
            'documents__document'
        ).first()
        
        if blog:
            cache.set(cache_key, blog, 600)
        return blog
    
    @staticmethod
    def get_blog_by_public_id(public_id):
        cache_key = BlogCacheKeys.blog(f"public_id_{public_id}")
        cached_blog = cache.get(cache_key)
        if cached_blog is not None:
            return cached_blog
        
        blog = Blog.objects.filter(
            public_id=public_id,
            is_active=True,
            is_public=True
        ).select_related(
            'created_by', 'og_image'
        ).prefetch_related(
            'categories',
            'tags',
            'images__image',
            'videos__video',
            'audios__audio',
            'documents__document'
        ).first()
        
        if blog:
            cache.set(cache_key, blog, 600)
        return blog
    
    @staticmethod
    def get_featured_blogs(limit=6):
        cache_key = f"blog_public_featured_{limit}"
        cached_result = cache.get(cache_key)
        if cached_result is not None:
            return cached_result
        
        blogs = Blog.objects.filter(
            is_active=True,
            is_public=True,
            is_featured=True
        ).select_related(
            'created_by'
        ).prefetch_related(
            'categories',
            Prefetch(
                'images',
                queryset=BlogImage.objects.filter(
                    is_main=True
                ).select_related('image')
            )
        ).order_by('-created_at')[:limit]
        
        cache.set(cache_key, blogs, 300)
        return blogs
    
    @staticmethod
    def get_related_blogs(blog, limit=4):
        cache_key = f"blog_public_related_{blog.id}_{limit}"
        cached_result = cache.get(cache_key)
        if cached_result is not None:
            return cached_result
        
        category_ids = blog.categories.values_list('id', flat=True)
        blogs = Blog.objects.filter(
            is_active=True,
            is_public=True,
            categories__id__in=category_ids
        ).exclude(
            id=blog.id
        ).select_related(
            'created_by'
        ).prefetch_related(
            'categories',
            Prefetch(
                'images',
                queryset=BlogImage.objects.filter(
                    is_main=True
                ).select_related('image')
            )
        ).distinct().order_by('-created_at')[:limit]
        
        cache.set(cache_key, blogs, 300)
        return blogs