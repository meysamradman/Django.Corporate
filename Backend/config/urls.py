from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView
from src.core.feature_flags.urls_utils import feature_urls, feature_path

# ========================================
# CORPORATE APPS - Can be commented out if not needed
# ========================================
from src.portfolio.views.admin.portfolio_export_view import PortfolioExportView
from src.blog.views.admin.blog_export_view import BlogExportView

urlpatterns = [
    # ========================================
    # Django Admin
    # ========================================
    path('admin/', admin.site.urls),
    
    # ========================================
    # CORE APPS - Always required
    # ========================================
    path('api-auth/', include('rest_framework.urls')),
    path('api/core/', include('src.core.urls', namespace='core')),
    path('api/', include('src.user.urls')),
    path('api/', include('src.media.urls')),
    path('api/', include('src.panel.urls')),
    path('api/settings/', include('src.settings.urls')),
    path('api/analytics/', include('src.analytics.urls')),  # Analytics
    
    # ========================================
    # CORPORATE APPS - Feature Flag Controlled
    # ========================================
    *feature_urls('ai', 'api/', 'src.ai.urls'),
    *feature_urls('chatbot', 'api/', 'src.chatbot.urls'),
    *feature_urls('ticket', 'api/', 'src.ticket.urls'),
    *feature_urls('email', 'api/email/', 'src.email.urls'),
    *feature_urls('page', 'api/', 'src.page.urls'),
    *feature_urls('form', 'api/', 'src.form.urls'),
    *feature_urls('blog', 'api/', 'src.blog.urls'),
    *feature_urls('portfolio', 'api/', 'src.portfolio.urls'),
    
    # Export views (also feature flag controlled)
    *feature_path('blog', 'api/admin/blog/export/', BlogExportView, name='admin-blog-export'),
    *feature_path('blog', 'api/admin/blog/export', BlogExportView, name='admin-blog-export-no-slash'),
    *feature_path('portfolio', 'api/admin/portfolio/export/', PortfolioExportView, name='admin-portfolio-export'),
    *feature_path('portfolio', 'api/admin/portfolio/export', PortfolioExportView, name='admin-portfolio-export-no-slash'),
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
    # Silk profiling
    try:
        urlpatterns.append(path('silk/', include('silk.urls', namespace='silk')))
    except ImportError:
        pass