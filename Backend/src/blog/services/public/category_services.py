from django.db.models import Count, Q
from src.blog.models.category import BlogCategory
from src.blog.models.blog import Blog


class BlogCategoryPublicService:
    @staticmethod
    def get_category_queryset(filters=None, search=None):
        """Get optimized queryset for public category listing"""
        queryset = BlogCategory.objects.filter(
            is_active=True
        ).annotate(
            blog_count=Count('blogs', filter=Q(blogs__is_active=True, blogs__is_public=True))
        ).filter(
            blog_count__gt=0  # Only show categories with active blogs
        )
        
        # Apply filters
        if filters:
            if filters.get('name'):
                queryset = queryset.filter(name__icontains=filters['name'])
            if filters.get('parent_slug'):
                queryset = queryset.filter(parent__slug=filters['parent_slug'])
            if filters.get('depth'):
                queryset = queryset.filter(depth=filters['depth'])
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
    def get_category_by_slug(slug):
        """Get category by slug with blog count"""
        return BlogCategory.objects.filter(
            slug=slug, 
            is_active=True
        ).annotate(
            blog_count=Count('blogs', filter=Q(blogs__is_active=True, blogs__is_public=True))
        ).first()
    
    @staticmethod
    def get_tree_data():
        """Get category tree for public use"""
        return BlogCategory.objects.filter(
            is_active=True
        ).annotate(
            blog_count=Count('blogs', filter=Q(blogs__is_active=True, blogs__is_public=True))
        ).filter(
            blog_count__gt=0
        ).order_by('path')
    
    @staticmethod
    def get_root_categories():
        """Get root categories with blog count"""
        return BlogCategory.objects.filter(
            is_active=True,
            depth=1
        ).annotate(
            blog_count=Count('blogs', filter=Q(blogs__is_active=True, blogs__is_public=True))
        ).filter(
            blog_count__gt=0
        ).order_by('sort_order', 'name')

