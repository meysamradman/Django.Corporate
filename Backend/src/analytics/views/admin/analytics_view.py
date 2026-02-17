from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.decorators import action
from django.core.cache import cache
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import timedelta

from src.core.responses.response import APIResponse
from src.analytics.models import DailyStats, PageView
from src.analytics.messages import ANALYTICS_SUCCESS, ANALYTICS_ERRORS
from src.user.access_control import analytics_permission
from src.analytics.utils.cache import AnalyticsCacheKeys, AnalyticsCacheManager

class PageViewsAnalyticsView(APIView):
    permission_classes = [analytics_permission]
    
    def get(self, request):
        from src.analytics.services.stats import WebsiteTrafficService
        
        site_id = request.query_params.get('site_id', 'default')
        cache_key = AnalyticsCacheKeys.traffic_dashboard(site_id)
        data = cache.get(cache_key)
        
        if not data:
            data = WebsiteTrafficService.get_dashboard_stats(site_id=site_id)
            cache.set(cache_key, data, timeout=300)
        
        return APIResponse.success(
            message=ANALYTICS_SUCCESS['stats_retrieved'],
            data=data,
            status_code=status.HTTP_200_OK
        )

class MonthlyStatsAnalyticsView(APIView):
    permission_classes = [analytics_permission]
    
    def get(self, request):
        cache_key = AnalyticsCacheKeys.monthly_stats()
        data = cache.get(cache_key)
        
        if not data:
            from datetime import datetime
            from calendar import monthrange
            
            now = timezone.now()
            monthly_data = []
            
            for i in range(5, -1, -1):
                target_date = now - timedelta(days=30 * i)
                month_start = target_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                
                last_day = monthrange(month_start.year, month_start.month)[1]
                month_end = month_start.replace(day=last_day, hour=23, minute=59, second=59)
                
                month_stats = DailyStats.objects.filter(
                    date__gte=month_start.date(),
                    date__lte=month_end.date()
                ).aggregate(
                    desktop=Sum('desktop_visits'),
                    mobile=Sum('mobile_visits'),
                )
                
                gregorian_month = month_start.month
                gregorian_year = month_start.year
                
                approximate_jalali_month = ((gregorian_month + 1) % 12) + 1
                
                persian_month_names = [
                    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
                    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
                ]
                
                month_name = persian_month_names[approximate_jalali_month - 1] if 1 <= approximate_jalali_month <= 12 else 'نامشخص'
                
                monthly_data.append({
                    'month': month_name,
                    'desktop': month_stats['desktop'] or 0,
                    'mobile': month_stats['mobile'] or 0,
                })
            
            data = {
                'monthly_stats': monthly_data
            }
            
            cache.set(cache_key, data, timeout=600)  # Cache for 10 minutes
        
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