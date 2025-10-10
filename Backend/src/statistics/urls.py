from django.urls import include, path
from rest_framework.routers import DefaultRouter
from src.statistics.views import AdminStatisticsViewSet

router = DefaultRouter()
router.register(r'admin/statistics', AdminStatisticsViewSet, basename='admin-statistics')

urlpatterns = [
    path('', include(router.urls)),
]


