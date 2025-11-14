from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter

from src.core.pagination import StandardLimitPagination
from src.blog.messages.messages import BLOG_ERRORS, BLOG_SUCCESS
from src.blog.serializers.public.blog_serializer import (
    BlogPublicListSerializer,
    BlogPublicDetailSerializer
)
from src.blog.services.public.blog_services import BlogPublicService
from src.blog.filters.public.blog_filters import BlogPublicFilter


class BlogPublicViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_class = BlogPublicFilter
    search_fields = ['title', 'short_description', 'description', 'categories__name', 'tags__name']
    ordering_fields = ['title', 'created_at', 'is_featured']
    ordering = ['-is_featured', '-created_at']
    lookup_field = 'slug'
    pagination_class = StandardLimitPagination

    def get_queryset(self):
        """Get base queryset for public blog views"""
        from src.blog.models.blog import Blog
        return Blog.objects.published()
    
    def get_serializer_class(self):
        if self.action == 'list':
            return BlogPublicListSerializer
        return BlogPublicDetailSerializer

    def list(self, request, *args, **kwargs):
        """List blogs with custom pagination"""
        # Get base queryset
        queryset = self.filter_queryset(self.get_queryset())
        
        filters = {
            'category_slug': request.query_params.get('category_slug'),
            'tag_slug': request.query_params.get('tag_slug'),
            'is_featured': self._parse_bool(request.query_params.get('is_featured')),
        }
        filters = {k: v for k, v in filters.items() if v is not None}
        
        search = request.query_params.get('search')
        service_queryset = BlogPublicService.get_blog_queryset(filters=filters, search=search)
        
        # Intersect the service queryset with the DRF filtered queryset
        filtered_ids = list(service_queryset.values_list('id', flat=True))
        queryset = queryset.filter(id__in=filtered_ids)
        
        # Apply DRF pagination
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        """Get blog by slug"""
        slug = kwargs.get('slug')
        blog = BlogPublicService.get_blog_by_slug(slug)
        
        if blog:
            serializer = self.get_serializer(blog)
            return Response(serializer.data)
        
        return Response(
            {"detail": BLOG_ERRORS['blog_not_found']}, 
            status=status.HTTP_404_NOT_FOUND
        )
        
    @action(detail=False, methods=['get'], url_path='p/(?P<public_id>[^/.]+)')
    def get_by_public_id(self, request, public_id=None):
        """Retrieve a blog by its public_id"""
        blog = BlogPublicService.get_blog_by_public_id(public_id)
        if blog:
            serializer = self.get_serializer(blog)
            return Response(serializer.data)
        
        return Response(
            {"detail": BLOG_ERRORS['blog_not_found']}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    @action(detail=False, methods=['get'])
    def featured(self, request):
        """Get featured blogs for homepage"""
        limit = int(request.query_params.get('limit', 6))
        blogs = BlogPublicService.get_featured_blogs(limit=limit)
        serializer = BlogPublicListSerializer(blogs, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def related(self, request, slug=None):
        """Get related blogs"""
        blog = BlogPublicService.get_blog_by_slug(slug)
        if not blog:
            return Response(
                {"detail": BLOG_ERRORS['blog_not_found']}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        limit = int(request.query_params.get('limit', 4))
        related_blogs = BlogPublicService.get_related_blogs(blog, limit=limit)
        serializer = BlogPublicListSerializer(related_blogs, many=True)
        return Response(serializer.data)
    
    @staticmethod
    def _parse_bool(value):
        """Parse boolean from query parameter"""
        if value is None:
            return None
        if isinstance(value, bool):
            return value
        return value.lower() in ('1', 'true', 'yes', 'on')