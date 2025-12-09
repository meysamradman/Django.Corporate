from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views.admin.analytics_view import PageViewsAnalyticsView, MonthlyStatsAnalyticsView, ClearAnalyticsView
from .views.admin.stats_view import AdminStatsViewSet

router = DefaultRouter()
router.register(r'admin/stats', AdminStatsViewSet, basename='admin-stats')

urlpatterns = [
    # Analytics - Page Views & Tracking
    path('admin/page-views/', PageViewsAnalyticsView.as_view(), name='admin-analytics-page-views'),
    path('admin/monthly-stats/', MonthlyStatsAnalyticsView.as_view(), name='admin-analytics-monthly-stats'),
    path('admin/clear/', ClearAnalyticsView.as_view(), name='admin-analytics-clear'),
    
    # Stats - System Statistics (Dashboard)
    path('', include(router.urls)),
]