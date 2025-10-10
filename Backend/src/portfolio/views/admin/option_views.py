from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q

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
from src.core.responses import APIResponse
from src.user.authorization.admin_permission import RequireAdminRole


class PortfolioOptionAdminViewSet(viewsets.ModelViewSet):
    """
    Optimized Option ViewSet for Admin Panel with bulk operations and grouping
    """
    permission_classes = [RequireAdminRole('super_admin', 'content_manager')]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = PortfolioOptionAdminFilter
    search_fields = ['key', 'value', 'description']
    ordering_fields = ['created_at', 'updated_at', 'key', 'value']
    ordering = ['-created_at']
    # Service-level/custom pagination is used; DRF pagination disabled
    
    def get_queryset(self):
        """Optimized queryset based on action"""
        if self.action == 'list':
            return PortfolioOption.objects.with_portfolio_counts().order_by('-portfolio_count', 'key', 'value')
        elif self.action in ['retrieve', 'update', 'partial_update']:
            return PortfolioOption.objects.with_portfolio_counts()
        else:
            return PortfolioOption.objects.all()

    def list(self, request, *args, **kwargs):
        """List options with custom pagination (service-level style)"""
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        
        filters = {
            'is_active': self._parse_bool(request.query_params.get('is_active')),
            'key': request.query_params.get('key'),
        }
        filters = {k: v for k, v in filters.items() if v is not None}
        search = request.query_params.get('search')
        
        queryset = PortfolioOptionAdminService.get_option_queryset(filters=filters, search=search)
        from django.core.paginator import Paginator
        paginator = Paginator(queryset, page_size)
        page_obj = paginator.get_page(page)

        serializer = PortfolioOptionAdminListSerializer(page_obj.object_list, many=True)
        data = {
            'items': serializer.data,
            'pagination': {
                'total_count': paginator.count,
                'page_count': paginator.num_pages,
                'current_page': page_obj.number,
                'has_next': page_obj.has_next(),
                'has_previous': page_obj.has_previous(),
                'page_size': page_size,
            }
        }

        return APIResponse.success(
            data=data,
            message="فهرست گزینه‌ها با موفقیت دریافت شد."
        )
    
    @staticmethod
    def _parse_bool(value):
        if value is None:
            return None
        if isinstance(value, bool):
            return value
        return value.lower() in ('1', 'true', 'yes', 'on')
    
    def get_serializer_class(self):
        """Dynamic serializer selection"""
        if self.action == 'list':
            return PortfolioOptionAdminListSerializer
        elif self.action == 'create':
            return PortfolioOptionAdminCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return PortfolioOptionAdminUpdateSerializer
        else:
            return PortfolioOptionAdminDetailSerializer
    
    def create(self, request, *args, **kwargs):
        """Create option with duplicate validation"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Create option using service
        result = PortfolioOptionAdminService.create_option(
            serializer.validated_data,
            created_by=request.user
        )
        
        if result['success']:
            # Return detailed response
            detail_serializer = PortfolioOptionAdminDetailSerializer(result['option'])
            return APIResponse.success(
                data=detail_serializer.data,
                message="گزینه با موفقیت ایجاد شد.",
                status_code=status.HTTP_201_CREATED
            )
        else:
            return APIResponse.error(
                message=result['error'],
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    def retrieve(self, request, *args, **kwargs):
        """Get option detail with usage statistics"""
        option = PortfolioOptionAdminService.get_option_by_id(kwargs.get('pk'))
        
        if not option:
            return APIResponse.error(
                message="گزینه یافت نشد.",
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        serializer = self.get_serializer(option)
        return APIResponse.success(
            data=serializer.data,
            message="گزینه با موفقیت دریافت شد."
        )
    
    def update(self, request, *args, **kwargs):
        """Update option with validation"""
        partial = kwargs.pop('partial', False)
        option = PortfolioOptionAdminService.get_option_by_id(kwargs.get('pk'))
        
        if not option:
            return APIResponse.error(
                message="گزینه یافت نشد.",
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        serializer = self.get_serializer(option, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        # Update option using service
        result = PortfolioOptionAdminService.update_option_by_id(
            option.id, 
            serializer.validated_data
        )
        
        if result['success']:
            # Return detailed response
            detail_serializer = PortfolioOptionAdminDetailSerializer(result['option'])
            return APIResponse.success(
                data=detail_serializer.data,
                message="گزینه با موفقیت به‌روزرسانی شد."
            )
        else:
            return APIResponse.error(
                message=result['error'],
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    def destroy(self, request, *args, **kwargs):
        """Delete option with safety checks"""
        option_id = kwargs.get('pk')
        result = PortfolioOptionAdminService.delete_option_by_id(option_id)
        
        if result['success']:
            return APIResponse.success(
                message="گزینه با موفقیت حذف شد.",
                status_code=status.HTTP_204_NO_CONTENT
            )
        else:
            return APIResponse.error(
                message=result['error'],
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def popular(self, request):
        """Get most popular options"""
        limit = int(request.GET.get('limit', 10))
        options = PortfolioOptionAdminService.get_popular_options(limit)
        
        return APIResponse.success(
            data=options,
            message="گزینه‌های محبوب با موفقیت دریافت شدند."
        )
    
    @action(detail=False, methods=['get'])
    def by_key(self, request):
        """Get options grouped by key"""
        key = request.GET.get('key')
        
        if not key:
            return APIResponse.error(
                message="کلید مورد نیاز است.",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        options = PortfolioOptionAdminService.get_options_by_key(key)
        serializer = PortfolioOptionAdminListSerializer(options, many=True)
        
        return APIResponse.success(
            data=serializer.data,
            message=f"گزینه‌های کلید '{key}' با موفقیت دریافت شدند."
        )
    
    @action(detail=False, methods=['get'])
    def keys(self, request):
        """Get all unique option keys"""
        keys = PortfolioOptionAdminService.get_unique_keys()
        
        return APIResponse.success(
            data=list(keys),
            message="کلیدهای گزینه‌ها با موفقیت دریافت شدند."
        )
    
    @action(detail=False, methods=['post'])
    def bulk_delete(self, request):
        """Bulk delete multiple options"""
        option_ids = request.data.get('option_ids', [])
        
        if not option_ids:
            return APIResponse.error(
                message="شناسه گزینه‌ها مورد نیاز است.",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        result = PortfolioOptionAdminService.bulk_delete_options(option_ids)
        
        if result['success']:
            return APIResponse.success(
                data={'deleted_count': result['deleted_count']},
                message=f"{result['deleted_count']} گزینه با موفقیت حذف شدند."
            )
        else:
            return APIResponse.error(
                message=result['error'],
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def grouped(self, request):
        """Get options grouped by key for admin interface"""
        from django.db.models import Count
        from collections import defaultdict
        
        # Group options by key
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
        
        # Prepare grouped data
        grouped_data = []
        for key, options_list in options_by_key.items():
            grouped_data.append({
                'key': key,
                'options': options_list,
                'total_count': len(options_list)
            })
        
        # Sort by total usage
        grouped_data.sort(key=lambda x: sum(opt['portfolio_count'] for opt in x['options']), reverse=True)
        
        return APIResponse.success(
            data=grouped_data,
            message="گزینه‌های گروه‌بندی شده با موفقیت دریافت شدند."
        )
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get option statistics for admin dashboard"""
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
            data=stats,
            message="آمار گزینه‌ها با موفقیت دریافت شد."
        )