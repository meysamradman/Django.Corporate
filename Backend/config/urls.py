from django.conf import settings
from django.conf.urls.static import static
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

from src.portfolio.views.admin.portfolio_export_view import PortfolioExportView
from src.blog.views.admin.blog_export_view import BlogExportView

urlpatterns = [
    path('api-auth/', include('rest_framework.urls')),
    path('api/core/', include('src.core.urls', namespace='core')),
    path('api/', include('src.user.urls')),
    path('api/', include('src.media.urls')),
    path('api/', include('src.ai.urls')),
    path('api/email/', include('src.email.urls')),
    path('api/settings/', include('src.settings.urls')),
    path('api/', include('src.page.urls')),
    path('api/', include('src.form.urls')),
    path('api/', include('src.statistics.urls')),
    path('api/', include('src.panel.urls')),
    path('api/', include('src.blog.urls')),
    path('api/admin/blog/export/', BlogExportView.as_view(), name='admin-blog-export'),
    path('api/admin/blog/export', BlogExportView.as_view(), name='admin-blog-export-no-slash'),
    path('api/', include('src.portfolio.urls')),
    path('api/admin/portfolio/export/', PortfolioExportView.as_view(), name='admin-portfolio-export'),
    path('api/admin/portfolio/export', PortfolioExportView.as_view(), name='admin-portfolio-export-no-slash'),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/schema/swagger-ui/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/schema/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    # Debug toolbar
    try:
        import debug_toolbar
        urlpatterns.append(path('__debug__/', include('debug_toolbar.urls')))
    except ImportError:
        pass