from django.core.cache import cache
from .models import FeatureFlag

CACHE_TTL = 300


def is_feature_active(key: str) -> bool:
    cache_key = f'feature_flag:{key}'
    value = cache.get(cache_key)

    if value is None:
        try:
            flag = FeatureFlag.objects.get(key=key)
            value = flag.is_active
        except FeatureFlag.DoesNotExist:
            value = True
        cache.set(cache_key, value, CACHE_TTL)

    return value


def invalidate_feature_flag_cache(key: str = None):
    if key:
        cache_key = f'feature_flag:{key}'
        cache.delete(cache_key)
        cache.delete('feature_flags_api')
    else:
        flags = FeatureFlag.objects.values_list('key', flat=True)
        for flag_key in flags:
            cache.delete(f'feature_flag:{flag_key}')
        cache.delete('feature_flags_api')


def get_all_feature_flags() -> dict:
    flags = cache.get('feature_flags_api')

    if flags is None:
        flags = {
            f.key: f.is_active
            for f in FeatureFlag.objects.all()
        }
        cache.set('feature_flags_api', flags, CACHE_TTL)

    return flags
