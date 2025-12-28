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

from src.blog.models.blog import Blog
from src.blog.models.category import BlogCategory
from src.blog.models.tag import BlogTag
from src.blog.models.media import BlogImage
from src.blog.serializers.admin import (
    BlogAdminListSerializer,
    BlogAdminDetailSerializer,
    BlogAdminCreateSerializer,
    BlogAdminUpdateSerializer,
    BlogMediaSerializer
)
from src.blog.services.admin import (
    BlogAdminMediaService,
    BlogAdminService,
    BlogAdminStatusService,
    BlogAdminSEOService,
    BlogExcelExportService,
    BlogPDFExportService,
)
from src.blog.filters.admin.blog_filters import BlogAdminFilter
from src.core.pagination import StandardLimitPagination
from src.user.access_control import blog_permission, PermissionRequiredMixin
from src.blog.messages.messages import BLOG_SUCCESS, BLOG_ERRORS
from src.blog.utils.cache import BlogCacheManager


class BlogAdminViewSet(PermissionRequiredMixin, viewsets.ModelViewSet):
    permission_classes = [blog_permission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = BlogAdminFilter
    search_fields = ['title', 'short_description', 'meta_title', 'meta_description']
    ordering_fields = ['created_at', 'updated_at', 'title', 'status']
    ordering = ['-created_at']
    pagination_class = StandardLimitPagination
    
    # ✅ Permission map - یکجا تعریف
    permission_map = {
        'list': 'blog.read',
        'retrieve': 'blog.read',
        'create': 'blog.create',
        'update': 'blog.update',
        'partial_update': 'blog.update',
        'destroy': 'blog.delete',
        'bulk_delete': 'blog.delete',
        'bulk_update_status': 'blog.update',
        'publish': 'blog.update',
        'unpublish': 'blog.update',
        'change_status': 'blog.update',
        'add_media': 'blog.update',
        'remove_media': 'blog.update',
        'set_main_image': 'blog.update',
        'generate_seo': 'blog.update',
        'validate_seo': 'blog.read',
        'bulk_generate_seo': 'blog.update',
        'seo_report': 'blog.read',
        'statistics': 'blog.read',
        'export': 'blog.read',
    }
    permission_denied_message = BLOG_ERRORS["blog_not_authorized"]
    
    def get_queryset(self):
        if self.action == 'list':
            return Blog.objects.for_admin_listing()
        elif self.action in ['retrieve', 'update', 'partial_update', 'destroy']:
            return Blog.objects.for_detail()
        elif self.action == 'export':
            return Blog.objects.prefetch_related(
                'categories',
                'tags',
                'images__image',
                'videos__video',
                'videos__video__cover_image',
                'audios__audio',
                'audios__audio__cover_image',
                'documents__document',
                'documents__document__cover_image',
            ).select_related('og_image')
        else:
            return Blog.objects.all()
    
    def retrieve(self, request, *args, **kwargs):
        queryset = Blog.objects.for_detail()
        pk = kwargs.get('pk')
        try:
            instance = queryset.get(pk=pk)
        except Blog.DoesNotExist:
            return APIResponse.error(
                message=BLOG_ERRORS["blog_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        serializer = self.get_serializer(instance)
        return APIResponse.success(
            message=BLOG_SUCCESS["blog_retrieved"],
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
            message=BLOG_SUCCESS["blog_list_success"],
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
            return BlogAdminListSerializer
        elif self.action == 'create':
            return BlogAdminCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return BlogAdminUpdateSerializer
        else:
            return BlogAdminDetailSerializer
    
    def _extract_media_ids(self, request):
        media_ids = []
        
        media_ids_value = request.data.get('media_ids')
        
        if not media_ids_value:
            media_ids_value = request.POST.get('media_ids')
        
        if not media_ids_value:
            return []
        
        if isinstance(media_ids_value, list):
            media_ids = [
                int(id) for id in media_ids_value 
                if isinstance(id, (int, str)) and str(id).isdigit()
            ]
        elif isinstance(media_ids_value, int):
            media_ids = [media_ids_value]
        elif isinstance(media_ids_value, str):
            if media_ids_value.strip().startswith('['):
                try:
                    parsed = json.loads(media_ids_value)
                    if isinstance(parsed, list):
                        media_ids = [int(id) for id in parsed if isinstance(id, (int, str)) and str(id).isdigit()]
                except json.JSONDecodeError:
                    pass
            
            if not media_ids:
                media_ids = [
                    int(id.strip()) for id in media_ids_value.split(',') 
                    if id.strip().isdigit()
                ]
        
        return media_ids
    
    def create(self, request, *args, **kwargs):
        media_ids = self._extract_media_ids(request)
        media_files = request.FILES.getlist('media_files')
        
        upload_max = settings.BLOG_MEDIA_UPLOAD_MAX
        total_media = len(media_ids) + len(media_files)
        if total_media > upload_max:
            raise DRFValidationError({
                'non_field_errors': [
                    BLOG_ERRORS["media_upload_limit_exceeded"].format(max_items=upload_max, total_items=total_media)
                ]
            })
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        blog = BlogAdminService.create_blog(
            validated_data=serializer.validated_data,
            created_by=request.user
        )
        
        if media_files or media_ids:
            BlogAdminMediaService.add_media_bulk(
                blog_id=blog.id,
                media_files=media_files,
                media_ids=media_ids,
                created_by=request.user
            )
            blog.refresh_from_db()
            BlogCacheManager.invalidate_blog(blog.id)
        
        blog = Blog.objects.for_detail().get(id=blog.id)
        detail_serializer = BlogAdminDetailSerializer(blog)
        return APIResponse.success(
            message=BLOG_SUCCESS["blog_created"],
            data=detail_serializer.data,
            status_code=status.HTTP_201_CREATED
        )
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        media_ids = self._extract_media_ids(request)
        main_image_id = request.data.get('main_image_id')
        media_covers_raw = request.data.get('media_covers')
        
        media_covers = None
        if media_covers_raw:
            if isinstance(media_covers_raw, dict):
                media_covers = media_covers_raw
            elif isinstance(media_covers_raw, str):
                try:
                    import json
                    media_covers = json.loads(media_covers_raw)
                except:
                    media_covers = None
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        updated_instance = BlogAdminService.update_blog(
            blog_id=instance.id,
            validated_data=serializer.validated_data,
            media_ids=media_ids if media_ids else None,
            main_image_id=main_image_id,
            media_covers=media_covers,
            updated_by=request.user
        )
        
        updated_instance = Blog.objects.for_detail().get(pk=updated_instance.pk)
        
        detail_serializer = BlogAdminDetailSerializer(updated_instance)
        return APIResponse.success(
            message=BLOG_SUCCESS["blog_updated"],
            data=detail_serializer.data,
            status_code=status.HTTP_200_OK
        )
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        
        success = BlogAdminService.delete_blog(instance.id)
        
        if success:
            return APIResponse.success(
                message=BLOG_SUCCESS["blog_deleted"],
                status_code=status.HTTP_200_OK
            )
        else:
            return APIResponse.error(
                message=BLOG_ERRORS["blog_delete_failed"],
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def change_status(self, request, pk=None):
        new_status = request.data.get('status')
        
        if not new_status:
            return APIResponse.error(
                message=BLOG_ERRORS["blog_invalid_status"],
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            blog = BlogAdminStatusService.change_status(pk, new_status)
            
            if blog:
                serializer = BlogAdminDetailSerializer(blog)
                return APIResponse.success(
                    message=BLOG_SUCCESS["blog_status_changed"],
                    data=serializer.data,
                    status_code=status.HTTP_200_OK
                )
            else:
                return APIResponse.error(
                    message=BLOG_ERRORS["blog_invalid_status"],
                    status_code=status.HTTP_400_BAD_REQUEST
                )
        except Blog.DoesNotExist:
            return APIResponse.error(
                message=BLOG_ERRORS["blog_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        try:
            result = BlogAdminStatusService.publish_blog(pk)
            
            serializer = BlogAdminDetailSerializer(result['blog'])
            
            response_data = {
                'blog': serializer.data,
                'seo_warnings': result['seo_warnings']
            }
            
            return APIResponse.success(
                message=BLOG_SUCCESS["blog_published"],
                data=response_data,
                status_code=status.HTTP_200_OK
            )
        except Blog.DoesNotExist:
            return APIResponse.error(
                message=BLOG_ERRORS["blog_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['post'], url_path='bulk-delete')
    def bulk_delete(self, request):
        blog_ids = request.data.get('ids', [])
        
        if not blog_ids:
            return APIResponse.error(
                message=BLOG_ERRORS["blog_ids_required"],
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            deleted_count = BlogAdminService.bulk_delete_blogs(blog_ids)
            return APIResponse.success(
                message=BLOG_SUCCESS["blog_bulk_deleted"],
                data={'deleted_count': deleted_count},
                status_code=status.HTTP_200_OK
            )
        except ValidationError as e:
            error_msg = str(e)
            if "not found" in error_msg.lower():
                message = BLOG_ERRORS["blog_not_found"]
            elif "required" in error_msg.lower():
                message = BLOG_ERRORS["blog_ids_required"]
            else:
                message = BLOG_ERRORS["blog_delete_failed"]
            return APIResponse.error(
                message=message,
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['post'])
    def bulk_update_status(self, request):
        blog_ids = request.data.get('blog_ids', [])
        new_status = request.data.get('status')
        
        if not blog_ids or not new_status:
            return APIResponse.error(
                message=BLOG_ERRORS["blog_invalid_status"],
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        success = BlogAdminService.bulk_update_status(blog_ids, new_status)
        
        if success:
            return APIResponse.success(
                message=BLOG_SUCCESS["blog_bulk_status_updated"],
                data={'updated_count': len(blog_ids), 'new_status': new_status},
                status_code=status.HTTP_200_OK
            )
        else:
            return APIResponse.error(
                message=BLOG_ERRORS["blog_invalid_status"],
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['post'])
    def bulk_generate_seo(self, request):
        blog_ids = request.data.get('blog_ids', [])
        
        if not blog_ids:
            return APIResponse.error(
                message=BLOG_ERRORS["blog_ids_required"],
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        updated_count = 0
        for blog_id in blog_ids:
            try:
                BlogAdminSEOService.auto_generate_seo(blog_id)
                updated_count += 1
            except Exception:
                continue
        
        return APIResponse.success(
            message=BLOG_SUCCESS["blog_bulk_seo_generated"],
            data={'generated_count': updated_count, 'total_count': len(blog_ids)},
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['post'])
    def generate_seo(self, request, pk=None):
        blog = BlogAdminSEOService.auto_generate_seo(pk)
        
        serializer = BlogAdminDetailSerializer(blog)
        return APIResponse.success(
            message=BLOG_SUCCESS["blog_seo_generated"],
            data=serializer.data,
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['get'])
    def validate_seo(self, request, pk=None):
        validation_result = BlogAdminSEOService.validate_seo_data(pk)
        
        return APIResponse.success(
            message=BLOG_SUCCESS["blog_seo_validated"],
            data=validation_result,
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['post'])
    def add_media(self, request, pk=None):
        media_files = request.FILES.getlist('media_files')
        serializer = BlogMediaSerializer(data=request.data.copy())
        serializer.is_valid(raise_exception=True)
        
        media_ids = serializer.validated_data.get('media_ids', [])
        if not media_ids and not media_files:
            raise DRFValidationError({
                'non_field_errors': ['At least one of media_ids or media_files must be provided.']
            })
        
        upload_max = settings.BLOG_MEDIA_UPLOAD_MAX
        total_media = len(media_ids) + len(media_files)
        if total_media > upload_max:
            raise DRFValidationError({
                'non_field_errors': [
                    BLOG_ERRORS["media_upload_limit_exceeded"].format(max_items=upload_max, total_items=total_media)
                ]
            })
        
        result = BlogAdminMediaService.add_media_bulk(
            blog_id=pk,
            media_files=media_files,
            media_ids=media_ids,
            created_by=request.user
        )
        return APIResponse.success(
            message=BLOG_SUCCESS["blog_media_added"],
            data=result,
            status_code=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'])
    def set_main_image(self, request, pk=None):
        media_id = request.data.get('media_id')
        
        if not media_id:
            return APIResponse.error(
                message=BLOG_ERRORS["media_id_required"],
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            BlogImage.objects.filter(blog_id=pk, is_main=True).update(is_main=False)
            
            blog_image = BlogImage.objects.filter(blog_id=pk, image_id=media_id).first()
            if blog_image:
                blog_image.is_main = True
                blog_image.save()
            else:
                blog_media = BlogAdminService.set_main_image(pk, media_id)
            
            return APIResponse.success(
                message=BLOG_SUCCESS["blog_main_image_set"],
                status_code=status.HTTP_200_OK
            )
        except Exception:
            return APIResponse.error(
                message=BLOG_ERRORS["blog_update_failed"],
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def seo_report(self, request):
        report = BlogAdminService.get_seo_report()
        
        return APIResponse.success(
            message=BLOG_SUCCESS["blog_seo_report_retrieved"],
            data=report,
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['get'])
    def statistics(self, request, *args, **kwargs):
        stats = {
            'total': Blog.objects.count(),
            'published': Blog.objects.filter(status='published').count(),
            'draft': Blog.objects.filter(status='draft').count(),
            'featured': Blog.objects.filter(is_featured=True).count(),
            'with_complete_seo': Blog.objects.complete_seo().count(),
            'with_partial_seo': Blog.objects.incomplete_seo().count(),
            'without_seo': Blog.objects.missing_seo().count(),
        }
        
        recent_blogs = Blog.objects.for_admin_listing()[:5]
        recent_serializer = BlogAdminListSerializer(recent_blogs, many=True)
        
        stats['recent_blogs'] = recent_serializer.data
        
        return APIResponse.success(
            message=BLOG_SUCCESS["blog_statistics_retrieved"],
            data=stats,
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['post'])
    def add_category(self, request, pk=None):
        blog = self.get_object()
        category_id = request.data.get('category_id')
        
        if not category_id:
            return APIResponse.error(
                message=BLOG_ERRORS["category_id_required"],
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            category = BlogCategory.objects.get(id=category_id)
            blog.categories.add(category)
            return APIResponse.success(
                message=BLOG_SUCCESS["category_added"],
                status_code=status.HTTP_200_OK
            )
        except BlogCategory.DoesNotExist:
            return APIResponse.error(
                message=BLOG_ERRORS["category_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        except Exception:
            return APIResponse.error(
                message=BLOG_ERRORS["blog_update_failed"],
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def remove_category(self, request, pk=None):
        blog = self.get_object()
        category_id = request.data.get('category_id')
        
        if not category_id:
            return APIResponse.error(
                message=BLOG_ERRORS["category_id_required"],
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            category = BlogCategory.objects.get(id=category_id)
            blog.categories.remove(category)
            return APIResponse.success(
                message=BLOG_SUCCESS["category_removed"],
                status_code=status.HTTP_200_OK
            )
        except BlogCategory.DoesNotExist:
            return APIResponse.error(
                message=BLOG_ERRORS["category_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        except Exception:
            return APIResponse.error(
                message=BLOG_ERRORS["blog_update_failed"],
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def bulk_add_tags(self, request, pk=None):
        blog = self.get_object()
        tag_ids = request.data.get('tag_ids', [])
        
        if not tag_ids:
            return APIResponse.error(
                message=BLOG_ERRORS["tag_ids_required"],
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            tags = BlogTag.objects.filter(id__in=tag_ids)
            blog.tags.add(*tags)
            return APIResponse.success(
                message=BLOG_SUCCESS["tags_added"],
                data={'added_count': tags.count()},
                status_code=status.HTTP_200_OK
            )
        except Exception:
            return APIResponse.error(
                message=BLOG_ERRORS["blog_update_failed"],
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def bulk_remove_tags(self, request, pk=None):
        blog = self.get_object()
        tag_ids = request.data.get('tag_ids', [])
        
        if not tag_ids:
            return APIResponse.error(
                message=BLOG_ERRORS["tag_ids_required"],
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            tags = BlogTag.objects.filter(id__in=tag_ids)
            blog.tags.remove(*tags)
            return APIResponse.success(
                message=BLOG_SUCCESS["tags_removed"],
                data={'removed_count': tags.count()},
                status_code=status.HTTP_200_OK
            )
        except Exception:
            return APIResponse.error(
                message=BLOG_ERRORS["blog_update_failed"],
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['get'], url_path='export-pdf')
    def export_pdf(self, request, pk=None):
        try:
            blog = Blog.objects.prefetch_related(
                'categories',
                'tags',
                'images__image',
                'videos__video',
                'videos__video__cover_image',
                'audios__audio',
                'audios__audio__cover_image',
                'documents__document',
                'documents__document__cover_image',
                'og_image'
            ).select_related('og_image').get(pk=pk)
            
            return BlogPDFExportService.export_blog_pdf(blog)
        except Blog.DoesNotExist:
            return APIResponse.error(
                message=BLOG_ERRORS["blog_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        except ImportError:
            return APIResponse.error(
                message=BLOG_ERRORS["blog_export_failed"],
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        except Exception:
            return APIResponse.error(
                message=BLOG_ERRORS["blog_export_failed"],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )