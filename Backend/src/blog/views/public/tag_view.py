from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.filters import SearchFilter
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.response import Response

from src.blog.messages.messages import TAG_SUCCESS, TAG_ERRORS
from src.blog.serializers.public.tag_serializer import BlogTagPublicSerializer
from src.blog.services.public.tag_services import BlogTagPublicService
from src.blog.filters.public.tag_filters import BlogTagPublicFilter
from src.core.pagination import StandardLimitPagination


class BlogTagPublicViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    serializer_class = BlogTagPublicSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_class = BlogTagPublicFilter
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'blog_count']
    ordering = ['-blog_count', 'name']
    lookup_field = 'slug'
    pagination_class = StandardLimitPagination

    def get_queryset(self):
        return BlogTagPublicService.get_tag_queryset()

    def list(self, request, *args, **kwargs):
        """List tags with custom pagination"""
        # Get base queryset
        queryset = self.filter_queryset(self.get_queryset())
        
        filters = {
            'name': request.query_params.get('name'),
            'min_blog_count': request.query_params.get('min_blog_count'),
        }
        filters = {k: v for k, v in filters.items() if v is not None}
        
        search = request.query_params.get('search')
        service_queryset = BlogTagPublicService.get_tag_queryset(filters=filters, search=search)
        
        # Intersect the service queryset with the DRF filtered queryset
        filtered_ids = list(service_queryset.values_list('id', flat=True))
        queryset = queryset.filter(id__in=filtered_ids)
        
        # Apply DRF pagination
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = BlogTagPublicSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = BlogTagPublicSerializer(queryset, many=True)
        return Response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        """Get tag by slug"""
        tag = BlogTagPublicService.get_tag_by_slug(kwargs.get("slug"))
        if tag:
            serializer = self.get_serializer(tag)
            return Response(serializer.data)
        return Response(
            {"detail": TAG_ERRORS["tag_not_found"]}, 
            status=status.HTTP_404_NOT_FOUND
        )

    @action(detail=False, methods=['get'])
    def popular(self, request):
        """Get popular tags"""
        limit = int(request.query_params.get('limit', 10))
        tags = BlogTagPublicService.get_popular_tags(limit=limit)
        serializer = BlogTagPublicSerializer(tags, many=True)
        return Response(serializer.data)