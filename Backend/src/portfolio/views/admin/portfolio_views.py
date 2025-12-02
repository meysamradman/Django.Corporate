import json
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import NotFound, ValidationError as DRFValidationError
from django.core.exceptions import ValidationError
from src.core.responses.response import APIResponse
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count
from django.core.cache import cache
from django.utils import timezone
from django.conf import settings

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
from src.user.authorization.admin_permission import PortfolioManagerAccess
from src.portfolio.messages.messages import PORTFOLIO_SUCCESS, PORTFOLIO_ERRORS
from src.portfolio.utils.cache import PortfolioCacheManager
from src.user.permissions import PermissionValidator


class PortfolioAdminViewSet(viewsets.ModelViewSet):
    """
    Optimized Portfolio ViewSet for Admin Panel with SEO support
    """
    permission_classes = [PortfolioManagerAccess]
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
        elif self.action in ['retrieve', 'update', 'partial_update', 'destroy']:
            # For retrieve, don't apply filters - just get the portfolio
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
    
    def retrieve(self, request, *args, **kwargs):
        """Override retrieve to ensure proper serializer and queryset - bypass filters"""
        if not PermissionValidator.has_permission(request.user, 'portfolio.read'):
            return APIResponse.error(
                message=PORTFOLIO_ERRORS.get("portfolio_not_authorized", "You don't have permission to view portfolios"),
                status_code=status.HTTP_403_FORBIDDEN
            )
        queryset = Portfolio.objects.for_detail()
        pk = kwargs.get('pk')
        try:
            instance = queryset.get(pk=pk)
        except Portfolio.DoesNotExist:
            return APIResponse.error(
                message=PORTFOLIO_ERRORS["portfolio_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        serializer = self.get_serializer(instance)
        return APIResponse.success(
            message=PORTFOLIO_SUCCESS["portfolio_retrieved"],
            data=serializer.data,
            status_code=status.HTTP_200_OK
        )

    def list(self, request, *args, **kwargs):
        """Optimized list with better performance"""
        if not PermissionValidator.has_permission(request.user, 'portfolio.read'):
            return APIResponse.error(
                message=PORTFOLIO_ERRORS.get("portfolio_not_authorized", "You don't have permission to view portfolios"),
                status_code=status.HTTP_403_FORBIDDEN
            )
        # Get base queryset with optimizations
        queryset = self.filter_queryset(self.get_queryset())
        
        # Apply pagination
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return APIResponse.success(
            message=PORTFOLIO_SUCCESS["portfolio_list_success"],
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
        """Dynamic serializer selection"""
        if self.action == 'list':
            return PortfolioAdminListSerializer
        elif self.action == 'create':
            return PortfolioAdminCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return PortfolioAdminUpdateSerializer
        else:
            return PortfolioAdminDetailSerializer
    
    def _extract_media_ids(self, request):
        """Extract and parse media_ids from request (JSON or form-data)"""
        media_ids = []
        
        # Try request.data first (JSON raw)
        media_ids_value = request.data.get('media_ids')
        
        # Fallback to request.POST (form-data)
        if not media_ids_value:
            media_ids_value = request.POST.get('media_ids')
        
        if not media_ids_value:
            return []
        
        # Handle different formats
        if isinstance(media_ids_value, list):
            media_ids = [
                int(id) for id in media_ids_value 
                if isinstance(id, (int, str)) and str(id).isdigit()
            ]
        elif isinstance(media_ids_value, int):
            media_ids = [media_ids_value]
        elif isinstance(media_ids_value, str):
            # Try JSON array first
            if media_ids_value.strip().startswith('['):
                try:
                    parsed = json.loads(media_ids_value)
                    if isinstance(parsed, list):
                        media_ids = [int(id) for id in parsed if isinstance(id, (int, str)) and str(id).isdigit()]
                except json.JSONDecodeError:
                    pass
            
            # If not JSON array, try comma-separated string
            if not media_ids:
                media_ids = [
                    int(id.strip()) for id in media_ids_value.split(',') 
                    if id.strip().isdigit()
                ]
        
        return media_ids
    
    def create(self, request, *args, **kwargs):
        """Create portfolio with SEO auto-generation and media handling"""
        if not PermissionValidator.has_permission(request.user, 'portfolio.create'):
            return APIResponse.error(
                message=PORTFOLIO_ERRORS.get("portfolio_not_authorized", "You don't have permission to create portfolios"),
                status_code=status.HTTP_403_FORBIDDEN
            )
        media_ids = self._extract_media_ids(request)
        media_files = request.FILES.getlist('media_files')
        
        # Validate upload limit - use settings directly for performance
        upload_max = settings.PORTFOLIO_MEDIA_UPLOAD_MAX
        total_media = len(media_ids) + len(media_files)
        if total_media > upload_max:
            raise DRFValidationError({
                'non_field_errors': [
                    f'Maximum {upload_max} media items allowed per upload. You provided {total_media} items.'
                ]
            })
        
        # Validate and create portfolio
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        portfolio = serializer.save()
        
        # Add media immediately after creation
        if media_files or media_ids:
            from src.portfolio.services.admin import PortfolioAdminMediaService
            PortfolioAdminMediaService.add_media_bulk(
                portfolio_id=portfolio.id,
                media_files=media_files,
                media_ids=media_ids,
                created_by=request.user
            )
            # Refresh portfolio to get updated media relationships
            portfolio.refresh_from_db()
            # Clear cache to ensure fresh data
            PortfolioCacheManager.invalidate_portfolio(portfolio.id)
        
        # Return detailed response with refreshed data
        # Use for_detail queryset to get all relations properly
        portfolio = Portfolio.objects.for_detail().get(id=portfolio.id)
        detail_serializer = PortfolioAdminDetailSerializer(portfolio)
        return APIResponse.success(
            message=PORTFOLIO_SUCCESS["portfolio_created"],
            data=detail_serializer.data,
            status_code=status.HTTP_201_CREATED
        )
    
    def update(self, request, *args, **kwargs):
        """Update portfolio with SEO handling and media sync"""
        if not PermissionValidator.has_permission(request.user, 'portfolio.update'):
            return APIResponse.error(
                message=PORTFOLIO_ERRORS.get("portfolio_not_authorized", "You don't have permission to update portfolios"),
                status_code=status.HTTP_403_FORBIDDEN
            )
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        # Use serializer.save() which will call the serializer's update method
        # This ensures categories, tags, options, and media are properly handled
        updated_instance = serializer.save()
        
        # Clear cache to ensure fresh data
        PortfolioCacheManager.invalidate_portfolio(updated_instance.id)
        
        # Reload from database with all relations prefetched for proper serialization
        updated_instance = Portfolio.objects.for_detail().get(pk=updated_instance.pk)
        
        # Return detailed response with fresh data
        detail_serializer = PortfolioAdminDetailSerializer(updated_instance)
        return APIResponse.success(
            message=PORTFOLIO_SUCCESS["portfolio_updated"],
            data=detail_serializer.data,
            status_code=status.HTTP_200_OK
        )
    
    def destroy(self, request, *args, **kwargs):
        """Delete portfolio with media cleanup"""
        if not PermissionValidator.has_permission(request.user, 'portfolio.delete'):
            return APIResponse.error(
                message=PORTFOLIO_ERRORS.get("portfolio_not_authorized", "You don't have permission to delete portfolios"),
                status_code=status.HTTP_403_FORBIDDEN
            )
        instance = self.get_object()
        
        # Delete using service (handles media cleanup)
        success = PortfolioAdminService.delete_portfolio(instance.id)
        
        if success:
            return APIResponse.success(
                message=PORTFOLIO_SUCCESS["portfolio_deleted"],
                status_code=status.HTTP_200_OK
            )
        else:
            return APIResponse.error(
                message=PORTFOLIO_ERRORS["portfolio_delete_failed"],
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def change_status(self, request, pk=None):
        """Change portfolio status"""
        new_status = request.data.get('status')
        
        if not new_status:
            return APIResponse.error(
                message=PORTFOLIO_ERRORS["portfolio_invalid_status"],
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            portfolio = PortfolioAdminStatusService.change_status(pk, new_status)
            
            if portfolio:
                serializer = PortfolioAdminDetailSerializer(portfolio)
                return APIResponse.success(
                    message=PORTFOLIO_SUCCESS["portfolio_status_changed"],
                    data=serializer.data,
                    status_code=status.HTTP_200_OK
                )
            else:
                return APIResponse.error(
                    message=PORTFOLIO_ERRORS["portfolio_invalid_status"],
                    status_code=status.HTTP_400_BAD_REQUEST
                )
        except Portfolio.DoesNotExist:
            return APIResponse.error(
                message=PORTFOLIO_ERRORS["portfolio_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        """Publish portfolio with SEO validation"""
        try:
            result = PortfolioAdminStatusService.publish_portfolio(pk)
            
            serializer = PortfolioAdminDetailSerializer(result['portfolio'])
            
            response_data = {
                'portfolio': serializer.data,
                'seo_warnings': result['seo_warnings']
            }
            
            return APIResponse.success(
                message=PORTFOLIO_SUCCESS["portfolio_published"],
                data=response_data,
                status_code=status.HTTP_200_OK
            )
        except Portfolio.DoesNotExist:
            return APIResponse.error(
                message=PORTFOLIO_ERRORS["portfolio_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['post'], url_path='bulk-delete')
    def bulk_delete(self, request):
        """Bulk delete multiple portfolios"""
        portfolio_ids = request.data.get('ids', [])
        
        if not portfolio_ids:
            return APIResponse.error(
                message=PORTFOLIO_ERRORS["portfolio_ids_required"],
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            deleted_count = PortfolioAdminService.bulk_delete_portfolios(portfolio_ids)
            return APIResponse.success(
                message=PORTFOLIO_SUCCESS["portfolio_bulk_deleted"],
                data={'deleted_count': deleted_count},
                status_code=status.HTTP_200_OK
            )
        except ValidationError as e:
            error_msg = str(e)
            if "not found" in error_msg.lower():
                message = PORTFOLIO_ERRORS["portfolio_not_found"]
            elif "required" in error_msg.lower():
                message = PORTFOLIO_ERRORS["portfolio_ids_required"]
            else:
                message = PORTFOLIO_ERRORS["portfolio_delete_failed"]
            return APIResponse.error(
                message=message,
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['post'])
    def bulk_update_status(self, request):
        """Bulk status update for multiple portfolios"""
        portfolio_ids = request.data.get('portfolio_ids', [])
        new_status = request.data.get('status')
        
        if not portfolio_ids or not new_status:
            return APIResponse.error(
                message=PORTFOLIO_ERRORS["portfolio_invalid_status"],
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        success = PortfolioAdminService.bulk_update_status(portfolio_ids, new_status)
        
        if success:
            return APIResponse.success(
                message=PORTFOLIO_SUCCESS["portfolio_bulk_status_updated"],
                data={'updated_count': len(portfolio_ids), 'new_status': new_status},
                status_code=status.HTTP_200_OK
            )
        else:
            return APIResponse.error(
                message=PORTFOLIO_ERRORS["portfolio_invalid_status"],
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['post'])
    def bulk_generate_seo(self, request):
        """Bulk SEO generation for multiple portfolios"""
        portfolio_ids = request.data.get('portfolio_ids', [])
        
        if not portfolio_ids:
            return APIResponse.error(
                message=PORTFOLIO_ERRORS["portfolio_ids_required"],
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
            message=PORTFOLIO_SUCCESS["portfolio_bulk_seo_generated"],
            data={'generated_count': updated_count, 'total_count': len(portfolio_ids)},
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['post'])
    def generate_seo(self, request, pk=None):
        """Auto-generate SEO data for single portfolio"""
        portfolio = PortfolioAdminSEOService.auto_generate_seo(pk)
        
        serializer = PortfolioAdminDetailSerializer(portfolio)
        return APIResponse.success(
            message=PORTFOLIO_SUCCESS["portfolio_seo_generated"],
            data=serializer.data,
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['get'])
    def validate_seo(self, request, pk=None):
        """Validate SEO data and get suggestions"""
        validation_result = PortfolioAdminSEOService.validate_seo_data(pk)
        
        return APIResponse.success(
            message=PORTFOLIO_SUCCESS["portfolio_seo_validated"],
            data=validation_result,
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['post'])
    def add_media(self, request, pk=None):
        """Add media files to portfolio with optimized performance"""
        # Require portfolio.update for adding media to an existing portfolio
        if not PermissionValidator.has_permission(request.user, 'portfolio.update'):
            return APIResponse.error(
                message="شما اجازه افزودن رسانه به نمونه‌کار را ندارید.",
                status_code=status.HTTP_403_FORBIDDEN
            )
        media_files = request.FILES.getlist('media_files')
        serializer = PortfolioMediaSerializer(data=request.data.copy())
        serializer.is_valid(raise_exception=True)
        
        media_ids = serializer.validated_data.get('media_ids', [])
        if not media_ids and not media_files:
            raise DRFValidationError({
                'non_field_errors': ['At least one of media_ids or media_files must be provided.']
            })
        
        # Validate upload limit - use settings directly for performance
        upload_max = settings.PORTFOLIO_MEDIA_UPLOAD_MAX
        total_media = len(media_ids) + len(media_files)
        if total_media > upload_max:
            raise DRFValidationError({
                'non_field_errors': [
                    f'Maximum {upload_max} media items allowed per upload. You provided {total_media} items.'
                ]
            })
        
        result = PortfolioAdminMediaService.add_media_bulk(
            portfolio_id=pk,
            media_files=media_files,
            media_ids=media_ids,
            created_by=request.user
        )
        return APIResponse.success(
            message=PORTFOLIO_SUCCESS["portfolio_media_added"],
            data=result,
            status_code=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'])
    def set_main_image(self, request, pk=None):
        """Set main image for portfolio"""
        media_id = request.data.get('media_id')
        
        if not media_id:
            return APIResponse.error(
                message=PORTFOLIO_ERRORS["media_id_required"],
                status_code=status.HTTP_400_BAD_REQUEST
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
            
            return APIResponse.success(
                message=PORTFOLIO_SUCCESS["portfolio_main_image_set"],
                status_code=status.HTTP_200_OK
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
            message=PORTFOLIO_SUCCESS["portfolio_seo_report_retrieved"],
            data=report,
            status_code=status.HTTP_200_OK
        )
    
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
        
        return APIResponse.success(
            message=PORTFOLIO_SUCCESS["portfolio_statistics_retrieved"],
            data=stats,
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['post'])
    def add_category(self, request, pk=None):
        """Add a category to a portfolio"""
        portfolio = self.get_object()
        category_id = request.data.get('category_id')
        
        if not category_id:
            return APIResponse.error(
                message=PORTFOLIO_ERRORS["category_id_required"],
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            category = PortfolioCategory.objects.get(id=category_id)
            portfolio.categories.add(category)
            return APIResponse.success(
                message=PORTFOLIO_SUCCESS["category_added"],
                status_code=status.HTTP_200_OK
            )
        except PortfolioCategory.DoesNotExist:
            return APIResponse.error(
                message=PORTFOLIO_ERRORS["category_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return APIResponse.error(
                message=str(e),
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def remove_category(self, request, pk=None):
        """Remove a category from a portfolio"""
        portfolio = self.get_object()
        category_id = request.data.get('category_id')
        
        if not category_id:
            return APIResponse.error(
                message=PORTFOLIO_ERRORS["category_id_required"],
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            category = PortfolioCategory.objects.get(id=category_id)
            portfolio.categories.remove(category)
            return APIResponse.success(
                message=PORTFOLIO_SUCCESS["category_removed"],
                status_code=status.HTTP_200_OK
            )
        except PortfolioCategory.DoesNotExist:
            return APIResponse.error(
                message=PORTFOLIO_ERRORS["category_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return APIResponse.error(
                message=str(e),
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def bulk_add_tags(self, request, pk=None):
        """Add multiple tags to a portfolio"""
        portfolio = self.get_object()
        tag_ids = request.data.get('tag_ids', [])
        
        if not tag_ids:
            return APIResponse.error(
                message=PORTFOLIO_ERRORS["tag_ids_required"],
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            tags = PortfolioTag.objects.filter(id__in=tag_ids)
            portfolio.tags.add(*tags)
            return APIResponse.success(
                message=PORTFOLIO_SUCCESS["tags_added"],
                data={'added_count': tags.count()},
                status_code=status.HTTP_200_OK
            )
        except Exception as e:
            return APIResponse.error(
                message=str(e),
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def bulk_remove_tags(self, request, pk=None):
        """Remove multiple tags from a portfolio"""
        portfolio = self.get_object()
        tag_ids = request.data.get('tag_ids', [])
        
        if not tag_ids:
            return APIResponse.error(
                message=PORTFOLIO_ERRORS["tag_ids_required"],
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            tags = PortfolioTag.objects.filter(id__in=tag_ids)
            portfolio.tags.remove(*tags)
            return APIResponse.success(
                message=PORTFOLIO_SUCCESS["tags_removed"],
                data={'removed_count': tags.count()},
                status_code=status.HTTP_200_OK
            )
        except Exception as e:
            return APIResponse.error(
                message=str(e),
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['get'], url_path='export-pdf')
    def export_pdf(self, request, pk=None):
        """Export single portfolio to PDF
        
        Security:
        - Uses PortfolioManagerAccess permission class (inherited from ViewSet)
        - Only authenticated admin users with portfolio/content manager or super admin roles can access
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
            from src.portfolio.messages.messages import PORTFOLIO_ERRORS
            from src.core.responses.response import APIResponse
            return APIResponse.error(
                message=PORTFOLIO_ERRORS["portfolio_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        except ImportError:
            from src.portfolio.messages.messages import PORTFOLIO_ERRORS
            from src.core.responses.response import APIResponse
            return APIResponse.error(
                message=PORTFOLIO_ERRORS["portfolio_export_failed"],
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        except Exception:
            from src.portfolio.messages.messages import PORTFOLIO_ERRORS
            from src.core.responses.response import APIResponse
            return APIResponse.error(
                message=PORTFOLIO_ERRORS["portfolio_export_failed"],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )