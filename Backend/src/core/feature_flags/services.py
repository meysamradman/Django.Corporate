from django.core.cache import cache
from .models import FeatureFlag

CACHE_TTL = 300  # 5 minutes


def is_feature_active(key: str) -> bool:
    """
    Check if a feature is active using cache for performance.
    
    Args:
        key: Feature flag key (e.g., 'portfolio', 'blog')
        
    Returns:
        bool: True if feature is active, False otherwise
    """
    cache_key = f'feature_flag:{key}'
    value = cache.get(cache_key)

    if value is None:
        try:
            flag = FeatureFlag.objects.get(key=key)
            value = flag.is_active
        except FeatureFlag.DoesNotExist:
            value = False
        cache.set(cache_key, value, CACHE_TTL)

    return value


def invalidate_feature_flag_cache(key: str = None):
    """
    Invalidate feature flag cache.
    
    Args:
        key: Specific feature flag key to invalidate, or None to invalidate all
    """
    if key:
        cache_key = f'feature_flag:{key}'
        cache.delete(cache_key)
        # Also invalidate the API cache
        cache.delete('feature_flags_api')
    else:
        # Invalidate all feature flag caches
        flags = FeatureFlag.objects.values_list('key', flat=True)
        for flag_key in flags:
            cache.delete(f'feature_flag:{flag_key}')
        cache.delete('feature_flags_api')


def get_all_feature_flags() -> dict:
    """
    Get all feature flags as a dictionary.
    Uses cache for performance.
    
    Returns:
        dict: Dictionary mapping feature keys to their active status
    """
    flags = cache.get('feature_flags_api')

    if flags is None:
        flags = {
            f.key: f.is_active
            for f in FeatureFlag.objects.all()
        }
        cache.set('feature_flags_api', flags, CACHE_TTL)

    return flags

