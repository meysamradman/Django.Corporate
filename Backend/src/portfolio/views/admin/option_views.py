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
from src.core.pagination import StandardLimitPagination
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
    pagination_class = StandardLimitPagination  # Add DRF pagination
    
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
        filters = {
            'is_active': self._parse_bool(request.query_params.get('is_active')),
            'key': request.query_params.get('key'),
        }
        filters = {k: v for k, v in filters.items() if v is not None}
        search = request.query_params.get('search')
        
        queryset = PortfolioOptionAdminService.get_option_queryset(filters=filters, search=search)
        
        # Apply DRF pagination
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = PortfolioOptionAdminListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = PortfolioOptionAdminListSerializer(queryset, many=True)
        return Response(serializer.data)
    
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
            return Response(detail_serializer.data, status=status.HTTP_201_CREATED)
        else:
            return Response(
                {"detail": result['error']},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def retrieve(self, request, *args, **kwargs):
        """Get option detail with usage statistics"""
        option = PortfolioOptionAdminService.get_option_by_id(kwargs.get('pk'))
        
        if not option:
            return Response(
                {"detail": "گزینه یافت نشد."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = self.get_serializer(option)
        return Response(serializer.data)
    
    def update(self, request, *args, **kwargs):
        """Update option with validation"""
        partial = kwargs.pop('partial', False)
        option = PortfolioOptionAdminService.get_option_by_id(kwargs.get('pk'))
        
        if not option:
            return Response(
                {"detail": "گزینه یافت نشد."},
                status=status.HTTP_404_NOT_FOUND
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
            return Response(detail_serializer.data)
        else:
            return Response(
                {"detail": result['error']},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def destroy(self, request, *args, **kwargs):
        """Delete option with safety checks"""
        option_id = kwargs.get('pk')
        result = PortfolioOptionAdminService.delete_option_by_id(option_id)
        
        if result['success']:
            return Response(status=status.HTTP_204_NO_CONTENT)
        else:
            return Response(
                {"detail": result['error']},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def popular(self, request):
        """Get most popular options"""
        limit = int(request.GET.get('limit', 10))
        options = PortfolioOptionAdminService.get_popular_options(limit)
        
        return Response(options)
    
    @action(detail=False, methods=['get'])
    def by_key(self, request):
        """Get options grouped by key"""
        key = request.GET.get('key')
        
        if not key:
            return Response(
                {"detail": "کلید مورد نیاز است."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        options = PortfolioOptionAdminService.get_options_by_key(key)
        serializer = PortfolioOptionAdminListSerializer(options, many=True)
        
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def keys(self, request):
        """Get all unique option keys"""
        keys = PortfolioOptionAdminService.get_unique_keys()
        
        return Response(list(keys))
    
    @action(detail=False, methods=['post'])
    def bulk_delete(self, request):
        """Bulk delete multiple options"""
        option_ids = request.data.get('option_ids', [])
        
        if not option_ids:
            return Response(
                {"detail": "شناسه گزینه‌ها مورد نیاز است."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        result = PortfolioOptionAdminService.bulk_delete_options(option_ids)
        
        if result['success']:
            return Response({'deleted_count': result['deleted_count']})
        else:
            return Response(
                {"detail": result['error']},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def grouped(self, request):
        """Get options grouped by key for admin interface"""
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
        
        return Response(grouped_data)
    
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
        
        return Response(stats)