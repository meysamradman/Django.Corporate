from django.db.models import Sum, Avg, F
from django.utils import timezone
from datetime import timedelta
from src.real_estate.models.statistics import (
    PropertyTypeStatistics, ListingTypeStatistics, RegionalStatistics, PropertyStatistics
)

class MarketAnalysisService:
    @classmethod
    def get_market_sentiment(cls):
        
        today = timezone.now().date()
        last_30_days = today - timedelta(days=30)
        
        type_stats = PropertyTypeStatistics.objects.filter(
            date__gte=last_30_days
        ).values('property_type__title').annotate(
            total_views=Sum('views'),
            total_leads=Sum('inquiries')
        ).order_by('-total_views')
        
        state_stats = ListingTypeStatistics.objects.filter(
            date__gte=last_30_days
        ).values('state__title').annotate(
            total_views=Sum('views'),
            total_leads=Sum('inquiries')
        )
        
        hot_regions = RegionalStatistics.objects.filter(
            date__gte=last_30_days
        ).values('province__name', 'city__name', 'region__code').annotate(
            total_views=Sum('views')
        ).order_by('-total_views')[:5]
        
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
        
        today = timezone.now().date()
        
        latest = RegionalStatistics.objects.filter(
            province_id=province_id,
            city_id=city_id,
            region_id=region_id
        ).order_by('-date').first()
        
        if not latest:
            return None
            
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
