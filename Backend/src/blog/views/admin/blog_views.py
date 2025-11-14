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

from src.blog.models.blog import Blog
from src.blog.models.category import BlogCategory
from src.blog.models.tag import BlogTag
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
from src.user.authorization.admin_permission import ContentManagerAccess
from src.blog.messages.messages import BLOG_SUCCESS, BLOG_ERRORS
from src.blog.utils.cache import BlogCacheManager


class BlogAdminViewSet(viewsets.ModelViewSet):
    """
    Optimized Blog ViewSet for Admin Panel with SEO support
    """
    permission_classes = [ContentManagerAccess]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = BlogAdminFilter
    search_fields = ['title', 'short_description', 'meta_title', 'meta_description']
    ordering_fields = ['created_at', 'updated_at', 'title', 'status']
    ordering = ['-created_at']
    pagination_class = StandardLimitPagination  # Add DRF pagination
    
    def get_queryset(self):
        """Optimized queryset based on action"""
        if self.action == 'list':
            return Blog.objects.for_admin_listing()
        elif self.action in ['retrieve', 'update', 'partial_update', 'destroy']:
            # For retrieve, don't apply filters - just get the blog
            return Blog.objects.for_detail()
        elif self.action == 'export':
            # For export, we need all relations for Excel and PDF
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
        """Override retrieve to ensure proper serializer and queryset - bypass filters"""
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
        """Optimized list with better performance"""
        # Get base queryset with optimizations
        queryset = self.filter_queryset(self.get_queryset())
        
        # Apply pagination
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
        """Dynamic serializer selection"""
        if self.action == 'list':
            return BlogAdminListSerializer
        elif self.action == 'create':
            return BlogAdminCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return BlogAdminUpdateSerializer
        else:
            return BlogAdminDetailSerializer
    
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
        """Create blog with SEO auto-generation and media handling"""
        media_ids = self._extract_media_ids(request)
        media_files = request.FILES.getlist('media_files')
        
        # Validate upload limit - use settings directly for performance
        upload_max = settings.BLOG_MEDIA_UPLOAD_MAX
        total_media = len(media_ids) + len(media_files)
        if total_media > upload_max:
            raise DRFValidationError({
                'non_field_errors': [
                    f'Maximum {upload_max} media items allowed per upload. You provided {total_media} items.'
                ]
            })
        
        # Validate and create blog
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        blog = serializer.save()
        
        # Add media immediately after creation
        if media_files or media_ids:
            from src.blog.services.admin import BlogAdminMediaService
            BlogAdminMediaService.add_media_bulk(
                blog_id=blog.id,
                media_files=media_files,
                media_ids=media_ids,
                created_by=request.user
            )
            # Refresh blog to get updated media relationships
            blog.refresh_from_db()
            # Clear cache to ensure fresh data
            BlogCacheManager.invalidate_blog(blog.id)
        
        # Return detailed response with refreshed data
        # Use for_detail queryset to get all relations properly
        blog = Blog.objects.for_detail().get(id=blog.id)
        detail_serializer = BlogAdminDetailSerializer(blog)
        return APIResponse.success(
            message=BLOG_SUCCESS["blog_created"],
            data=detail_serializer.data,
            status_code=status.HTTP_201_CREATED
        )
    
    def update(self, request, *args, **kwargs):
        """Update blog with SEO handling and media sync"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        # Use serializer.save() which will call the serializer's update method
        # This ensures categories, tags، و رسانه‌ها به درستی مدیریت شوند
        updated_instance = serializer.save()
        
        # Clear cache to ensure fresh data
        BlogCacheManager.invalidate_blog(updated_instance.id)
        
        # Reload from database with all relations prefetched for proper serialization
        updated_instance = Blog.objects.for_detail().get(pk=updated_instance.pk)
        
        # Return detailed response with fresh data
        detail_serializer = BlogAdminDetailSerializer(updated_instance)
        return APIResponse.success(
            message=BLOG_SUCCESS["blog_updated"],
            data=detail_serializer.data,
            status_code=status.HTTP_200_OK
        )
    
    def destroy(self, request, *args, **kwargs):
        """Delete blog with media cleanup"""
        instance = self.get_object()
        
        # Delete using service (handles media cleanup)
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
        """Change blog status"""
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
        """Publish blog with SEO validation"""
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
        """Bulk delete multiple blogs"""
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
        """Bulk status update for multiple blogs"""
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
        """Bulk SEO generation for multiple blogs"""
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
        """Auto-generate SEO data for single blog"""
        blog = BlogAdminSEOService.auto_generate_seo(pk)
        
        serializer = BlogAdminDetailSerializer(blog)
        return APIResponse.success(
            message=BLOG_SUCCESS["blog_seo_generated"],
            data=serializer.data,
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['get'])
    def validate_seo(self, request, pk=None):
        """Validate SEO data and get suggestions"""
        validation_result = BlogAdminSEOService.validate_seo_data(pk)
        
        return APIResponse.success(
            message=BLOG_SUCCESS["blog_seo_validated"],
            data=validation_result,
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['post'])
    def add_media(self, request, pk=None):
        """Add media files to blog with optimized performance"""
        media_files = request.FILES.getlist('media_files')
        serializer = BlogMediaSerializer(data=request.data.copy())
        serializer.is_valid(raise_exception=True)
        
        media_ids = serializer.validated_data.get('media_ids', [])
        if not media_ids and not media_files:
            raise DRFValidationError({
                'non_field_errors': ['At least one of media_ids or media_files must be provided.']
            })
        
        # Validate upload limit - use settings directly for performance
        upload_max = settings.BLOG_MEDIA_UPLOAD_MAX
        total_media = len(media_ids) + len(media_files)
        if total_media > upload_max:
            raise DRFValidationError({
                'non_field_errors': [
                    f'Maximum {upload_max} media items allowed per upload. You provided {total_media} items.'
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
        """Set main image for blog"""
        media_id = request.data.get('media_id')
        
        if not media_id:
            return APIResponse.error(
                message=BLOG_ERRORS["media_id_required"],
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # First, remove main image flag from any existing main image
            from src.blog.models.media import BlogImage
            BlogImage.objects.filter(blog_id=pk, is_main=True).update(is_main=False)
            
            # Then set the new main image
            # Check if this is a BlogImage, BlogVideo, etc.
            blog_image = BlogImage.objects.filter(blog_id=pk, image_id=media_id).first()
            if blog_image:
                blog_image.is_main = True
                blog_image.save()
            else:
                # If not found, we might need to create it or handle differently
                # For now, let's just call the service method
                blog_media = BlogAdminService.set_main_image(pk, media_id)
            
            return APIResponse.success(
                message=BLOG_SUCCESS["blog_main_image_set"],
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
        report = BlogAdminService.get_seo_report()
        
        return APIResponse.success(
            message=BLOG_SUCCESS["blog_seo_report_retrieved"],
            data=report,
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['get'])
    def statistics(self, request, *args, **kwargs):
        """Get blog statistics for dashboard"""
        stats = {
            'total': Blog.objects.count(),
            'published': Blog.objects.filter(status='published').count(),
            'draft': Blog.objects.filter(status='draft').count(),
            'featured': Blog.objects.filter(is_featured=True).count(),
            'with_complete_seo': Blog.objects.complete_seo().count(),
            'with_partial_seo': Blog.objects.incomplete_seo().count(),
            'without_seo': Blog.objects.missing_seo().count(),
        }
        
        # Recent blogs
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
        """Add a category to a blog"""
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
        except Exception as e:
            return APIResponse.error(
                message=str(e),
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def remove_category(self, request, pk=None):
        """Remove a category from a blog"""
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
        except Exception as e:
            return APIResponse.error(
                message=str(e),
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def bulk_add_tags(self, request, pk=None):
        """Add multiple tags to a blog"""
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
        except Exception as e:
            return APIResponse.error(
                message=str(e),
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def bulk_remove_tags(self, request, pk=None):
        """Remove multiple tags from a blog"""
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
        except Exception as e:
            return APIResponse.error(
                message=str(e),
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['get'], url_path='export-pdf')
    def export_pdf(self, request, pk=None):
        """Export single blog to PDF
        
        Security:
        - Uses ContentManagerAccess permission class (inherited from ViewSet)
        - Only authenticated admin users with content manager or super admin roles can access
        - File is streamed directly without exposing data in response body
        """
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
            
            # Use export service
            return BlogPDFExportService.export_blog_pdf(blog)
        except Blog.DoesNotExist:
            return Response(
                {"detail": "Blog not found"},
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