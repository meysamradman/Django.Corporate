from django.db.models import Sum, Q, Avg
from django.utils import timezone
from datetime import timedelta
from src.analytics.models import DailyStats, PageView

class WebsiteTrafficService:
    @classmethod
    def get_dashboard_stats(cls, site_id='default'):
        """
        ارائه آمار کامل ترافیک سایت با قابلیت مقایسه و تحلیل روندها
        """
        today = timezone.now().date()
        yesterday = today - timedelta(days=1)
        last_30_days = today - timedelta(days=30)
        prev_30_days = today - timedelta(days=60)
        
        # 1. Today's Real-time Stats (from raw PageView)
        today_total = PageView.objects.filter(date=today, site_id=site_id).count()
        today_unique = PageView.objects.filter(date=today, site_id=site_id).values('session_id').distinct().count()
        
        # 2. Yesterday's Stats (from DailyStats - Fast)
        yesterday_stats = DailyStats.objects.filter(date=yesterday, site_id=site_id).first()
        y_total = yesterday_stats.total_visits if yesterday_stats else 0
        
        # 3. Trends (%)
        today_trend = cls._calculate_trend(today_total, y_total)
        
        # 4. Last 30 Days (from DailyStats - Fast)
        stats_30 = DailyStats.objects.filter(
            date__range=[last_30_days, yesterday], 
            site_id=site_id
        ).aggregate(
            total=Sum('total_visits'),
            unique=Sum('unique_visitors'),
            desktop=Sum('desktop_visits'),
            mobile=Sum('mobile_visits'),
            tablet=Sum('tablet_visits')
        )
        
        total_30 = (stats_30['total'] or 0) + today_total
        unique_30 = (stats_30['unique'] or 0) + today_unique
        
        # 5. This Month vs Last Month
        this_month_start = today.replace(day=1)
        prev_month_end = this_month_start - timedelta(days=1)
        prev_month_start = prev_month_end.replace(day=1)
        
        this_month_total = DailyStats.objects.filter(
            date__gte=this_month_start, site_id=site_id
        ).aggregate(total=Sum('total_visits'))['total'] or 0
        this_month_total += today_total
        
        prev_month_total = DailyStats.objects.filter(
            date__range=[prev_month_start, prev_month_end], site_id=site_id
        ).aggregate(total=Sum('total_visits'))['total'] or 0
        
        month_trend = cls._calculate_trend(this_month_total, prev_month_total)
        
        # 6. Last 6 Months Trend (Device distribution)
        monthly_trend = []
        for i in range(6):
            m_end = today - timedelta(days=30 * i)
            m_start = today - timedelta(days=30 * (i+1))
            m_stats = DailyStats.objects.filter(
                date__range=[m_start, m_end], site_id=site_id
            ).aggregate(d=Sum('desktop_visits'), m=Sum('mobile_visits'))
            
            monthly_trend.append({
                'label': m_start.strftime('%b'), # e.g. 'Jan'
                'desktop': m_stats['d'] or 0,
                'mobile': m_stats['m'] or 0,
            })

        # 7. Top Data (Source, Country, Page)
        recent_daily = DailyStats.objects.filter(site_id=site_id).first()
        source_dist = recent_daily.sources_distribution if recent_daily else {}
        top_pages = recent_daily.top_pages if recent_daily else {}
        top_countries = recent_daily.top_countries if recent_daily else {}

        return {
            'today': {
                'total': today_total,
                'unique': today_unique,
                'trend': today_trend,
            },
            'last_30_days': {
                'total': total_30,
                'unique': unique_30,
            },
            'this_month': {
                'total': this_month_total,
                'trend': month_trend
            },
            'source_distribution': source_dist,
            'device_distribution': {
                'desktop': stats_30['desktop'] or 0,
                'mobile': stats_30['mobile'] or 0,
                'tablet': stats_30['tablet'] or 0,
            },
            'monthly_trend': monthly_trend[::-1],
            'top_pages': sorted(top_pages.items(), key=lambda x: x[1], reverse=True)[:10],
            'top_countries': sorted(top_countries.items(), key=lambda x: x[1], reverse=True)[:10],
        }

    @staticmethod
    def _calculate_trend(current, previous):
        if not previous or previous == 0:
            return 100 if current > 0 else 0
        return ((current - previous) / previous) * 100
