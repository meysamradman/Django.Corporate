from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api-auth/', include('rest_framework.urls')),
    path('api/core/', include('src.core.urls', namespace='core')),
    path('api/', include('src.user.urls')),
    path('api/', include('src.media.urls')),
    path('api/', include('src.statistics.urls')),
    path('api/', include('src.panel.urls')),
    # path('api/', include('src.blog.urls')),
    path('api/', include('src.portfolio.urls')),
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

admin.site.site_header = 'Webtalik Admin'
admin.site.site_title = 'Webtalik'

