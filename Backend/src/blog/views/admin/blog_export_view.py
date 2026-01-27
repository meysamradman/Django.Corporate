import logging
import traceback
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.renderers import JSONRenderer
from django.core.cache import cache
from django.db.models import Q
from django.http import HttpResponse
from django.conf import settings
from src.blog.models.blog import Blog
from src.blog.services.admin.excel_export_service import BlogExcelExportService
from src.blog.services.admin.pdf_list_export_service import BlogPDFListExportService
from src.blog.filters.admin.blog_filters import BlogAdminFilter
from src.core.responses.response import APIResponse
from src.user.access_control import blog_permission, PermissionRequiredMixin
from src.user.auth.admin_session_auth import CSRFExemptSessionAuthentication
from src.blog.messages.messages import BLOG_ERRORS

logger = logging.getLogger(__name__)

class BlogExportView(PermissionRequiredMixin, APIView):
    authentication_classes = [CSRFExemptSessionAuthentication]
    permission_classes = [blog_permission]
    
    permission_map = {
        'get': 'blog.read',
    }
    permission_denied_message = BLOG_ERRORS["blog_not_authorized"]
    format_suffix_kwarg = None
    
    def options(self, request, *args, **kwargs):
        response = Response()
        self._add_cors_headers(response, request)
        response['Access-Control-Max-Age'] = '86400'
        return response
    
    def _add_cors_headers(self, response, request):
        origin = request.META.get('HTTP_ORIGIN')
        if not origin:
            return
            
        allowed_origins = getattr(settings, 'CORS_ALLOWED_ORIGINS', [])
        if settings.DEBUG or origin in allowed_origins:
            response['Access-Control-Allow-Origin'] = origin
            response['Access-Control-Allow-Credentials'] = 'true'
            response['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
            response['Access-Control-Allow-Headers'] = 'Content-Type, X-CSRFToken, Authorization, Accept'
            response['Access-Control-Expose-Headers'] = 'Content-Disposition, Content-Type, Content-Length'
    
    def perform_content_negotiation(self, request, force=False):
        return (JSONRenderer(), JSONRenderer().media_type)
    
    def dispatch(self, request, *args, **kwargs):
        result = super().dispatch(request, *args, **kwargs)
        if isinstance(result, HttpResponse) and 'Access-Control-Allow-Origin' not in result:
            self._add_cors_headers(result, request)
        return result
    
    def get(self, request):
        query_params = request.query_params
        export_format = query_params.get('format', 'excel').lower()
        
        if not getattr(request.user, 'is_admin_full', False):
            export_rate_limit = settings.BLOG_EXPORT_RATE_LIMIT
            export_rate_window = settings.BLOG_EXPORT_RATE_LIMIT_WINDOW
            cache_key = f"blog_export_limit_{request.user.id}"
            export_count = cache.get(cache_key, 0)
            if export_count >= export_rate_limit:
                return APIResponse.error(
                    message=BLOG_ERRORS["blog_export_limit_exceeded"],
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS
                )
            cache.set(cache_key, export_count + 1, export_rate_window)
        
        try:
            queryset = Blog.objects.prefetch_related(
                'categories', 'tags',
                'images__image',
                'videos__video', 'videos__video__cover_image',
                'audios__audio', 'audios__audio__cover_image',
                'documents__document', 'documents__document__cover_image',
            ).select_related('og_image')
            
            queryset = BlogAdminFilter(query_params, queryset=queryset).qs
            
            search = query_params.get('search', '')
            if search:
                queryset = queryset.filter(
                    Q(title__icontains=search) |
                    Q(short_description__icontains=search) |
                    Q(meta_title__icontains=search) |
                    Q(meta_description__icontains=search)
                )
            
            order_by = query_params.get('order_by', 'created_at')
            order_desc = query_params.get('order_desc', 'true').lower() == 'true'
            queryset = queryset.order_by(f'-{order_by}' if order_desc else order_by)
            
            export_all = query_params.get('export_all', 'false').lower() == 'true'
            page = query_params.get('page')
            size = query_params.get('size')
            
            if page and size and not export_all:
                try:
                    page_num = int(page)
                    page_size = int(size)
                    offset = (page_num - 1) * page_size
                    queryset = queryset[offset:offset + page_size]
                except (ValueError, TypeError):
                    pass
            else:
                max_export_items = settings.BLOG_EXPORT_MAX_ITEMS
                total_count = queryset.count()
                if total_count > max_export_items:
                    return APIResponse.error(
                        message=BLOG_ERRORS['blog_export_too_large'],
                        status_code=status.HTTP_400_BAD_REQUEST
                    )
            
            if export_format == 'pdf':
                response = BlogPDFListExportService.export_blogs_pdf(queryset)
            else:  # excel (default)
                response = BlogExcelExportService.export_blogs(queryset)
            
            self._add_cors_headers(response, request)
            return response
            
        except ImportError as e:
            logger.error(f"ImportError in BlogExportView: {str(e)}")
            logger.error(traceback.format_exc())
            return APIResponse.error(
                message=BLOG_ERRORS["blog_export_failed"],
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        except Exception as e:
            logger.error(f"Critical error in BlogExportView: {str(e)}")
            logger.error(traceback.format_exc())
            return APIResponse.error(
                message=BLOG_ERRORS["blog_export_failed"],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

