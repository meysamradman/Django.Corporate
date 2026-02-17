from django.core.cache import cache
from django.utils import timezone
from django.db.models import Count, Q, Sum
from datetime import timedelta

from src.real_estate.models.property import Property
from src.real_estate.models.type import PropertyType
from src.real_estate.models.state import PropertyState
from src.real_estate.models.label import PropertyLabel
from src.real_estate.models.feature import PropertyFeature
from src.real_estate.models.tag import PropertyTag
from src.real_estate.models.agent import PropertyAgent
from src.real_estate.models.agency import RealEstateAgency
from src.real_estate.models.statistics import PropertyStatistics, AgentStatistics
from src.real_estate.utils.cache import PropertyCacheKeys

class PropertyStatisticsService:
    CACHE_TIMEOUT = 600
    
    @classmethod
    def get_statistics(cls):
        cache_key = PropertyCacheKeys.statistics()
        cached_stats = cache.get(cache_key)
        if cached_stats is not None:
            return cached_stats
        
        stats = {
            'generated_at': timezone.now().isoformat(),
            'properties': cls._get_properties_stats(),
            'types': cls._get_types_stats(),
            'states': cls._get_states_stats(),
            'labels': cls._get_labels_stats(),
            'features': cls._get_features_stats(),
            'tags': cls._get_tags_stats(),
            'agents': cls._get_agents_stats(),
            'agencies': cls._get_agencies_stats(),
            'financials': cls._get_financial_stats(),
            'traffic': cls._get_traffic_stats(),
            'top_agents': cls._get_top_agents(),
        }
        
        cache.set(cache_key, stats, cls.CACHE_TIMEOUT)
        return stats
    
    @staticmethod
    def _get_properties_stats():
        total = Property.objects.count()
        published = Property.objects.filter(is_published=True, is_public=True).count()
        draft = Property.objects.filter(is_published=False).count()
        featured = Property.objects.filter(is_featured=True).count()
        active = Property.objects.filter(is_active=True).count()
        public = Property.objects.filter(is_public=True).count()
        
        return {
            'total': total,
            'published': published,
            'draft': draft,
            'featured': featured,
            'active': active,
            'public': public,
            'published_percentage': round((published / total * 100) if total > 0 else 0, 1),
            'featured_percentage': round((featured / total * 100) if total > 0 else 0, 1),
        }
    
    @staticmethod
    def _get_types_stats():
        types_count = PropertyType.objects.count()
        types_with_properties = PropertyType.objects.filter(properties__isnull=False).distinct().count()
        
        return {
            'total': types_count,
            'with_properties': types_with_properties,
            'without_properties': types_count - types_with_properties,
        }
    
    @staticmethod
    def _get_states_stats():
        states_count = PropertyState.objects.count()
        states_with_properties = PropertyState.objects.filter(properties__isnull=False).distinct().count()
        
        usage_breakdown = list(PropertyState.objects.values('usage_type').annotate(
            count=Count('id'),
            with_properties=Count('properties', distinct=True)
        ))
        
        return {
            'total': states_count,
            'with_properties': states_with_properties,
            'without_properties': states_count - states_with_properties,
            'usage_breakdown': usage_breakdown
        }
    
    @staticmethod
    def _get_labels_stats():
        labels_count = PropertyLabel.objects.count()
        labels_with_properties = PropertyLabel.objects.filter(properties__isnull=False).distinct().count()
        
        return {
            'total': labels_count,
            'with_properties': labels_with_properties,
            'without_properties': labels_count - labels_with_properties,
        }
    
    @staticmethod
    def _get_features_stats():
        features_count = PropertyFeature.objects.count()
        features_with_properties = PropertyFeature.objects.filter(properties__isnull=False).distinct().count()
        
        return {
            'total': features_count,
            'with_properties': features_with_properties,
            'without_properties': features_count - features_with_properties,
        }
    
    @staticmethod
    def _get_tags_stats():
        tags_count = PropertyTag.objects.count()
        tags_with_properties = PropertyTag.objects.filter(properties__isnull=False).distinct().count()
        
        return {
            'total': tags_count,
            'with_properties': tags_with_properties,
            'without_properties': tags_count - tags_with_properties,
        }
    
    @staticmethod
    def _get_agents_stats():
        agents_total = PropertyAgent.objects.count()
        agents_active = PropertyAgent.objects.filter(is_active=True).count()
        agents_verified = PropertyAgent.objects.filter(is_verified=True).count()
        agents_with_properties = PropertyAgent.objects.filter(properties__isnull=False).distinct().count()
        
        return {
            'total': agents_total,
            'active': agents_active,
            'verified': agents_verified,
            'with_properties': agents_with_properties,
            'active_percentage': round((agents_active / agents_total * 100) if agents_total > 0 else 0, 1),
            'verified_percentage': round((agents_verified / agents_total * 100) if agents_total > 0 else 0, 1),
        }
    
    @staticmethod
    def _get_agencies_stats():
        agencies_total = RealEstateAgency.objects.count()
        agencies_active = RealEstateAgency.objects.filter(is_active=True).count()
        agencies_with_properties = RealEstateAgency.objects.filter(properties__isnull=False).distinct().count()
        
        return {
            'total': agencies_total,
            'active': agencies_active,
            'verified': 0,
            'with_properties': agencies_with_properties,
            'active_percentage': round((agencies_active / agencies_total * 100) if agencies_total > 0 else 0, 1),
            'verified_percentage': 0,
        }

    @staticmethod
    def _get_financial_stats():
        
        total_sales = AgentStatistics.objects.aggregate(
            total=Sum('total_sales_value'),
            commissions=Sum('total_commissions'),
            sold_count=Sum('properties_sold')
        )
        
        return {
            'total_sales_value': total_sales['total'] or 0,
            'total_commissions': total_sales['commissions'] or 0,
            'total_sold_properties': total_sales['sold_count'] or 0,
        }

    @staticmethod
    def _get_traffic_stats():
        
        last_30_days = timezone.now().date() - timedelta(days=30)
        
        stats = PropertyStatistics.objects.filter(date__gte=last_30_days).aggregate(
            web=Sum('web_views'),
            app=Sum('app_views'),
            total=Sum('views')
        )
        
        return {
            'web_views': stats['web'] or 0,
            'app_views': stats['app'] or 0,
            'total_views': stats['total'] or 0,
        }

    @staticmethod
    def _get_top_agents():
        
        top_agents = AgentStatistics.objects.values(
            'agent__id', 
            'agent__user__admin_profile__first_name',
            'agent__user__admin_profile__last_name',
            'agent__profile_picture__file',
            'agent__rating'
        ).annotate(
            total_sales=Sum('total_sales_value'),
            total_commissions=Sum('total_commissions'),
            sold_count=Sum('properties_sold')
        ).order_by('-total_sales')[:5]
        
        return [
            {
                'id': agent['agent__id'],
                'name': f"{agent['agent__user__admin_profile__first_name'] or ''} {agent['agent__user__admin_profile__last_name'] or ''}".strip() or "Unknown Agent",
                'avatar': agent['agent__profile_picture__file'],
                'rating': agent['agent__rating'],
                'total_sales': agent['total_sales'] or 0,
                'total_commissions': agent['total_commissions'] or 0,
                'sold_count': agent['sold_count'] or 0
            }
            for agent in top_agents
        ]
    
    @classmethod
    def clear_cache(cls):
        
        cache_key = PropertyCacheKeys.statistics()
        cache.delete(cache_key)

