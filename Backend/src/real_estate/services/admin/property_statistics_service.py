from django.core.cache import cache
from django.utils import timezone
from django.db.models import Count, Q

from src.real_estate.models.property import Property
from src.real_estate.models.type import PropertyType
from src.real_estate.models.state import PropertyState
from src.real_estate.models.label import PropertyLabel
from src.real_estate.models.feature import PropertyFeature
from src.real_estate.models.tag import PropertyTag
from src.real_estate.models.agent import PropertyAgent
from src.real_estate.models.agency import RealEstateAgency
from src.real_estate.utils.cache import PropertyCacheKeys


class PropertyStatisticsService:
    CACHE_TIMEOUT = 600
    
    @classmethod
    def get_statistics(cls):
        cache_key = PropertyCacheKeys.statistics()
        cached_stats = cache.get(cache_key)
        if cached_stats:
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
        
        return {
            'total': states_count,
            'with_properties': states_with_properties,
            'without_properties': states_count - states_with_properties,
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
            'verified': 0,  # RealEstateAgency model doesn't have is_verified field
            'with_properties': agencies_with_properties,
            'active_percentage': round((agencies_active / agencies_total * 100) if agencies_total > 0 else 0, 1),
            'verified_percentage': 0,  # RealEstateAgency model doesn't have is_verified field
        }
    
    @classmethod
    def clear_cache(cls):
        """پاک کردن cache آمار"""
        cache_key = PropertyCacheKeys.statistics()
        cache.delete(cache_key)

