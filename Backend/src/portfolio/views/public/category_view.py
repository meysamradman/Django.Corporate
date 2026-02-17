from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny

from src.core.responses.response import APIResponse
from src.portfolio.messages.messages import CATEGORY_ERRORS, CATEGORY_SUCCESS
from src.portfolio.serializers.public.category_serializer import PortfolioCategoryPublicSerializer
from src.portfolio.services.public.category_services import PortfolioCategoryPublicService
from src.core.pagination import StandardLimitPagination

class PortfolioCategoryPublicViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    serializer_class = PortfolioCategoryPublicSerializer
    lookup_field = 'slug'
    pagination_class = StandardLimitPagination

    def get_queryset(self):
        return PortfolioCategoryPublicService.get_category_queryset()

    def list(self, request, *args, **kwargs):
        tree_mode = request.GET.get('tree', '').lower() == 'true'
        if tree_mode:
            data = PortfolioCategoryPublicService.get_tree_data_serialized()
            return APIResponse.success(
                message=CATEGORY_SUCCESS['categories_tree_retrieved'],
                data={'items': data},
                status_code=status.HTTP_200_OK
            )
        
        filters = {
            'name': request.query_params.get('name'),
            'parent_slug': request.query_params.get('parent_slug'),
            'depth': request.query_params.get('depth'),
            'min_portfolio_count': request.query_params.get('min_portfolio_count'),
        }
        filters = {k: v for k, v in filters.items() if v is not None}
        
        search = request.query_params.get('search')
        ordering = request.query_params.get('ordering')
        data = PortfolioCategoryPublicService.get_category_list_data(filters=filters, search=search, ordering=ordering)
        
        page = self.paginate_queryset(data)
        if page is not None:
            return self.get_paginated_response(page)
        
        return APIResponse.success(
            message=CATEGORY_SUCCESS['categories_list_retrieved'],
            data=data,
            status_code=status.HTTP_200_OK
        )

    def retrieve(self, request, *args, **kwargs):
        category_data = PortfolioCategoryPublicService.get_category_detail_by_slug_data(kwargs.get('slug'))
        if category_data:
            return APIResponse.success(
                message=CATEGORY_SUCCESS['category_retrieved'],
                data=category_data,
                status_code=status.HTTP_200_OK
            )
        return APIResponse.error(
            message=CATEGORY_ERRORS['category_not_found'],
            status_code=status.HTTP_404_NOT_FOUND
        )

    @action(detail=False, methods=['get'], url_path='p/(?P<public_id>[^/.]+)')
    def get_by_public_id(self, request, public_id=None):
        category_data = PortfolioCategoryPublicService.get_category_detail_by_public_id_data(public_id)
        if category_data:
            return APIResponse.success(
                message=CATEGORY_SUCCESS['category_retrieved'],
                data=category_data,
                status_code=status.HTTP_200_OK,
            )

        return APIResponse.error(
            message=CATEGORY_ERRORS['category_not_found'],
            status_code=status.HTTP_404_NOT_FOUND,
        )

    @action(detail=False, methods=['get'])
    def roots(self, request):
        data = PortfolioCategoryPublicService.get_root_categories_serialized()
        return APIResponse.success(
            message=CATEGORY_SUCCESS['root_categories_retrieved'],
            data=data,
            status_code=status.HTTP_200_OK
        )