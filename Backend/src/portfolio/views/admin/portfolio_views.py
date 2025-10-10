from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.shortcuts import get_object_or_404

from src.portfolio.models.portfolio import Portfolio
from src.portfolio.serializers.admin import (
    PortfolioAdminListSerializer,
    PortfolioAdminDetailSerializer,
    PortfolioAdminCreateSerializer,
    PortfolioAdminUpdateSerializer
)
from src.portfolio.services.admin.portfolio_services import (
    PortfolioAdminService,
    PortfolioAdminStatusService,
    PortfolioAdminSEOService
)
from src.portfolio.filters.admin.portfolio_filters import PortfolioAdminFilter
from src.core.responses import APIResponse
from src.core.pagination import StandardLimitPagination
from src.user.authorization.admin_permission import RequireAdminRole


class PortfolioAdminViewSet(viewsets.ModelViewSet):
    """
    Optimized Portfolio ViewSet for Admin Panel with SEO support
    """
    permission_classes = [RequireAdminRole('super_admin', 'content_manager')]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = PortfolioAdminFilter
    search_fields = ['title', 'short_description', 'meta_title', 'meta_description']
    ordering_fields = ['created_at', 'updated_at', 'title', 'status']
    ordering = ['-created_at']
    # Service-level pagination is used; no DRF pagination here
    
    def get_queryset(self):
        """Optimized queryset based on action"""
        if self.action == 'list':
            return Portfolio.objects.for_admin_listing()
        elif self.action in ['retrieve', 'update', 'partial_update']:
            return Portfolio.objects.for_detail()
        else:
            return Portfolio.objects.all()

    def list(self, request, *args, **kwargs):
        """List portfolios using service-level pagination and filtering"""
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))

        filters = {
            'status': request.query_params.get('status'),
            'is_featured': self._parse_bool(request.query_params.get('is_featured')),
            'is_public': self._parse_bool(request.query_params.get('is_public')),
            'category_id': request.query_params.get('category_id'),
            'seo_status': request.query_params.get('seo_status'),
        }
        # حذف کلیدهای None برای فیلتر تمیز
        filters = {k: v for k, v in filters.items() if v is not None}

        search = request.query_params.get('search')

        queryset = PortfolioAdminService.get_portfolio_queryset(
            filters=filters,
            search=search,
        )

        from django.core.paginator import Paginator
        paginator = Paginator(queryset, page_size)
        page_obj = paginator.get_page(page)

        serializer = PortfolioAdminListSerializer(page_obj.object_list, many=True)
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
            message="Portfolio list retrieved successfully."
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
            return PortfolioAdminListSerializer
        elif self.action == 'create':
            return PortfolioAdminCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return PortfolioAdminUpdateSerializer
        else:
            return PortfolioAdminDetailSerializer
    
    def create(self, request, *args, **kwargs):
        """Create portfolio with SEO auto-generation"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Create portfolio using service
        portfolio = PortfolioAdminService.create_portfolio(
            serializer.validated_data,
            created_by=request.user
        )
        
        # Return detailed response
        detail_serializer = PortfolioAdminDetailSerializer(portfolio)
        return APIResponse.success(
            data=detail_serializer.data,
            message="Portfolio created successfully.",
            status_code=status.HTTP_201_CREATED
        )
    
    def update(self, request, *args, **kwargs):
        """Update portfolio with SEO handling"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        # Update using service
        updated_portfolio = PortfolioAdminService.update_portfolio(
            instance.id,
            serializer.validated_data
        )
        
        # Return detailed response
        detail_serializer = PortfolioAdminDetailSerializer(updated_portfolio)
        return APIResponse.success(
            data=detail_serializer.data,
            message="Portfolio updated successfully."
        )
    
    def destroy(self, request, *args, **kwargs):
        """Delete portfolio with media cleanup"""
        instance = self.get_object()
        
        # Delete using service (handles media cleanup)
        success = PortfolioAdminService.delete_portfolio(instance.id)
        
        if success:
            return APIResponse.success(
                message="Portfolio deleted successfully.",
                status_code=status.HTTP_204_NO_CONTENT
            )
        else:
            return APIResponse.error(
                message="Failed to delete portfolio.",
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def change_status(self, request, pk=None):
        """Change portfolio status"""
        new_status = request.data.get('status')
        
        if not new_status:
            return APIResponse.error(
                message="Status is required.",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        portfolio = PortfolioAdminStatusService.change_status(pk, new_status)
        
        if portfolio:
            serializer = PortfolioAdminDetailSerializer(portfolio)
            return APIResponse.success(
                data=serializer.data,
                message=f"Portfolio status changed to {new_status}."
            )
        else:
            return APIResponse.error(
                message="Invalid status or portfolio not found.",
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        """Publish portfolio with SEO validation"""
        result = PortfolioAdminStatusService.publish_portfolio(pk)
        
        serializer = PortfolioAdminDetailSerializer(result['portfolio'])
        
        response_data = {
            'portfolio': serializer.data,
            'seo_warnings': result['seo_warnings']
        }
        
        message = "Portfolio published successfully."
        if result['seo_warnings']:
            message += f" SEO warnings: {', '.join(result['seo_warnings'])}"
        
        return APIResponse.success(
            data=response_data,
            message=message
        )
    
    @action(detail=False, methods=['post'])
    def bulk_update_status(self, request):
        """Bulk status update for multiple portfolios"""
        portfolio_ids = request.data.get('portfolio_ids', [])
        new_status = request.data.get('status')
        
        if not portfolio_ids or not new_status:
            return APIResponse.error(
                message="portfolio_ids and status are required.",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        success = PortfolioAdminService.bulk_update_status(portfolio_ids, new_status)
        
        if success:
            return APIResponse.success(
                message=f"Updated {len(portfolio_ids)} portfolios to {new_status}."
            )
        else:
            return APIResponse.error(
                message="Invalid status.",
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['post'])
    def bulk_generate_seo(self, request):
        """Bulk SEO generation for multiple portfolios"""
        portfolio_ids = request.data.get('portfolio_ids', [])
        
        if not portfolio_ids:
            return APIResponse.error(
                message="portfolio_ids are required.",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        updated_count = 0
        for portfolio_id in portfolio_ids:
            try:
                PortfolioAdminSEOService.auto_generate_seo(portfolio_id)
                updated_count += 1
            except Exception:
                continue
        
        return APIResponse.success(
            message=f"Generated SEO for {updated_count} portfolios."
        )
    
    @action(detail=True, methods=['post'])
    def generate_seo(self, request, pk=None):
        """Auto-generate SEO data for single portfolio"""
        portfolio = PortfolioAdminSEOService.auto_generate_seo(pk)
        
        serializer = PortfolioAdminDetailSerializer(portfolio)
        return APIResponse.success(
            data=serializer.data,
            message="SEO data generated successfully."
        )
    
    @action(detail=True, methods=['get'])
    def validate_seo(self, request, pk=None):
        """Validate SEO data and get suggestions"""
        validation_result = PortfolioAdminSEOService.validate_seo_data(pk)
        
        return APIResponse.success(
            data=validation_result,
            message="SEO validation completed."
        )
    
    @action(detail=True, methods=['post'])
    def add_media(self, request, pk=None):
        """Add media files to portfolio"""
        portfolio = self.get_object()
        media_files = request.FILES.getlist('media_files')
        
        if not media_files:
            return APIResponse.error(
                message="No media files provided.",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        # Add media using service
        created_medias = PortfolioAdminService.add_media_to_portfolio(
            portfolio.id,
            media_files,
            created_by=request.user
        )
        
        return APIResponse.success(
            data={'created_count': len(created_medias)},
            message=f"Added {len(created_medias)} media files to portfolio."
        )
    
    @action(detail=True, methods=['post'])
    def set_main_image(self, request, pk=None):
        """Set main image for portfolio"""
        media_id = request.data.get('media_id')
        
        if not media_id:
            return APIResponse.error(
                message="media_id is required.",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            portfolio_media = PortfolioAdminService.set_main_image(pk, media_id)
            return APIResponse.success(
                message="Main image set successfully."
            )
        except Exception as e:
            return APIResponse.error(
                message=str(e),
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def seo_report(self, request):
        """Get comprehensive SEO report"""
        report = PortfolioAdminService.get_seo_report()
        
        return APIResponse.success(
            data=report,
            message="SEO report generated successfully."
        )
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get portfolio statistics for dashboard"""
        from django.db.models import Count
        
        stats = {
            'total': Portfolio.objects.count(),
            'published': Portfolio.objects.filter(status='published').count(),
            'draft': Portfolio.objects.filter(status='draft').count(),
            'featured': Portfolio.objects.filter(is_featured=True).count(),
            'with_complete_seo': Portfolio.objects.complete_seo().count(),
            'with_partial_seo': Portfolio.objects.incomplete_seo().count(),
            'without_seo': Portfolio.objects.missing_seo().count(),
        }
        
        # Recent portfolios
        recent_portfolios = Portfolio.objects.for_admin_listing()[:5]
        recent_serializer = PortfolioAdminListSerializer(recent_portfolios, many=True)
        
        stats['recent_portfolios'] = recent_serializer.data
        
        return APIResponse.success(
            data=stats,
            message="Portfolio statistics retrieved successfully."
        )
