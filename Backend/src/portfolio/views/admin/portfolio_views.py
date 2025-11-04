from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from src.core.responses.response import APIResponse
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count
from django.shortcuts import get_object_or_404
from django.core.cache import cache
from django.utils import timezone

from src.portfolio.models.portfolio import Portfolio
from src.portfolio.models.category import PortfolioCategory
from src.portfolio.models.tag import PortfolioTag
from src.portfolio.serializers.admin import (
    PortfolioAdminListSerializer,
    PortfolioAdminDetailSerializer,
    PortfolioAdminCreateSerializer,
    PortfolioAdminUpdateSerializer,
    PortfolioMediaSerializer
)
from src.portfolio.services.admin import (
    PortfolioAdminMediaService,
    PortfolioAdminService,
    PortfolioAdminStatusService,
    PortfolioAdminSEOService,
    PortfolioExcelExportService,
    PortfolioPDFExportService,
)
from src.portfolio.filters.admin.portfolio_filters import PortfolioAdminFilter
from src.core.pagination import StandardLimitPagination
from src.user.authorization.admin_permission import ContentManagerAccess
from src.portfolio.messages.messages import PORTFOLIO_SUCCESS, PORTFOLIO_ERRORS


class PortfolioAdminViewSet(viewsets.ModelViewSet):
    """
    Optimized Portfolio ViewSet for Admin Panel with SEO support
    """
    permission_classes = [ContentManagerAccess]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = PortfolioAdminFilter
    search_fields = ['title', 'short_description', 'meta_title', 'meta_description']
    ordering_fields = ['created_at', 'updated_at', 'title', 'status']
    ordering = ['-created_at']
    pagination_class = StandardLimitPagination  # Add DRF pagination
    
    def get_queryset(self):
        """Optimized queryset based on action"""
        if self.action == 'list':
            return Portfolio.objects.for_admin_listing()
        elif self.action in ['retrieve', 'update', 'partial_update']:
            return Portfolio.objects.for_detail()
        elif self.action == 'export':
            # For export, we need all relations for Excel and PDF
            return Portfolio.objects.prefetch_related(
                'categories',
                'tags',
                'options',
                'images__image',
                'videos__video',
                'videos__video__cover_image',
                'audios__audio',
                'audios__audio__cover_image',
                'documents__document',
                'documents__document__cover_image',
            ).select_related('og_image')
        else:
            return Portfolio.objects.all()

    def list(self, request, *args, **kwargs):
        """Optimized list with better performance"""
        # Get base queryset with optimizations
        queryset = self.filter_queryset(self.get_queryset())
        
        # Apply pagination
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
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
            return PortfolioAdminListSerializer
        elif self.action == 'create':
            return PortfolioAdminCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return PortfolioAdminUpdateSerializer
        else:
            return PortfolioAdminDetailSerializer
    
    def create(self, request, *args, **kwargs):
        """Create portfolio with SEO auto-generation and media handling"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Check if there are media files in the request
        media_files = request.FILES.getlist('media_files')
        
        if media_files:
            # Create portfolio with media using service
            portfolio = PortfolioAdminService.create_portfolio_with_media(
                serializer.validated_data,
                media_files,
                created_by=request.user
            )
        else:
            # Create portfolio using serializer's create method to handle categories_ids and tags_ids properly
            portfolio = serializer.save()
        
        # Return detailed response
        detail_serializer = PortfolioAdminDetailSerializer(portfolio)
        return Response(detail_serializer.data, status=status.HTTP_201_CREATED)
    
    def update(self, request, *args, **kwargs):
        """Update portfolio with SEO handling"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        # Update the instance directly
        for attr, value in serializer.validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Return detailed response
        detail_serializer = PortfolioAdminDetailSerializer(instance)
        return Response(detail_serializer.data)
    
    def destroy(self, request, *args, **kwargs):
        """Delete portfolio with media cleanup"""
        instance = self.get_object()
        
        # Delete using service (handles media cleanup)
        success = PortfolioAdminService.delete_portfolio(instance.id)
        
        if success:
            return Response(status=status.HTTP_204_NO_CONTENT)
        else:
            return Response(
                {"detail": PORTFOLIO_ERRORS["portfolio_delete_failed"]},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def change_status(self, request, pk=None):
        """Change portfolio status"""
        new_status = request.data.get('status')
        
        if not new_status:
            return Response(
                {"detail": PORTFOLIO_ERRORS["portfolio_invalid_status"]},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        portfolio = PortfolioAdminStatusService.change_status(pk, new_status)
        
        if portfolio:
            serializer = PortfolioAdminDetailSerializer(portfolio)
            return Response(serializer.data)
        else:
            return Response(
                {"detail": PORTFOLIO_ERRORS["portfolio_not_found"]},
                status=status.HTTP_400_BAD_REQUEST
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
        
        return Response(response_data)
    
    @action(detail=False, methods=['post'])
    def bulk_update_status(self, request):
        """Bulk status update for multiple portfolios"""
        portfolio_ids = request.data.get('portfolio_ids', [])
        new_status = request.data.get('status')
        
        if not portfolio_ids or not new_status:
            return Response(
                {"detail": PORTFOLIO_ERRORS["portfolio_invalid_status"]},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        success = PortfolioAdminService.bulk_update_status(portfolio_ids, new_status)
        
        if success:
            return Response({"detail": f"Updated {len(portfolio_ids)} portfolios to {new_status}."})
        else:
            return Response(
                {"detail": PORTFOLIO_ERRORS["portfolio_invalid_status"]},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['post'])
    def bulk_generate_seo(self, request):
        """Bulk SEO generation for multiple portfolios"""
        portfolio_ids = request.data.get('portfolio_ids', [])
        
        if not portfolio_ids:
            return Response(
                {"detail": PORTFOLIO_ERRORS["portfolio_not_found"]},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        updated_count = 0
        for portfolio_id in portfolio_ids:
            try:
                PortfolioAdminSEOService.auto_generate_seo(portfolio_id)
                updated_count += 1
            except Exception:
                continue
        
        return Response({"detail": f"Generated SEO for {updated_count} portfolios."})
    
    @action(detail=True, methods=['post'])
    def generate_seo(self, request, pk=None):
        """Auto-generate SEO data for single portfolio"""
        portfolio = PortfolioAdminSEOService.auto_generate_seo(pk)
        
        serializer = PortfolioAdminDetailSerializer(portfolio)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def validate_seo(self, request, pk=None):
        """Validate SEO data and get suggestions"""
        validation_result = PortfolioAdminSEOService.validate_seo_data(pk)
        
        return Response(validation_result)
    
    @action(detail=True, methods=['post'])
    def add_media(self, request, pk=None):
        """Add media files to portfolio with optimized performance"""
        
        # Validate input data
        serializer = PortfolioMediaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Extract validated data
        media_files = request.FILES.getlist('media_files')
        media_ids = serializer.validated_data.get('media_ids', [])
        
        # Use optimized service to add media
        result = PortfolioAdminMediaService.add_media_bulk(
            portfolio_id=pk,
            media_files=media_files,
            media_ids=media_ids,
            created_by=request.user
        )
        
        return Response(result)

    @action(detail=True, methods=['post'])
    def set_main_image(self, request, pk=None):
        """Set main image for portfolio"""
        media_id = request.data.get('media_id')
        
        if not media_id:
            return Response(
                {"detail": PORTFOLIO_ERRORS["portfolio_not_found"]},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # First, remove main image flag from any existing main image
            from src.portfolio.models.media import PortfolioImage
            PortfolioImage.objects.filter(portfolio_id=pk, is_main=True).update(is_main=False)
            
            # Then set the new main image
            # Check if this is a PortfolioImage, PortfolioVideo, etc.
            portfolio_image = PortfolioImage.objects.filter(portfolio_id=pk, image_id=media_id).first()
            if portfolio_image:
                portfolio_image.is_main = True
                portfolio_image.save()
            else:
                # If not found, we might need to create it or handle differently
                # For now, let's just call the service method
                portfolio_media = PortfolioAdminService.set_main_image(pk, media_id)
            
            return Response({"detail": PORTFOLIO_SUCCESS["portfolio_updated"]})
        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def seo_report(self, request):
        """Get comprehensive SEO report"""
        report = PortfolioAdminService.get_seo_report()
        
        return Response(report)
    
    @action(detail=True, methods=['get'])
    def statistics(self, request, *args, **kwargs):
        """Get portfolio statistics for dashboard"""
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
        
        return Response(stats)
    
    @action(detail=True, methods=['post'])
    def add_category(self, request, pk=None):
        """Add a category to a portfolio"""
        portfolio = self.get_object()
        category_id = request.data.get('category_id')
        
        if not category_id:
            return Response(
                {"detail": "category_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            category = PortfolioCategory.objects.get(id=category_id)
            portfolio.categories.add(category)
            return Response({"detail": "Category added successfully"})
        except PortfolioCategory.DoesNotExist:
            return Response(
                {"detail": "Category not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def remove_category(self, request, pk=None):
        """Remove a category from a portfolio"""
        portfolio = self.get_object()
        category_id = request.data.get('category_id')
        
        if not category_id:
            return Response(
                {"detail": "category_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            category = PortfolioCategory.objects.get(id=category_id)
            portfolio.categories.remove(category)
            return Response({"detail": "Category removed successfully"})
        except PortfolioCategory.DoesNotExist:
            return Response(
                {"detail": "Category not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def bulk_add_tags(self, request, pk=None):
        """Add multiple tags to a portfolio"""
        portfolio = self.get_object()
        tag_ids = request.data.get('tag_ids', [])
        
        if not tag_ids:
            return Response(
                {"detail": "tag_ids is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            tags = PortfolioTag.objects.filter(id__in=tag_ids)
            portfolio.tags.add(*tags)
            return Response({"detail": f"Added {tags.count()} tags successfully"})
        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def bulk_remove_tags(self, request, pk=None):
        """Remove multiple tags from a portfolio"""
        portfolio = self.get_object()
        tag_ids = request.data.get('tag_ids', [])
        
        if not tag_ids:
            return Response(
                {"detail": "tag_ids is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            tags = PortfolioTag.objects.filter(id__in=tag_ids)
            portfolio.tags.remove(*tags)
            return Response({"detail": f"Removed {tags.count()} tags successfully"})
        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['get'], url_path='export-pdf')
    def export_pdf(self, request, pk=None):
        """Export single portfolio to PDF
        
        Security:
        - Uses ContentManagerAccess permission class (inherited from ViewSet)
        - Only authenticated admin users with content manager or super admin roles can access
        - File is streamed directly without exposing data in response body
        """
        try:
            portfolio = Portfolio.objects.prefetch_related(
                'categories',
                'tags',
                'options',
                'images__image',
                'videos__video',
                'videos__video__cover_image',
                'audios__audio',
                'audios__audio__cover_image',
                'documents__document',
                'documents__document__cover_image',
                'og_image'
            ).select_related('og_image').get(pk=pk)
            
            # Use export service
            return PortfolioPDFExportService.export_portfolio_pdf(portfolio)
        except Portfolio.DoesNotExist:
            return Response(
                {"detail": "Portfolio not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except ImportError as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        except Exception as e:
            import traceback
            error_message = str(e)
            error_traceback = traceback.format_exc()
            print(f"PDF Export Error: {error_message}")
            print(f"Traceback: {error_traceback}")
            return Response(
                {"detail": f"PDF export failed: {error_message}", "traceback": error_traceback},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )