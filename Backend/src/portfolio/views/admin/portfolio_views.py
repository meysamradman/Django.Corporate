import json
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
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
from src.portfolio.models.media import PortfolioImage
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
from src.user.access_control import portfolio_permission, PermissionRequiredMixin
from src.portfolio.messages.messages import PORTFOLIO_SUCCESS, PORTFOLIO_ERRORS
from src.portfolio.utils.cache import PortfolioCacheManager

class PortfolioAdminViewSet(PermissionRequiredMixin, viewsets.ModelViewSet):
    permission_classes = [portfolio_permission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = PortfolioAdminFilter
    search_fields = ['title', 'short_description', 'meta_title', 'meta_description']
    ordering_fields = ['created_at', 'updated_at', 'title', 'status']
    ordering = ['-created_at']
    pagination_class = StandardLimitPagination
    
    permission_map = {
        'list': 'portfolio.read',
        'retrieve': 'portfolio.read',
        'create': 'portfolio.create',
        'update': 'portfolio.update',
        'partial_update': 'portfolio.update',
        'destroy': 'portfolio.delete',
        'bulk_delete': 'portfolio.delete',
        'bulk_update_status': 'portfolio.update',
        'publish': 'portfolio.update',
        'unpublish': 'portfolio.update',
        'change_status': 'portfolio.update',
        'add_media': 'portfolio.update',
        'remove_media': 'portfolio.update',
        'set_main_image': 'portfolio.update',
        'generate_seo': 'portfolio.update',
        'validate_seo': 'portfolio.read',
        'bulk_generate_seo': 'portfolio.update',
        'seo_report': 'portfolio.read',
        'statistics': 'portfolio.read',
        'export': 'portfolio.read',
    }
    permission_denied_message = PORTFOLIO_ERRORS["portfolio_not_authorized"]
    
    def get_queryset(self):
        if self.action == 'list':
            return Portfolio.objects.for_admin_listing()
        elif self.action in ['retrieve', 'update', 'partial_update', 'destroy']:
            return Portfolio.objects.for_detail()
        elif self.action == 'export':
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
        queryset = self.filter_queryset(self.get_queryset())
        
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
    
    def _merge_media_data(self, data, media_ids=None, media_files=None):
        
        if media_ids:
            if hasattr(data, 'setlist'):
                data.setlist('media_ids', media_ids)
            else:
                data['media_ids'] = media_ids
        if media_files:
            if hasattr(data, 'setlist'):
                data.setlist('media_files', media_files)
            else:
                data['media_files'] = media_files
        return data

    def _extract_list(self, data, field_name, convert_to_int=False):
        
        import json
        value = data.get(field_name)
        if not value:
            return []
        
        result = []
        if isinstance(value, list):
            result = [v for v in value if v]
        elif isinstance(value, str):
            value = value.strip()
            if value.startswith('['):
                try:
                    parsed = json.loads(value)
                    if isinstance(parsed, list):
                        result = parsed
                except (json.JSONDecodeError, ValueError):
                    pass
            
            if not result:
                result = [v.strip() for v in value.split(',') if v.strip()]
        else:
            result = [value]
        
        if convert_to_int:
            converted = []
            for v in result:
                try:
                    converted.append(int(v))
                except (ValueError, TypeError):
                    pass
            return converted
        
        return result

    def _extract_media_ids(self, request):
        return self._extract_list(request.data, 'media_ids')
    
    def get_serializer_class(self):
        if self.action == 'list':
            return PortfolioAdminListSerializer
        elif self.action == 'create':
            return PortfolioAdminCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return PortfolioAdminUpdateSerializer
        else:
            return PortfolioAdminDetailSerializer

    def create(self, request, *args, **kwargs):
        media_ids = self._extract_media_ids(request)
        media_files = request.FILES.getlist('media_files')
        
        data = request.data.copy()
        
        for field in ['categories', 'tags', 'options', 'extra_attributes']:
            if field in data:
                extracted = self._extract_list(data, field, convert_to_int=True) if field != 'extra_attributes' else data.get(field)
                if field == 'extra_attributes' and isinstance(extracted, str):
                    try:
                        import json
                        extracted = json.loads(extracted)
                    except: pass
                
                if hasattr(data, 'setlist') and isinstance(extracted, list):
                    data.setlist(field, extracted)
                else:
                    data[field] = extracted
        
        data = self._merge_media_data(data, media_ids, media_files)
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        
        try:
            portfolio = PortfolioAdminService.create_portfolio(
                validated_data=serializer.validated_data,
                created_by=request.user
            )
            
            instance = Portfolio.objects.for_detail().get(id=portfolio.id)
            detail_serializer = PortfolioAdminDetailSerializer(instance, context={'request': request})
            
            return APIResponse.success(
                message=PORTFOLIO_SUCCESS["portfolio_created"],
                data=detail_serializer.data,
                status_code=status.HTTP_201_CREATED
            )
        except ValidationError as e:
            return APIResponse.error(
                message=str(e.message if hasattr(e, 'message') else e),
                status_code=status.HTTP_400_BAD_REQUEST
            )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        media_ids = self._extract_media_ids(request)
        media_files = request.FILES.getlist('media_files')
        main_image_id = request.data.get('main_image_id')
        media_covers_raw = request.data.get('media_covers')
        
        data = request.data.copy()
        
        for field in ['categories', 'tags', 'options', 'extra_attributes']:
            if field in data:
                extracted = self._extract_list(data, field, convert_to_int=True) if field != 'extra_attributes' else data.get(field)
                if field == 'extra_attributes' and isinstance(extracted, str):
                    try:
                        import json
                        extracted = json.loads(extracted)
                    except: pass
                
                if hasattr(data, 'setlist') and isinstance(extracted, list):
                    data.setlist(field, extracted)
                else:
                    data[field] = extracted
        
        media_covers = None
        if media_covers_raw:
            if isinstance(media_covers_raw, dict):
                media_covers = media_covers_raw
            elif isinstance(media_covers_raw, str):
                try:
                    import json
                    media_covers = json.loads(media_covers_raw)
                except Exception:
                    media_covers = None
        
        data = self._merge_media_data(data, media_ids, media_files)
        if media_covers: data['media_covers'] = media_covers
        if main_image_id: data['main_image_id'] = main_image_id
            
        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        try:
            updated_instance = PortfolioAdminService.update_portfolio(
                portfolio_id=instance.id,
                validated_data=serializer.validated_data,
                media_ids=serializer.validated_data.get('media_ids'),
                media_files=serializer.validated_data.get('media_files'),
                main_image_id=serializer.validated_data.get('main_image_id'),
                media_covers=serializer.validated_data.get('media_covers'),
                updated_by=request.user
            )
            
            updated_instance = Portfolio.objects.for_detail().get(pk=updated_instance.pk)
            detail_serializer = PortfolioAdminDetailSerializer(updated_instance, context={'request': request})
            
            return APIResponse.success(
                message=PORTFOLIO_SUCCESS["portfolio_updated"],
                data=detail_serializer.data,
                status_code=status.HTTP_200_OK
            )
        except ValidationError as e:
            return APIResponse.error(
                message=str(e.message if hasattr(e, 'message') else e),
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        
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
        portfolio = PortfolioAdminSEOService.auto_generate_seo(pk)
        
        serializer = PortfolioAdminDetailSerializer(portfolio)
        return APIResponse.success(
            message=PORTFOLIO_SUCCESS["portfolio_seo_generated"],
            data=serializer.data,
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['get'])
    def validate_seo(self, request, pk=None):
        validation_result = PortfolioAdminSEOService.validate_seo_data(pk)
        
        return APIResponse.success(
            message=PORTFOLIO_SUCCESS["portfolio_seo_validated"],
            data=validation_result,
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['post'])
    def add_media(self, request, pk=None):
        media_files = request.FILES.getlist('media_files')
        serializer = PortfolioMediaSerializer(data=request.data.copy())
        serializer.is_valid(raise_exception=True)
        
        media_ids = serializer.validated_data.get('media_ids', [])
        if not media_ids and not media_files:
            raise DRFValidationError({
                'non_field_errors': ['At least one of media_ids or media_files must be provided.']
            })
        
        upload_max = settings.PORTFOLIO_MEDIA_UPLOAD_MAX
        total_media = len(media_ids) + len(media_files)
        if total_media > upload_max:
            raise DRFValidationError({
                'non_field_errors': [
                    PORTFOLIO_ERRORS["media_upload_limit_exceeded"].format(max_items=upload_max, total_items=total_media)
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
        media_id = request.data.get('media_id')
        
        if not media_id:
            return APIResponse.error(
                message=PORTFOLIO_ERRORS["media_id_required"],
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            PortfolioAdminMediaService.set_main_image(pk, media_id)
            
            fresh_instance = Portfolio.objects.for_detail().get(pk=pk)
            serializer = PortfolioAdminDetailSerializer(fresh_instance)
            
            return APIResponse.success(
                message=PORTFOLIO_SUCCESS["portfolio_main_image_set"],
                data=serializer.data,
                status_code=status.HTTP_200_OK
            )
        except Exception:
            return APIResponse.error(
                message=PORTFOLIO_ERRORS["portfolio_update_failed"],
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def seo_report(self, request):
        report = PortfolioAdminService.get_seo_report()
        
        return APIResponse.success(
            message=PORTFOLIO_SUCCESS["portfolio_seo_report_retrieved"],
            data=report,
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['get'])
    def statistics(self, request, *args, **kwargs):
        stats = {
            'total': Portfolio.objects.count(),
            'published': Portfolio.objects.filter(status='published').count(),
            'draft': Portfolio.objects.filter(status='draft').count(),
            'featured': Portfolio.objects.filter(is_featured=True).count(),
            'with_complete_seo': Portfolio.objects.complete_seo().count(),
            'with_partial_seo': Portfolio.objects.incomplete_seo().count(),
            'without_seo': Portfolio.objects.missing_seo().count(),
        }
        
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
        except Exception:
            return APIResponse.error(
                message=PORTFOLIO_ERRORS["portfolio_update_failed"],
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def remove_category(self, request, pk=None):
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
        except Exception:
            return APIResponse.error(
                message=PORTFOLIO_ERRORS["portfolio_update_failed"],
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def bulk_add_tags(self, request, pk=None):
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
        except Exception:
            return APIResponse.error(
                message=PORTFOLIO_ERRORS["portfolio_update_failed"],
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def bulk_remove_tags(self, request, pk=None):
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
        except Exception:
            return APIResponse.error(
                message=PORTFOLIO_ERRORS["portfolio_update_failed"],
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['get'], url_path='export-pdf')
    def export_pdf(self, request, pk=None):
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
            
            return PortfolioPDFExportService.export_portfolio_pdf(portfolio)
        except Portfolio.DoesNotExist:
            return APIResponse.error(
                message=PORTFOLIO_ERRORS["portfolio_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        except ImportError:
            return APIResponse.error(
                message=PORTFOLIO_ERRORS["portfolio_export_failed"],
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        except Exception:
            return APIResponse.error(
                message=PORTFOLIO_ERRORS["portfolio_export_failed"],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )