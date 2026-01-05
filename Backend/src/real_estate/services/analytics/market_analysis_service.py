from django.db.models import Sum, Avg, F
from django.utils import timezone
from datetime import timedelta
from src.real_estate.models.statistics import (
    PropertyTypeStatistics, PropertyStateStatistics, RegionalStatistics, PropertyStatistics
)

class MarketAnalysisService:
    @classmethod
    def get_market_sentiment(cls):
        """
        تحلیل کلی وضعیت بازار (Market Sentiment)
        """
        today = timezone.now().date()
        last_30_days = today - timedelta(days=30)
        
        # 1. Demand by Type (Which property types are people looking for?)
        type_stats = PropertyTypeStatistics.objects.filter(
            date__gte=last_30_days
        ).values('property_type__title').annotate(
            total_views=Sum('views'),
            total_leads=Sum('inquiries')
        ).order_by('-total_views')
        
        # 2. Market Split (Sale vs Rent demand)
        state_stats = PropertyStateStatistics.objects.filter(
            date__gte=last_30_days
        ).values('state__title').annotate(
            total_views=Sum('views'),
            total_leads=Sum('inquiries')
        )
        
        # 3. Hot Regions (Top 5 regions by views)
        hot_regions = RegionalStatistics.objects.filter(
            date__gte=last_30_days
        ).values('province__name', 'city__name', 'region__code').annotate(
            total_views=Sum('views')
        ).order_by('-total_views')[:5]
        
        # 4. Supply vs Demand (Lead-to-View ratio)
        overall = PropertyStatistics.objects.filter(
            date__gte=last_30_days
        ).aggregate(
            v=Sum('views'),
            l=Sum('inquiries')
        )
        conversion_rate = (overall['l'] / overall['v'] * 100) if overall['v'] and overall['v'] > 0 else 0

        return {
            'demand_by_type': list(type_stats),
            'market_split': list(state_stats),
            'hot_regions': list(hot_regions),
            'market_conversion_rate': round(conversion_rate, 2),
            'timeframe': 'Last 30 Days'
        }

    @classmethod
    def get_regional_report(cls, province_id, city_id, region_id=None):
        """
        گزارش تخصصی برای یک منطقه خاص (قیمت، اجاره و میزان تقاضا)
        """
        today = timezone.now().date()
        
        # Latest snapshot
        latest = RegionalStatistics.objects.filter(
            province_id=province_id,
            city_id=city_id,
            region_id=region_id
        ).order_by('-date').first()
        
        if not latest:
            return None
            
        # 6-month price trend
        six_months_ago = today - timedelta(days=180)
        trend = RegionalStatistics.objects.filter(
            province_id=province_id,
            city_id=city_id,
            region_id=region_id,
            date__gte=six_months_ago
        ).order_by('date').values('date', 'avg_price_sale', 'avg_rent_monthly')
        
        return {
            'current': {
                'avg_sale': latest.avg_price_sale,
                'avg_rent': latest.avg_rent_monthly,
                'listings': latest.total_active_listings,
                'views': latest.views
            },
            'price_trend': list(trend)
        }
