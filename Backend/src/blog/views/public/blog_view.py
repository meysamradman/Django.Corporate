from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny

from src.core.pagination import StandardLimitPagination
from src.core.responses.response import APIResponse
from src.blog.messages.messages import BLOG_ERRORS, BLOG_SUCCESS
from src.blog.serializers.public.blog_serializer import (
    BlogPublicListSerializer,
    BlogPublicDetailSerializer
)
from src.blog.services.public.blog_services import BlogPublicService

class BlogPublicViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    lookup_field = 'slug'
    pagination_class = StandardLimitPagination

    def get_queryset(self):
        return BlogPublicService.get_blog_queryset()
    
    def get_serializer_class(self):
        if self.action == 'list':
            return BlogPublicListSerializer
        return BlogPublicDetailSerializer

    def list(self, request, *args, **kwargs):
        filters = {
            'category_slug': request.query_params.get('category_slug'),
            'tag_slug': request.query_params.get('tag_slug'),
            'is_featured': self._parse_bool(request.query_params.get('is_featured')),
            'created_after': request.query_params.get('created_after'),
            'created_before': request.query_params.get('created_before'),
        }
        filters = {k: v for k, v in filters.items() if v is not None}
        
        search = request.query_params.get('search')
        ordering = request.query_params.get('ordering')
        queryset = BlogPublicService.get_blog_queryset(filters=filters, search=search, ordering=ordering)
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return APIResponse.success(
            message=BLOG_SUCCESS['blog_list_success'],
            data=serializer.data,
            status_code=status.HTTP_200_OK
        )

    def retrieve(self, request, *args, **kwargs):
        slug = kwargs.get('slug')
        blog = BlogPublicService.get_blog_by_slug(slug)
        
        if blog:
            serializer = self.get_serializer(blog)
            return APIResponse.success(
                message=BLOG_SUCCESS['blog_retrieved'],
                data=serializer.data,
                status_code=status.HTTP_200_OK
            )
        
        return APIResponse.error(
            message=BLOG_ERRORS['blog_not_found'],
            status_code=status.HTTP_404_NOT_FOUND
        )
        
    @action(detail=False, methods=['get'], url_path='p/(?P<public_id>[^/.]+)')
    def get_by_public_id(self, request, public_id=None):
        blog = BlogPublicService.get_blog_by_public_id(public_id)
        if blog:
            serializer = self.get_serializer(blog)
            return APIResponse.success(
                message=BLOG_SUCCESS['blog_retrieved'],
                data=serializer.data,
                status_code=status.HTTP_200_OK
            )
        
        return APIResponse.error(
            message=BLOG_ERRORS['blog_not_found'],
            status_code=status.HTTP_404_NOT_FOUND
        )
    
    @action(detail=False, methods=['get'])
    def featured(self, request):
        limit = self._parse_positive_int(request.query_params.get('limit'), default=6, max_value=24)
        blogs = BlogPublicService.get_featured_blogs(limit=limit)
        serializer = BlogPublicListSerializer(blogs, many=True)
        return APIResponse.success(
            message=BLOG_SUCCESS['featured_blogs_retrieved'],
            data=serializer.data,
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['get'])
    def related(self, request, slug=None):
        blog = BlogPublicService.get_blog_by_slug(slug)
        if not blog:
            return APIResponse.error(
                message=BLOG_ERRORS['blog_not_found'],
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        limit = self._parse_positive_int(request.query_params.get('limit'), default=4, max_value=24)
        related_blogs = BlogPublicService.get_related_blogs(blog, limit=limit)
        serializer = BlogPublicListSerializer(related_blogs, many=True)
        return APIResponse.success(
            message=BLOG_SUCCESS['related_blogs_retrieved'],
            data=serializer.data,
            status_code=status.HTTP_200_OK
        )
    
    @staticmethod
    def _parse_bool(value):
        if value is None:
            return None
        if isinstance(value, bool):
            return value
        return value.lower() in ('1', 'true', 'yes', 'on')

    @staticmethod
    def _parse_positive_int(value, default, max_value=100):
        try:
            parsed = int(value)
        except (TypeError, ValueError):
            return default

        if parsed < 1:
            return default
        return min(parsed, max_value)