from django_filters import rest_framework as filters
from src.blog.models.category import BlogCategory


class BlogCategoryPublicFilter(filters.FilterSet):
    name = filters.CharFilter(
        field_name='name',
        lookup_expr='icontains',
        help_text='Filter by category name'
    )
    
    parent_slug = filters.CharFilter(
        field_name='parent__slug',
        lookup_expr='exact',
        help_text='Filter by parent category slug'
    )
    
    min_blog_count = filters.NumberFilter(
        field_name='blog_count',
        lookup_expr='gte',
        help_text='Minimum blog count'
    )
    
    depth = filters.NumberFilter(
        field_name='depth',
        lookup_expr='exact',
        help_text='Filter by category depth level'
    )
    
    class Meta:
        model = BlogCategory
        fields = ['name', 'parent_slug', 'min_blog_count', 'depth']
