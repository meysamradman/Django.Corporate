from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

from src.portfolio.views.admin.portfolio_export_view import PortfolioExportView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api-auth/', include('rest_framework.urls')),
    path('api/core/', include('src.core.urls', namespace='core')),
    path('api/', include('src.user.urls')),
    path('api/', include('src.media.urls')),
    path('api/', include('src.ai.urls')),
    path('api/', include('src.statistics.urls')),
    path('api/', include('src.panel.urls')),
    # path('api/', include('src.blog.urls')),
    # Portfolio export endpoint - CRITICAL: Must be before portfolio.urls include
    # This is more specific than the generic 'api/' prefix, so it will match first
    path('api/admin/portfolio/export/', PortfolioExportView.as_view(), name='admin-portfolio-export'),
    path('api/admin/portfolio/export', PortfolioExportView.as_view(), name='admin-portfolio-export-no-slash'),
    # Portfolio URLs - include after export endpoint to avoid conflicts
    path('api/', include('src.portfolio.urls')),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/schema/swagger-ui/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/schema/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Debug: Print all URL patterns for export
if settings.DEBUG:
    print("=" * 80)
    print("DEBUG: Main URL Patterns (export related):")
    for pattern in urlpatterns:
        if 'export' in str(pattern.pattern):
            print(f"  {pattern.pattern} -> {pattern.callback if hasattr(pattern, 'callback') else 'N/A'}")
    print("=" * 80)

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    # Debug toolbar
    try:
        import debug_toolbar
        urlpatterns.append(path('__debug__/', include('debug_toolbar.urls')))
    except ImportError:
        pass

admin.site.site_header = 'Webtalik Admin'
admin.site.site_title = 'Webtalik'