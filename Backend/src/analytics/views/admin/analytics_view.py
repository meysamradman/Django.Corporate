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


class PageViewsAnalyticsView(APIView):
    permission_classes = [analytics_permission]
    
    def get(self, request):
        from src.analytics.services.stats import WebsiteTrafficService
        
        site_id = request.query_params.get('site_id', 'default')
        cache_key = f'analytics:dashboard:{site_id}'
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
        cache_key = 'analytics:monthly_stats'
        data = cache.get(cache_key)
        
        if not data:
            from datetime import datetime
            from calendar import monthrange
            
            # Get last 6 months
            now = timezone.now()
            monthly_data = []
            
            for i in range(5, -1, -1):
                # Calculate month start and end
                target_date = now - timedelta(days=30 * i)
                month_start = target_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                
                # Calculate month end
                last_day = monthrange(month_start.year, month_start.month)[1]
                month_end = month_start.replace(day=last_day, hour=23, minute=59, second=59)
                
                # Get stats for this month
                month_stats = DailyStats.objects.filter(
                    date__gte=month_start.date(),
                    date__lte=month_end.date()
                ).aggregate(
                    desktop=Sum('desktop_visits'),
                    mobile=Sum('mobile_visits'),
                )
                
                # Get Persian (Jalali) month name
                # Simple conversion: Gregorian month to approximate Jalali month
                # Note: This is approximate, for accurate conversion use jdatetime library
                gregorian_month = month_start.month
                gregorian_year = month_start.year
                
                # Approximate Jalali month (Gregorian month + ~2 months offset)
                # This is a simple approximation, not 100% accurate
                approximate_jalali_month = ((gregorian_month + 1) % 12) + 1
                
                persian_month_names = [
                    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
                    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
                ]
                
                # Use approximate month (better than English names)
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
            
            cache.delete('analytics:dashboard')
            cache.delete('analytics:monthly_stats')
            
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