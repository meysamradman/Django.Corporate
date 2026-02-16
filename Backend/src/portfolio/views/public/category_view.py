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

    @staticmethod
    def _build_category_maps(items):
        category_list = list(items)
        if not category_list:
            return {'category_parent_map': {}, 'category_children_map': {}}

        by_path = {getattr(item, 'path', None): item for item in category_list}
        parent_map = {}
        children_map = {item.id: [] for item in category_list}

        for item in category_list:
            path = getattr(item, 'path', '')
            depth = getattr(item, 'depth', 0)
            steplen = getattr(item, 'steplen', 4)

            if depth > 1 and path:
                parent_path = path[:-steplen]
                parent = by_path.get(parent_path)
                if parent:
                    parent_map[item.id] = {
                        'public_id': parent.public_id,
                        'name': parent.name,
                        'slug': parent.slug,
                    }
                    children_map[parent.id].append({
                        'public_id': item.public_id,
                        'name': item.name,
                        'slug': item.slug,
                    })

        return {
            'category_parent_map': parent_map,
            'category_children_map': children_map,
        }

    def _serializer_context_with_maps(self, request, items):
        context = self.get_serializer_context()
        context.update(self._build_category_maps(items))
        context['request'] = request
        return context

    def list(self, request, *args, **kwargs):
        tree_mode = request.GET.get('tree', '').lower() == 'true'
        if tree_mode:
            tree_data = PortfolioCategoryPublicService.get_tree_data()
            serializer = PortfolioCategoryPublicSerializer(
                tree_data,
                many=True,
                context=self._serializer_context_with_maps(request, tree_data),
            )
            return APIResponse.success(
                message=CATEGORY_SUCCESS['categories_tree_retrieved'],
                data={'items': serializer.data},
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
        queryset = PortfolioCategoryPublicService.get_category_queryset(filters=filters, search=search, ordering=ordering)
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = PortfolioCategoryPublicSerializer(
                page,
                many=True,
                context=self._serializer_context_with_maps(request, page),
            )
            return self.get_paginated_response(serializer.data)
        
        serializer = PortfolioCategoryPublicSerializer(
            queryset,
            many=True,
            context=self._serializer_context_with_maps(request, queryset),
        )
        return APIResponse.success(
            message=CATEGORY_SUCCESS['categories_list_retrieved'],
            data=serializer.data,
            status_code=status.HTTP_200_OK
        )

    def retrieve(self, request, *args, **kwargs):
        category = PortfolioCategoryPublicService.get_category_by_slug(kwargs.get('slug'))
        if category:
            serializer = self.get_serializer(
                category,
                context=self._serializer_context_with_maps(request, [category]),
            )
            return APIResponse.success(
                message=CATEGORY_SUCCESS['category_retrieved'],
                data=serializer.data,
                status_code=status.HTTP_200_OK
            )
        return APIResponse.error(
            message=CATEGORY_ERRORS['category_not_found'],
            status_code=status.HTTP_404_NOT_FOUND
        )

    @action(detail=False, methods=['get'], url_path='p/(?P<public_id>[^/.]+)')
    def get_by_public_id(self, request, public_id=None):
        category = PortfolioCategoryPublicService.get_category_by_public_id(public_id)
        if category:
            serializer = self.get_serializer(
                category,
                context=self._serializer_context_with_maps(request, [category]),
            )
            return APIResponse.success(
                message=CATEGORY_SUCCESS['category_retrieved'],
                data=serializer.data,
                status_code=status.HTTP_200_OK,
            )

        return APIResponse.error(
            message=CATEGORY_ERRORS['category_not_found'],
            status_code=status.HTTP_404_NOT_FOUND,
        )

    @action(detail=False, methods=['get'])
    def roots(self, request):
        categories = PortfolioCategoryPublicService.get_root_categories()
        serializer = PortfolioCategoryPublicSerializer(
            categories,
            many=True,
            context=self._serializer_context_with_maps(request, categories),
        )
        return APIResponse.success(
            message=CATEGORY_SUCCESS['root_categories_retrieved'],
            data=serializer.data,
            status_code=status.HTTP_200_OK
        )