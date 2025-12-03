from django.urls import path, include
from rest_framework.routers import DefaultRouter
from src.media import views

router = DefaultRouter()
router.register(r'admin/media', views.MediaAdminViewSet, basename='admin-media')
router.register(r'media', views.MediaPublicViewSet, basename='public-media')

urlpatterns = [
    path('', include(router.urls)),
    path('admin/media/bulk-delete', views.MediaAdminViewSet.as_view({'post': 'bulk_delete'})),
    path('admin/media/<int:pk>', views.MediaAdminViewSet.as_view({
        'get': 'retrieve',
        'put': 'update',
        'patch': 'partial_update',
        'delete': 'destroy'
    })),
]