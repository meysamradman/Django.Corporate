from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.core.cache import cache
from django.db.models import Q
from django.http import HttpResponse
from django.conf import settings
from src.blog.models.blog import Blog
from src.blog.services.admin.excel_export_service import BlogExcelExportService
from src.blog.services.admin.pdf_list_export_service import BlogPDFListExportService
from src.blog.filters.admin.blog_filters import BlogAdminFilter
from src.core.responses.response import APIResponse
from src.user.authorization.admin_permission import BlogManagerAccess
from src.user.auth.admin_session_auth import CSRFExemptSessionAuthentication
from src.blog.messages.messages import BLOG_ERRORS


class BlogExportView(APIView):
    """View for exporting blogs to Excel or PDF"""
    # Use only CSRFExemptSessionAuthentication - override default authentication
    authentication_classes = [CSRFExemptSessionAuthentication]
    permission_classes = [BlogManagerAccess]
    # Disable format suffix negotiation for export endpoints (we handle format via query params)
    format_suffix_kwarg = None
    
    def options(self, request, *args, **kwargs):
        """Handle CORS preflight requests"""
        response = Response()
        self._add_cors_headers(response, request)
        response['Access-Control-Max-Age'] = '86400'
        return response
    
    def _add_cors_headers(self, response, request):
        """Add CORS headers for HttpResponse (binary downloads)"""
        origin = request.META.get('HTTP_ORIGIN', '')
        allowed_origins = getattr(settings, 'CORS_ALLOWED_ORIGINS', [])
        
        if origin and (origin in allowed_origins or settings.DEBUG):
            response['Access-Control-Allow-Origin'] = origin
        elif allowed_origins:
            response['Access-Control-Allow-Origin'] = allowed_origins[0]
        
        if getattr(settings, 'CORS_ALLOW_CREDENTIALS', False):
            response['Access-Control-Allow-Credentials'] = 'true'
        
        response['Access-Control-Expose-Headers'] = 'Content-Disposition, Content-Type'
    
    def perform_content_negotiation(self, request, force=False):
        """Skip content negotiation for binary file downloads"""
        from rest_framework.renderers import JSONRenderer
        return (JSONRenderer(), JSONRenderer().media_type)
    
    def dispatch(self, request, *args, **kwargs):
        """Ensure CORS headers for HttpResponse"""
        result = super().dispatch(request, *args, **kwargs)
        if isinstance(result, HttpResponse) and 'Access-Control-Allow-Origin' not in result:
            self._add_cors_headers(result, request)
        return result
    
    def get(self, request):
        """Export blogs to Excel or PDF with all filters applied"""
        query_params = request.query_params
        export_format = query_params.get('format', 'excel').lower()
        
        # Rate limiting - skip for super admin
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
            # Build queryset with filters
            queryset = Blog.objects.prefetch_related(
                'categories', 'tags',
                'images__image',
                'videos__video', 'videos__video__cover_image',
                'audios__audio', 'audios__audio__cover_image',
                'documents__document', 'documents__document__cover_image',
            ).select_related('og_image')
            
            # Apply filters
            queryset = BlogAdminFilter(query_params, queryset=queryset).qs
            
            # Apply search
            search = query_params.get('search', '')
            if search:
                queryset = queryset.filter(
                    Q(title__icontains=search) |
                    Q(short_description__icontains=search) |
                    Q(meta_title__icontains=search) |
                    Q(meta_description__icontains=search)
                )
            
            # Apply ordering
            order_by = query_params.get('order_by', 'created_at')
            order_desc = query_params.get('order_desc', 'true').lower() == 'true'
            queryset = queryset.order_by(f'-{order_by}' if order_desc else order_by)
            
            # Check if exporting specific page or all
            export_all = query_params.get('export_all', 'false').lower() == 'true'
            page = query_params.get('page')
            size = query_params.get('size')
            
            # If page and size are provided, export only that page (faster)
            if page and size and not export_all:
                try:
                    page_num = int(page)
                    page_size = int(size)
                    offset = (page_num - 1) * page_size
                    queryset = queryset[offset:offset + page_size]
                except (ValueError, TypeError):
                    # If invalid page/size, fall back to all
                    pass
            else:
                # Export all (with limit check)
                max_export_items = settings.BLOG_EXPORT_MAX_ITEMS
                total_count = queryset.count()
                if total_count > max_export_items:
                    return APIResponse.error(
                        message=f"{BLOG_ERRORS['blog_export_too_large']} (تعداد: {total_count}, حد مجاز: {max_export_items})",
                        status_code=status.HTTP_400_BAD_REQUEST
                    )
            
            # Export
            if export_format == 'pdf':
                response = BlogPDFListExportService.export_blogs_pdf(queryset)
            else:
                response = BlogExcelExportService.export_blogs(queryset)
            
            self._add_cors_headers(response, request)
            return response
            
        except ImportError:
            return APIResponse.error(
                message=BLOG_ERRORS["blog_export_failed"],
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        except Exception as e:
            import traceback
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Export Error: {e}\n{traceback.format_exc()}")
            return APIResponse.error(
                message=BLOG_ERRORS["blog_export_failed"],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

