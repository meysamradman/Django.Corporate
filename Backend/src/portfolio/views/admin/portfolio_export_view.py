from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.core.cache import cache
from django.db.models import Q
from django.http import HttpResponse
from src.portfolio.models.portfolio import Portfolio
from src.portfolio.services.admin.excel_export_service import PortfolioExcelExportService
from src.portfolio.services.admin.pdf_export_service import PortfolioPDFExportService
from src.portfolio.services.admin.pdf_list_export_service import PortfolioPDFListExportService
from src.portfolio.filters.admin.portfolio_filters import PortfolioAdminFilter
from src.core.responses.response import APIResponse
from src.user.authorization.admin_permission import ContentManagerAccess
from src.user.auth.admin_session_auth import CSRFExemptSessionAuthentication
from src.portfolio.messages.messages import PORTFOLIO_ERRORS


class PortfolioExportView(APIView):
    """View for exporting portfolios to Excel or PDF"""
    # Use only CSRFExemptSessionAuthentication - override default authentication
    authentication_classes = [CSRFExemptSessionAuthentication]
    permission_classes = [ContentManagerAccess]
    # Disable format suffix negotiation for export endpoints (we handle format via query params)
    format_suffix_kwarg = None
    
    def options(self, request, *args, **kwargs):
        """Handle CORS preflight requests"""
        from rest_framework.response import Response
        response = Response()
        self._add_cors_headers(response, request)
        response['Access-Control-Max-Age'] = '86400'
        return response
    
    def _add_cors_headers(self, response, request):
        """Add CORS headers based on settings - same as Excel (which works)"""
        from django.conf import settings
        
        origin = request.META.get('HTTP_ORIGIN', '')
        allowed_origins = getattr(settings, 'CORS_ALLOWED_ORIGINS', [])
        
        if origin and origin in allowed_origins:
            response['Access-Control-Allow-Origin'] = origin
        
        if getattr(settings, 'CORS_ALLOW_CREDENTIALS', False):
            response['Access-Control-Allow-Credentials'] = 'true'
        
        allowed_methods = getattr(settings, 'CORS_ALLOW_METHODS', ['GET', 'OPTIONS'])
        if allowed_methods:
            if isinstance(allowed_methods, (list, tuple)):
                response['Access-Control-Allow-Methods'] = ', '.join(str(m) for m in allowed_methods)
            else:
                response['Access-Control-Allow-Methods'] = str(allowed_methods)
        
        allowed_headers = getattr(settings, 'CORS_ALLOW_HEADERS', [])
        if allowed_headers:
            if isinstance(allowed_headers, (list, tuple)):
                response['Access-Control-Allow-Headers'] = ', '.join(str(h) for h in allowed_headers)
            else:
                response['Access-Control-Allow-Headers'] = str(allowed_headers)
    
    def perform_content_negotiation(self, request, force=False):
        """Override to skip content negotiation for export endpoints"""
        # Skip content negotiation - we return binary files, not JSON/XML
        # Return default renderer and accepted media type
        from rest_framework.renderers import JSONRenderer
        renderer = JSONRenderer()  # Dummy renderer, won't be used
        return (renderer, renderer.media_type)
    
    def perform_authentication(self, request):
        """Override to add logging"""
        print("[AUTH DEBUG] PortfolioExportView.perform_authentication() called")
        print(f"[AUTH DEBUG] Authentication classes: {self.authentication_classes}")
        result = super().perform_authentication(request)
        print(f"[AUTH DEBUG] After authentication - User: {getattr(request, 'user', 'None')}, Authenticated: {getattr(request.user, 'is_authenticated', False) if hasattr(request, 'user') else False}")
        return result
    
    def check_permissions(self, request):
        """Override to add logging"""
        print("[PERMISSION DEBUG] PortfolioExportView.check_permissions() called")
        print(f"[PERMISSION DEBUG] Permission classes: {self.permission_classes}")
        print(f"[PERMISSION DEBUG] Before check - User: {getattr(request, 'user', 'None')}, Authenticated: {getattr(request.user, 'is_authenticated', False) if hasattr(request, 'user') else False}")
        result = super().check_permissions(request)
        print("[PERMISSION DEBUG] Permission check passed!")
        return result
    
    def initial(self, request, *args, **kwargs):
        """Override to add logging"""
        print("[INITIAL DEBUG] PortfolioExportView.initial() called")
        print(f"[INITIAL DEBUG] Before initial - User: {getattr(request, 'user', 'None')}")
        try:
            result = super().initial(request, *args, **kwargs)
            print(f"[INITIAL DEBUG] After initial - User: {getattr(request, 'user', 'None')}, Authenticated: {getattr(request.user, 'is_authenticated', False) if hasattr(request, 'user') else False}")
            return result
        except Exception as e:
            print(f"[INITIAL ERROR] Exception in initial: {type(e).__name__}: {e}")
            import traceback
            print(traceback.format_exc())
            raise
    
    def dispatch(self, request, *args, **kwargs):
        """Override dispatch to add logging and ensure CORS headers"""
        print("=" * 80)
        print("DEBUG: PortfolioExportView.dispatch() called!")
        print(f"  Path: {request.path}")
        print(f"  Method: {request.method}")
        # Use GET for WSGIRequest, query_params will be available after DRF processing
        query_params = getattr(request, 'query_params', request.GET)
        print(f"  Query Params: {dict(query_params)}")
        print(f"  User: {getattr(request, 'user', 'No user')}")
        print(f"  Authenticated: {getattr(request.user, 'is_authenticated', False) if hasattr(request, 'user') else False}")
        print(f"  Session ID: {request.COOKIES.get('sessionid', 'None')}")
        print("=" * 80)
        try:
            result = super().dispatch(request, *args, **kwargs)
            print(f"[DISPATCH RESULT] Response status: {getattr(result, 'status_code', 'N/A')}")
            
            return result
        except Exception as e:
            print(f"[DISPATCH ERROR] Exception in dispatch: {type(e).__name__}: {e}")
            import traceback
            print(traceback.format_exc())
            raise
    
    def get(self, request):
        """Export portfolios to Excel or PDF with all filters applied"""
        print("=" * 80)
        print("DEBUG: PortfolioExportView.get() called successfully!")
        print(f"  Path: {request.path}")
        print(f"  Query Params: {dict(request.query_params)}")
        print(f"  User: {getattr(request, 'user', 'No user')}")
        print("=" * 80)
        # Use request.query_params for DRF Request
        query_params = request.query_params
        
        export_format = query_params.get('format', 'excel').lower()
        
        # Rate limiting - skip for super admin
        cache_key = f"portfolio_export_limit_{request.user.id}"
        export_count = cache.get(cache_key, 0)
        
        print(f"[RATE LIMIT DEBUG] User {request.user.id}, Export count: {export_count}, is_admin_full: {getattr(request.user, 'is_admin_full', False)}")
        
        # Skip rate limit for super admin
        if not getattr(request.user, 'is_admin_full', False) and export_count >= 5:
            print(f"[RATE LIMIT DEBUG] Rate limit exceeded for user {request.user.id}")
            return APIResponse.error(
                message=PORTFOLIO_ERRORS["portfolio_export_limit_exceeded"],
                status_code=status.HTTP_429_TOO_MANY_REQUESTS
            )
        
        # Increment rate limit counter only if not super admin
        if not getattr(request.user, 'is_admin_full', False):
            cache.set(cache_key, export_count + 1, 3600)
            print(f"[RATE LIMIT DEBUG] Incremented export count for user {request.user.id} to {export_count + 1}")
        else:
            print(f"[RATE LIMIT DEBUG] Skipping rate limit for super admin user {request.user.id}")
        
        try:
            # Build queryset with filters
            queryset = Portfolio.objects.prefetch_related(
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
            
            # Apply filters
            filterset = PortfolioAdminFilter(query_params, queryset=queryset)
            queryset = filterset.qs
            
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
            if order_desc:
                order_by = f'-{order_by}'
            queryset = queryset.order_by(order_by)
            
            # Limit export size
            queryset_count = queryset.count()
            print(f"[EXPORT DEBUG] Queryset count: {queryset_count}, Format: {export_format}")
            if queryset_count > 100:
                return APIResponse.error(
                    message=PORTFOLIO_ERRORS["portfolio_export_too_large"],
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            # Use appropriate export service
            print(f"[EXPORT DEBUG] Calling export service for format: {export_format}")
            if export_format == 'pdf':
                response = PortfolioPDFListExportService.export_portfolios_pdf(queryset)
            else:
                response = PortfolioExcelExportService.export_portfolios(queryset)
            
            # Add CORS headers from settings (secure and optimized)
            print(f"[CORS DEBUG] Adding CORS headers to response")
            self._add_cors_headers(response, request)
            print(f"[CORS DEBUG] CORS headers added. Response headers: {dict(response.items())}")
            
            return response
        except ImportError as e:
            return APIResponse.error(
                message=str(e),
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        except Exception as e:
            import traceback
            error_message = str(e)
            error_traceback = traceback.format_exc()
            print(f"Export Error: {error_message}")
            print(f"Traceback: {error_traceback}")
            return APIResponse.error(
                message=PORTFOLIO_ERRORS["portfolio_export_failed"],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

