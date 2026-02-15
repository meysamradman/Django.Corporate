from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError as DRFValidationError
from django_filters.rest_framework import DjangoFilterBackend
from django.core.exceptions import ValidationError

from src.portfolio.models.category import PortfolioCategory
from src.portfolio.serializers.admin.category_serializer import (
    PortfolioCategoryAdminListSerializer,
    PortfolioCategoryAdminDetailSerializer,
    PortfolioCategoryAdminCreateSerializer,
    PortfolioCategoryAdminUpdateSerializer,
    PortfolioCategoryTreeSerializer
)
from src.portfolio.services.admin.category_services import PortfolioCategoryAdminService
from src.portfolio.filters.admin.category_filters import PortfolioCategoryAdminFilter
from src.core.pagination import StandardLimitPagination
from src.user.access_control import portfolio_permission, PermissionRequiredMixin
from src.core.responses.response import APIResponse
from src.core.utils.validation_helpers import extract_validation_message, normalize_validation_error
from src.portfolio.messages.messages import CATEGORY_SUCCESS, CATEGORY_ERRORS

class PortfolioCategoryAdminViewSet(PermissionRequiredMixin, viewsets.ModelViewSet):
    permission_classes = [portfolio_permission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = PortfolioCategoryAdminFilter
    search_fields = ['name', 'description']
    ordering_fields = ['path', 'created_at', 'name']
    ordering = ['-created_at']
    pagination_class = StandardLimitPagination
    
    permission_map = {
        'list': 'portfolio.category.read',
        'retrieve': 'portfolio.category.read',
        'create': 'portfolio.category.create',
        'update': 'portfolio.category.update',
        'partial_update': 'portfolio.category.update',
        'destroy': 'portfolio.category.delete',
        'tree': 'portfolio.category.read',
    }
    permission_denied_message = CATEGORY_ERRORS["category_not_authorized"]
    
    def get_queryset(self):
        if self.action == 'list':
            return PortfolioCategoryAdminService.get_tree_queryset()
        elif self.action in ['retrieve', 'update', 'partial_update']:
            return PortfolioCategoryAdminService.get_tree_queryset()
        else:
            return PortfolioCategory.objects.all()
    
    def get_serializer_class(self):
        if self.action == 'list':
            return PortfolioCategoryAdminListSerializer
        elif self.action == 'create':
            return PortfolioCategoryAdminCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return PortfolioCategoryAdminUpdateSerializer
        elif self.action == 'tree':
            return PortfolioCategoryTreeSerializer
        else:
            return PortfolioCategoryAdminDetailSerializer

    def list(self, request, *args, **kwargs):
        tree_mode = request.GET.get('tree', '').lower() == 'true'
        if tree_mode:
            tree_data = PortfolioCategoryAdminService.get_tree_data()
            return APIResponse.success(
                message=CATEGORY_SUCCESS["category_list_success"],
                data={'data': tree_data},
                status_code=status.HTTP_200_OK
            )

        queryset = self.filter_queryset(PortfolioCategoryAdminService.get_tree_queryset())
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = PortfolioCategoryAdminListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = PortfolioCategoryAdminListSerializer(queryset, many=True)
        return APIResponse.success(
            message=CATEGORY_SUCCESS["category_list_success"],
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

    def create(self, request, *args, **kwargs):
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)

            category = PortfolioCategoryAdminService.create_category(
                serializer.validated_data,
                created_by=request.user
            )

            detail_serializer = PortfolioCategoryAdminDetailSerializer(category)
            return APIResponse.success(
                message=CATEGORY_SUCCESS["category_created"],
                data=detail_serializer.data,
                status_code=status.HTTP_201_CREATED
            )
        except DRFValidationError as e:
            return APIResponse.error(
                message=extract_validation_message(e, CATEGORY_ERRORS["category_create_failed"]),
                errors=normalize_validation_error(e),
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except ValidationError as e:
            return APIResponse.error(
                message=extract_validation_message(e, CATEGORY_ERRORS["category_create_failed"]),
                errors=normalize_validation_error(e),
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    def retrieve(self, request, *args, **kwargs):
        category = PortfolioCategoryAdminService.get_category_by_id(kwargs.get('pk'))
        
        if not category:
            return APIResponse.error(
                message=CATEGORY_ERRORS["category_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )

        serializer = self.get_serializer(category)
        return APIResponse.success(
            message=CATEGORY_SUCCESS["category_retrieved"],
            data=serializer.data,
            status_code=status.HTTP_200_OK
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        category_id = kwargs.get('pk')
        
        try:
            serializer = self.get_serializer(data=request.data, partial=partial)
            serializer.is_valid(raise_exception=True)

            updated_category = PortfolioCategoryAdminService.update_category_by_id(
                category_id, 
                serializer.validated_data
            )
            
            detail_serializer = PortfolioCategoryAdminDetailSerializer(updated_category)
            return APIResponse.success(
                message=CATEGORY_SUCCESS["category_updated"],
                data=detail_serializer.data,
                status_code=status.HTTP_200_OK
            )
        except DRFValidationError as e:
            return APIResponse.error(
                message=extract_validation_message(e, CATEGORY_ERRORS["category_update_failed"]),
                errors=normalize_validation_error(e),
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except ValidationError as e:
            return APIResponse.error(
                message=extract_validation_message(e, CATEGORY_ERRORS["category_update_failed"]),
                errors=normalize_validation_error(e),
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except Exception:
            return APIResponse.error(
                message=CATEGORY_ERRORS["category_update_failed"],
                status_code=status.HTTP_400_BAD_REQUEST
            )

    def destroy(self, request, *args, **kwargs):
        category_id = kwargs.get('pk')
        
        try:
            PortfolioCategoryAdminService.delete_category_by_id(category_id)
            return APIResponse.success(
                message=CATEGORY_SUCCESS["category_deleted"],
                status_code=status.HTTP_200_OK
            )
        except PortfolioCategory.DoesNotExist:
            return APIResponse.error(
                message=CATEGORY_ERRORS["category_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        except ValidationError as e:
            return APIResponse.error(
                message=extract_validation_message(e, CATEGORY_ERRORS["category_delete_failed"]),
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def tree(self, request):
        tree_data = PortfolioCategoryAdminService.get_tree_data()
        
        return APIResponse.success(
            message=CATEGORY_SUCCESS["category_list_success"],
            data=tree_data,
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['get'])
    def roots(self, request):
        root_categories = PortfolioCategoryAdminService.get_root_categories()
        
        return APIResponse.success(
            message=CATEGORY_SUCCESS["category_list_success"],
            data=root_categories,
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['get'])
    def children(self, request, pk=None):
        category = PortfolioCategoryAdminService.get_category_by_id(pk)
        
        if not category:
            return APIResponse.error(
                message=CATEGORY_ERRORS["category_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        children = category.get_children().filter(is_active=True)
        serializer = PortfolioCategoryAdminListSerializer(children, many=True)
        
        return APIResponse.success(
            message=CATEGORY_SUCCESS["category_list_success"],
            data=serializer.data,
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['get'])
    def breadcrumbs(self, request, pk=None):
        category = PortfolioCategoryAdminService.get_category_by_id(pk)
        
        if not category:
            return APIResponse.error(
                message=CATEGORY_ERRORS["category_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        breadcrumbs = PortfolioCategoryAdminService.get_breadcrumbs(category)
        
        return APIResponse.success(
            message=CATEGORY_SUCCESS["category_retrieved"],
            data=breadcrumbs,
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['post'])
    def move(self, request, pk=None):
        target_id = request.data.get('target_id')
        position = request.data.get('position', 'last-child')
        
        if not target_id:
            return APIResponse.error(
                message=CATEGORY_ERRORS["category_ids_required"],
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            PortfolioCategoryAdminService.move_category(pk, target_id, position)
            return APIResponse.success(
                message=CATEGORY_SUCCESS["category_moved"],
                status_code=status.HTTP_200_OK
            )
        except PortfolioCategory.DoesNotExist:
            return APIResponse.error(
                message=CATEGORY_ERRORS["category_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        except ValidationError as e:
            message = extract_validation_message(e, CATEGORY_ERRORS["category_move_failed"].format(error="unknown"))
            return APIResponse.error(
                message=message,
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def popular(self, request):
        limit = int(request.GET.get('limit', 10))
        popular_categories = PortfolioCategoryAdminService.get_popular_categories(limit)
        
        return APIResponse.success(
            message=CATEGORY_SUCCESS["category_list_success"],
            data=popular_categories,
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['post'], url_path='bulk-delete')
    def bulk_delete(self, request):
        category_ids = request.data.get('ids', [])
        
        if not category_ids:
            return APIResponse.error(
                message=CATEGORY_ERRORS["category_ids_required"],
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        if not isinstance(category_ids, list):
            category_ids = [category_ids]
        
        try:
            deleted_count = PortfolioCategoryAdminService.bulk_delete_categories(category_ids)
            return APIResponse.success(
                message=CATEGORY_SUCCESS["category_bulk_deleted"],
                data={'deleted_count': deleted_count},
                status_code=status.HTTP_200_OK
            )
        except ValidationError as e:
            return APIResponse.error(
                message=extract_validation_message(e, CATEGORY_ERRORS["category_delete_failed"]),
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        stats = PortfolioCategoryAdminService.get_category_statistics()
        
        return APIResponse.success(
            message=CATEGORY_SUCCESS["category_statistics_retrieved"],
            data=stats,
            status_code=status.HTTP_200_OK
        )