from django.db.models import Count, Q
from src.blog.models.tag import BlogTag
from src.blog.models.blog import Blog


class BlogTagPublicService:
    @staticmethod
    def get_tag_queryset(filters=None, search=None):
        """Get optimized queryset for public tag listing"""
        queryset = BlogTag.objects.filter(
            is_active=True
        ).annotate(
            blog_count=Count('blogs', filter=Q(blogs__is_active=True, blogs__is_public=True))
        ).filter(
            blog_count__gt=0  # Only show tags with active blogs
        )
        
        # Apply filters
        if filters:
            if filters.get('name'):
                queryset = queryset.filter(name__icontains=filters['name'])
            if filters.get('min_blog_count'):
                queryset = queryset.filter(blog_count__gte=filters['min_blog_count'])
        
        # Apply search
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search)
            )
        
        return queryset.order_by('-blog_count', 'name')
    
    @staticmethod
    def get_tag_by_slug(slug):
        """Get tag by slug with blog count"""
        return BlogTag.objects.filter(
            slug=slug, 
            is_active=True
        ).annotate(
            blog_count=Count('blogs', filter=Q(blogs__is_active=True, blogs__is_public=True))
        ).first()
    
    @staticmethod
    def get_popular_tags(limit=10):
        """Get most popular tags"""
        return BlogTag.objects.filter(
            is_active=True
        ).annotate(
            blog_count=Count('blogs', filter=Q(blogs__is_active=True, blogs__is_public=True))
        ).filter(
            blog_count__gt=0
        ).order_by('-blog_count', 'name')[:limit]

