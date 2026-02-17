from datetime import date

from django.db.models import Q
from src.blog.models.blog import Blog

class BlogPublicService:
    ALLOWED_ORDERING_FIELDS = {'created_at', 'title', 'is_featured'}

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
        return queryset
    
    @staticmethod
    def get_blog_by_slug(slug):
        blog = Blog.objects.active().published().filter(
            slug=slug,
        ).for_detail().first()
        return blog
    
    @staticmethod
    def get_blog_by_public_id(public_id):
        blog = Blog.objects.active().published().filter(
            public_id=public_id,
        ).for_detail().first()
        return blog
    
    @staticmethod
    def get_featured_blogs(limit=6):
        blogs = Blog.objects.active().published().filter(
            is_featured=True
        ).for_public_listing().order_by('-created_at')[:limit]
        return blogs
    
    @staticmethod
    def get_related_blogs(blog, limit=4):
        category_ids = blog.categories.values_list('id', flat=True)
        blogs = Blog.objects.active().published().filter(
            categories__id__in=category_ids
        ).exclude(
            id=blog.id
        ).for_public_listing().distinct().order_by('-created_at')[:limit]
        return blogs