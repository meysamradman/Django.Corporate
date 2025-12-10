from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.renderers import JSONRenderer
from django.core.cache import cache
from django.db.models import Q
from django.http import HttpResponse
from django.conf import settings
from src.portfolio.models.portfolio import Portfolio
from src.portfolio.services.admin.excel_export_service import PortfolioExcelExportService
from src.portfolio.services.admin.pdf_list_export_service import PortfolioPDFListExportService
from src.portfolio.filters.admin.portfolio_filters import PortfolioAdminFilter
from src.core.responses.response import APIResponse
from src.user.access_control import portfolio_permission
from src.user.auth.admin_session_auth import CSRFExemptSessionAuthentication
from src.portfolio.messages.messages import PORTFOLIO_ERRORS


class PortfolioExportView(APIView):
    authentication_classes = [CSRFExemptSessionAuthentication]
    # ✅ استفاده از permission instance - بدون lambda
    permission_classes = [portfolio_permission]
    format_suffix_kwarg = None
    
    def options(self, request, *args, **kwargs):
        response = Response()
        self._add_cors_headers(response, request)
        response['Access-Control-Max-Age'] = '86400'
        return response
    
    def _add_cors_headers(self, response, request):
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
            export_rate_limit = settings.PORTFOLIO_EXPORT_RATE_LIMIT
            export_rate_window = settings.PORTFOLIO_EXPORT_RATE_LIMIT_WINDOW
            cache_key = f"portfolio_export_limit_{request.user.id}"
            export_count = cache.get(cache_key, 0)
            if export_count >= export_rate_limit:
                return APIResponse.error(
                    message=PORTFOLIO_ERRORS["portfolio_export_limit_exceeded"],
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS
                )
            cache.set(cache_key, export_count + 1, export_rate_window)
        
        try:
            queryset = Portfolio.objects.prefetch_related(
                'categories', 'tags', 'options',
                'images__image',
                'videos__video', 'videos__video__cover_image',
                'audios__audio', 'audios__audio__cover_image',
                'documents__document', 'documents__document__cover_image',
            ).select_related('og_image')
            
            queryset = PortfolioAdminFilter(query_params, queryset=queryset).qs
            
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
                max_export_items = settings.PORTFOLIO_EXPORT_MAX_ITEMS
                total_count = queryset.count()
                if total_count > max_export_items:
                    return APIResponse.error(
                        message=PORTFOLIO_ERRORS['portfolio_export_too_large'],
                        status_code=status.HTTP_400_BAD_REQUEST
                    )
            
            if export_format == 'pdf':
                response = PortfolioPDFListExportService.export_portfolios_pdf(queryset)
            else:
                response = PortfolioExcelExportService.export_portfolios(queryset)
            
            self._add_cors_headers(response, request)
            return response
            
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

