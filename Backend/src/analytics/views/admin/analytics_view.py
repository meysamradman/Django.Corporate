from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.decorators import action
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import timedelta

from src.core.responses.response import APIResponse
from src.analytics.models import DailyStats, PageView
from src.analytics.messages import ANALYTICS_SUCCESS, ANALYTICS_ERRORS
from src.user.access_control import analytics_permission
from src.analytics.utils.cache import AnalyticsCacheKeys, AnalyticsCacheManager
from src.analytics.utils.cache_shared import should_bypass_cache

class PageViewsAnalyticsView(APIView):
    permission_classes = [analytics_permission]
    
    def get(self, request):
        from src.analytics.services.stats import WebsiteTrafficService
        
        site_id = request.query_params.get('site_id', 'default')
        use_cache = not should_bypass_cache(request)
        data = WebsiteTrafficService.get_dashboard_stats_data(site_id=site_id, use_cache=use_cache)
        
        return APIResponse.success(
            message=ANALYTICS_SUCCESS['stats_retrieved'],
            data=data,
            status_code=status.HTTP_200_OK
        )

class MonthlyStatsAnalyticsView(APIView):
    permission_classes = [analytics_permission]
    
    def get(self, request):
        from src.analytics.services.stats import WebsiteTrafficService

        use_cache = not should_bypass_cache(request)
        data = WebsiteTrafficService.get_monthly_stats_data(use_cache=use_cache)
        
        return APIResponse.success(
            message=ANALYTICS_SUCCESS['stats_retrieved'],
            data=data,
            status_code=status.HTTP_200_OK
        )

class ClearAnalyticsView(APIView):
    permission_classes = [analytics_permission]
    
    def post(self, request):
        period = request.data.get('period', 'all')
        
        try:
            deleted_count = 0
            deleted_daily_stats = 0
            
            if period == 'all':
                deleted_count, _ = PageView.objects.all().delete()
                deleted_daily_stats, _ = DailyStats.objects.all().delete()
                
            elif period == '6months':
                cutoff_date = timezone.now().date() - timedelta(days=180)
                deleted_count, _ = PageView.objects.filter(date__lt=cutoff_date).delete()
                deleted_daily_stats, _ = DailyStats.objects.filter(date__lt=cutoff_date).delete()
                
            elif period == 'custom':
                days = request.data.get('days', 180)
                if not isinstance(days, int) or days < 1:
                    return APIResponse.error(
                        message=ANALYTICS_ERRORS.get('invalid_date_range', 'بازه زمانی نامعتبر است'),
                        status_code=status.HTTP_400_BAD_REQUEST
                    )
                
                cutoff_date = timezone.now().date() - timedelta(days=days)
                deleted_count, _ = PageView.objects.filter(date__lt=cutoff_date).delete()
                deleted_daily_stats, _ = DailyStats.objects.filter(date__lt=cutoff_date).delete()
            else:
                return APIResponse.error(
                    message=ANALYTICS_ERRORS.get('invalid_date_range', 'بازه زمانی نامعتبر است'),
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            AnalyticsCacheManager.invalidate_all_traffic_dashboards()
            AnalyticsCacheManager.invalidate_monthly_stats()
            AnalyticsCacheManager.invalidate_content_trend()
            AnalyticsCacheManager.invalidate_all()
            
            return APIResponse.success(
                message=f'با موفقیت {deleted_count} بازدید و {deleted_daily_stats} آمار روزانه پاک شد',
                data={
                    'deleted_page_views': deleted_count,
                    'deleted_daily_stats': deleted_daily_stats,
                    'period': period
                },
                status_code=status.HTTP_200_OK
            )
            
        except Exception as e:
            return APIResponse.error(
                message=ANALYTICS_ERRORS.get('tracking_failed', 'خطا در پاک کردن بازدیدها'),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )