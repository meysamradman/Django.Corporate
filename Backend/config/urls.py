from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView
from src.portfolio.views.admin.portfolio_export_view import PortfolioExportView
from src.blog.views.admin.blog_export_view import BlogExportView
from src.real_estate.views.admin.property_export_view import PropertyExportView

urlpatterns = [
    path('api-auth/', include('rest_framework.urls')),
    path('api/core/', include('src.core.urls', namespace='core')),
    path('api/', include('src.user.urls')),
    path('api/', include('src.media.urls')),
    path('api/', include('src.panel.urls')),
    path('api/', include('src.settings.urls')),
    path('api/', include('src.analytics.urls')),
    path('api/', include('src.ai.urls')),
    path('api/', include('src.chatbot.urls')),
    path('api/', include('src.ticket.urls')),
    path('api/', include('src.email.urls')),
    path('api/', include('src.page.urls')),
    path('api/', include('src.form.urls')),
    path('api/', include('src.blog.urls')),
    path('api/', include('src.portfolio.urls')),
    path('api/', include('src.real_estate.urls')),
    # Export views (also feature flag controlled via middleware)
    path('api/admin/blog/export/', BlogExportView.as_view(), name='admin-blog-export'),
    path('api/admin/blog/export', BlogExportView.as_view(), name='admin-blog-export-no-slash'),
    path('api/admin/portfolio/export/', PortfolioExportView.as_view(), name='admin-portfolio-export'),
    path('api/admin/portfolio/export', PortfolioExportView.as_view(), name='admin-portfolio-export-no-slash'),
    path('api/admin/property/export/', PropertyExportView.as_view(), name='admin-property-export'),
    path('api/admin/property/export', PropertyExportView.as_view(), name='admin-property-export-no-slash'),
    # ========================================
    # API Documentation
    # ========================================
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/schema/swagger-ui/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/schema/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),



] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

if settings.DEBUG:

    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    try:
        urlpatterns.append(path('silk/', include('silk.urls', namespace='silk')))
    except ImportError:
        pass