import re
from collections import defaultdict
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from django.core.exceptions import ValidationError

from src.portfolio.models.option import PortfolioOption
from src.portfolio.serializers.admin.option_serializer import (
    PortfolioOptionAdminListSerializer,
    PortfolioOptionAdminDetailSerializer,
    PortfolioOptionAdminCreateSerializer,
    PortfolioOptionAdminUpdateSerializer,
    PortfolioOptionGroupedAdminSerializer
)
from src.portfolio.services.admin.option_services import PortfolioOptionAdminService
from src.portfolio.filters.admin.option_filters import PortfolioOptionAdminFilter
from src.core.pagination import StandardLimitPagination
from src.user.access_control import portfolio_permission, PermissionValidator
from src.core.responses.response import APIResponse
from src.portfolio.messages.messages import OPTION_SUCCESS, OPTION_ERRORS


class PortfolioOptionAdminViewSet(viewsets.ModelViewSet):
    # ✅ استفاده از permission instance - بدون lambda
    permission_classes = [portfolio_permission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = PortfolioOptionAdminFilter
    search_fields = ['name', 'slug', 'description']
    ordering_fields = ['created_at', 'updated_at', 'name']
    ordering = ['-created_at']
    pagination_class = StandardLimitPagination
    
    def get_queryset(self):
        if self.action == 'list':
            return PortfolioOption.objects.with_portfolio_counts().order_by('-portfolio_count', 'name')
        elif self.action in ['retrieve', 'update', 'partial_update']:
            return PortfolioOption.objects.with_portfolio_counts()
        else:
            return PortfolioOption.objects.all()

    def list(self, request, *args, **kwargs):
        if not PermissionValidator.has_permission(request.user, 'portfolio.option.read'):
            return APIResponse.error(
                message=OPTION_ERRORS["option_not_authorized"],
                status_code=status.HTTP_403_FORBIDDEN
            )
        filters = {
            'is_active': self._parse_bool(request.query_params.get('is_active')),
            'name': request.query_params.get('name'),
        }
        filters = {k: v for k, v in filters.items() if v is not None}
        search = request.query_params.get('search')
        
        queryset = PortfolioOptionAdminService.get_option_queryset(filters=filters, search=search)
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = PortfolioOptionAdminListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = PortfolioOptionAdminListSerializer(queryset, many=True)
        return APIResponse.success(
            message=OPTION_SUCCESS["option_list_success"],
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
    
    def get_serializer_class(self):
        if self.action == 'list':
            return PortfolioOptionAdminListSerializer
        elif self.action == 'create':
            return PortfolioOptionAdminCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return PortfolioOptionAdminUpdateSerializer
        else:
            return PortfolioOptionAdminDetailSerializer
    
    def create(self, request, *args, **kwargs):
        if not PermissionValidator.has_permission(request.user, 'portfolio.option.create'):
            return APIResponse.error(
                message=OPTION_ERRORS["option_not_authorized"],
                status_code=status.HTTP_403_FORBIDDEN
            )
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            option = PortfolioOptionAdminService.create_option(
                serializer.validated_data,
                created_by=request.user
            )
            
            detail_serializer = PortfolioOptionAdminDetailSerializer(option)
            return APIResponse.success(
                message=OPTION_SUCCESS["option_created"],
                data=detail_serializer.data,
                status_code=status.HTTP_201_CREATED
            )
        except ValidationError as e:
            error_msg = str(e)
            if "already exists" in error_msg.lower():
                name = error_msg.split("'")[1] if "'" in error_msg else ""
                message = OPTION_ERRORS["option_name_exists"].format(name=name)
            else:
                message = OPTION_ERRORS["option_create_failed"]
            return APIResponse.error(
                message=message,
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    def retrieve(self, request, *args, **kwargs):
        if not PermissionValidator.has_permission(request.user, 'portfolio.option.read'):
            return APIResponse.error(
                message=OPTION_ERRORS["option_not_authorized"],
                status_code=status.HTTP_403_FORBIDDEN
            )
        option = PortfolioOptionAdminService.get_option_by_id(kwargs.get('pk'))
        
        if not option:
            return APIResponse.error(
                message=OPTION_ERRORS["option_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        serializer = self.get_serializer(option)
        return APIResponse.success(
            message=OPTION_SUCCESS["option_retrieved"],
            data=serializer.data,
            status_code=status.HTTP_200_OK
        )
    
    def update(self, request, *args, **kwargs):
        if not PermissionValidator.has_permission(request.user, 'portfolio.option.update'):
            return APIResponse.error(
                message=OPTION_ERRORS.get("option_not_authorized", "You don't have permission to update portfolio options"),
                status_code=status.HTTP_403_FORBIDDEN
            )
        partial = kwargs.pop('partial', False)
        option = PortfolioOptionAdminService.get_option_by_id(kwargs.get('pk'))
        
        if not option:
            return APIResponse.error(
                message=OPTION_ERRORS["option_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        serializer = self.get_serializer(option, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        try:
            updated_option = PortfolioOptionAdminService.update_option_by_id(
                option.id, 
                serializer.validated_data
            )
            
            detail_serializer = PortfolioOptionAdminDetailSerializer(updated_option)
            return APIResponse.success(
                message=OPTION_SUCCESS["option_updated"],
                data=detail_serializer.data,
                status_code=status.HTTP_200_OK
            )
        except ValidationError as e:
            error_msg = str(e)
            if "already exists" in error_msg.lower():
                name = error_msg.split("'")[1] if "'" in error_msg else ""
                message = OPTION_ERRORS["option_name_exists"].format(name=name)
            else:
                message = OPTION_ERRORS["option_update_failed"]
            return APIResponse.error(
                message=message,
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    def destroy(self, request, *args, **kwargs):
        if not PermissionValidator.has_permission(request.user, 'portfolio.option.delete'):
            return APIResponse.error(
                message=OPTION_ERRORS.get("option_not_authorized", "You don't have permission to delete portfolio options"),
                status_code=status.HTTP_403_FORBIDDEN
            )
        option_id = kwargs.get('pk')
        
        try:
            PortfolioOptionAdminService.delete_option_by_id(option_id)
            return APIResponse.success(
                message=OPTION_SUCCESS["option_deleted"],
                status_code=status.HTTP_200_OK
            )
        except PortfolioOption.DoesNotExist:
            return APIResponse.error(
                message=OPTION_ERRORS["option_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        except ValidationError as e:
            error_msg = str(e)
            if "portfolios" in error_msg:
                count_match = re.search(r'\d+', error_msg)
                count = count_match.group() if count_match else "0"
                message = OPTION_ERRORS["option_has_portfolios"].format(count=count)
            else:
                message = OPTION_ERRORS["option_delete_failed"]
            return APIResponse.error(
                message=message,
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def popular(self, request):
        limit = int(request.GET.get('limit', 10))
        options = PortfolioOptionAdminService.get_popular_options(limit)
        
        return APIResponse.success(
            message=OPTION_SUCCESS["option_list_success"],
            data=options,
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['get'])
    def by_key(self, request):
        key = request.GET.get('key')
        
        if not key:
            return APIResponse.error(
                message=OPTION_ERRORS["option_key_required"],
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        options = PortfolioOptionAdminService.get_options_by_key(key)
        serializer = PortfolioOptionAdminListSerializer(options, many=True)
        
        return APIResponse.success(
            message=OPTION_SUCCESS["option_list_success"],
            data=serializer.data,
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['get'])
    def keys(self, request):
        keys = PortfolioOptionAdminService.get_unique_keys()
        
        return APIResponse.success(
            message=OPTION_SUCCESS["option_list_success"],
            data=list(keys),
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['post'], url_path='bulk-delete')
    def bulk_delete(self, request):
        option_ids = request.data.get('ids', [])
        
        if not option_ids:
            return APIResponse.error(
                message=OPTION_ERRORS["option_ids_required"],
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        if not isinstance(option_ids, list):
            option_ids = [option_ids]
        
        try:
            deleted_count = PortfolioOptionAdminService.bulk_delete_options(option_ids)
            return APIResponse.success(
                message=OPTION_SUCCESS["option_bulk_deleted"],
                data={'deleted_count': deleted_count},
                status_code=status.HTTP_200_OK
            )
        except ValidationError as e:
            error_msg = str(e)
            if "not found" in error_msg.lower():
                message = OPTION_ERRORS["options_not_found"]
            elif "in use" in error_msg.lower():
                names = error_msg.split(":")[-1].strip() if ":" in error_msg else ""
                message = OPTION_ERRORS["options_in_use"].format(names=names)
            else:
                message = OPTION_ERRORS["option_delete_failed"]
            return APIResponse.error(
                message=message,
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def grouped(self, request):
        options_by_key = defaultdict(list)
        options = PortfolioOption.objects.with_portfolio_counts().order_by('key', 'value')
        
        for option in options:
            options_by_key[option.key].append({
                'id': option.id,
                'public_id': option.public_id,
                'value': option.value,
                'portfolio_count': getattr(option, 'portfolio_count', 0),
                'is_active': option.is_active
            })
        
        grouped_data = []
        for key, options_list in options_by_key.items():
            grouped_data.append({
                'key': key,
                'options': options_list,
                'total_count': len(options_list)
            })
        
        grouped_data.sort(key=lambda x: sum(opt['portfolio_count'] for opt in x['options']), reverse=True)
        
        return APIResponse.success(
            message=OPTION_SUCCESS["option_list_success"],
            data=grouped_data,
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        total_options = PortfolioOption.objects.count()
        active_options = PortfolioOption.objects.filter(is_active=True).count()
        used_options = PortfolioOption.objects.filter(portfolio_options__isnull=False).distinct().count()
        unused_options = total_options - used_options
        unique_keys = PortfolioOptionAdminService.get_unique_keys().count()
        
        stats = {
            'total_options': total_options,
            'active_options': active_options,
            'used_options': used_options,
            'unused_options': unused_options,
            'unique_keys': unique_keys,
            'popular_options': PortfolioOptionAdminService.get_popular_options(5)
        }
        
        return APIResponse.success(
            message=OPTION_SUCCESS["option_statistics_retrieved"],
            data=stats,
            status_code=status.HTTP_200_OK
        )