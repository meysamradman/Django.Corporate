from django_filters import rest_framework as filters
from src.blog.models.tag import BlogTag


class BlogTagPublicFilter(filters.FilterSet):
    name = filters.CharFilter(
        field_name='name',
        lookup_expr='icontains',
        help_text='Filter by tag name'
    )
    
    min_blog_count = filters.NumberFilter(
        field_name='blog_count',
        lookup_expr='gte',
        help_text='Minimum blog count'
    )
    
    class Meta:
        model = BlogTag
        fields = ['name', 'min_blog_count']
