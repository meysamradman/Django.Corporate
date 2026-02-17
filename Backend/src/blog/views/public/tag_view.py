from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny

from src.core.responses.response import APIResponse
from src.blog.messages.messages import TAG_SUCCESS, TAG_ERRORS
from src.blog.serializers.public.tag_serializer import BlogTagPublicSerializer
from src.blog.services.public.tag_services import BlogTagPublicService
from src.core.pagination import StandardLimitPagination

class BlogTagPublicViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    serializer_class = BlogTagPublicSerializer
    lookup_field = 'slug'
    pagination_class = StandardLimitPagination

    def get_queryset(self):
        return BlogTagPublicService.get_tag_queryset()

    def list(self, request, *args, **kwargs):
        filters = {
            'name': request.query_params.get('name'),
            'min_blog_count': request.query_params.get('min_blog_count'),
        }
        filters = {k: v for k, v in filters.items() if v is not None}
        
        search = request.query_params.get('search')
        ordering = request.query_params.get('ordering')
        data = BlogTagPublicService.get_tag_list_data(filters=filters, search=search, ordering=ordering)
        
        page = self.paginate_queryset(data)
        if page is not None:
            return self.get_paginated_response(page)
        
        return APIResponse.success(
            message=TAG_SUCCESS['tags_list_retrieved'],
            data=data,
            status_code=status.HTTP_200_OK
        )

    def retrieve(self, request, *args, **kwargs):
        tag_data = BlogTagPublicService.get_tag_detail_by_slug_data(kwargs.get("slug"))
        if tag_data:
            return APIResponse.success(
                message=TAG_SUCCESS['tag_retrieved'],
                data=tag_data,
                status_code=status.HTTP_200_OK
            )
        return APIResponse.error(
            message=TAG_ERRORS["tag_not_found"],
            status_code=status.HTTP_404_NOT_FOUND
        )

    @action(detail=False, methods=['get'], url_path='p/(?P<public_id>[^/.]+)')
    def get_by_public_id(self, request, public_id=None):
        tag_data = BlogTagPublicService.get_tag_detail_by_public_id_data(public_id)
        if tag_data:
            return APIResponse.success(
                message=TAG_SUCCESS['tag_retrieved'],
                data=tag_data,
                status_code=status.HTTP_200_OK,
            )

        return APIResponse.error(
            message=TAG_ERRORS['tag_not_found'],
            status_code=status.HTTP_404_NOT_FOUND,
        )

    @action(detail=False, methods=['get'], url_path='id/(?P<tag_id>[^/.]+)')
    def get_by_id(self, request, tag_id=None):
        try:
            parsed_id = int(tag_id)
        except (TypeError, ValueError):
            return APIResponse.error(
                message=TAG_ERRORS['tag_not_found'],
                status_code=status.HTTP_404_NOT_FOUND,
            )

        tag_data = BlogTagPublicService.get_tag_detail_by_id_data(parsed_id)
        if tag_data:
            return APIResponse.success(
                message=TAG_SUCCESS['tag_retrieved'],
                data=tag_data,
                status_code=status.HTTP_200_OK,
            )

        return APIResponse.error(
            message=TAG_ERRORS['tag_not_found'],
            status_code=status.HTTP_404_NOT_FOUND,
        )

    @action(detail=False, methods=['get'])
    def popular(self, request):
        limit = self._parse_positive_int(request.query_params.get('limit'), default=10, max_value=50)
        data = BlogTagPublicService.get_popular_tags_data(limit=limit)
        return APIResponse.success(
            message=TAG_SUCCESS['popular_tags_retrieved'],
            data=data,
            status_code=status.HTTP_200_OK
        )

    @staticmethod
    def _parse_positive_int(value, default, max_value=100):
        try:
            parsed = int(value)
        except (TypeError, ValueError):
            return default

        if parsed < 1:
            return default
        return min(parsed, max_value)