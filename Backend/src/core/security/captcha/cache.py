"""
Cache key utilities and cache management for CAPTCHA
Standardized cache keys to avoid conflicts
"""
from django.core.cache import cache
from django.conf import settings


class CaptchaCacheKeys:
    """Standardized cache keys for CAPTCHA"""
    
    # CAPTCHA settings from Django settings
    REDIS_PREFIX = getattr(settings, 'CAPTCHA_REDIS_PREFIX', "captcha:")
    EXPIRY_SECONDS = getattr(settings, 'CAPTCHA_EXPIRY_SECONDS', 300)  # 5 minutes
    
    @staticmethod
    def captcha(captcha_id: str):
        """Cache key for a specific CAPTCHA challenge"""
        return f"{CaptchaCacheKeys.REDIS_PREFIX}{captcha_id}"
    
    @staticmethod
    def all_keys_pattern():
        """Pattern for all CAPTCHA cache keys (for bulk delete)"""
        return f"{CaptchaCacheKeys.REDIS_PREFIX}*"


class CaptchaCacheManager:
    """Cache management utilities for CAPTCHA operations"""
    
    @staticmethod
    def set_captcha(captcha_id: str, digits: str):
        """Store CAPTCHA challenge in cache"""
        cache_key = CaptchaCacheKeys.captcha(captcha_id)
        cache.set(cache_key, digits, CaptchaCacheKeys.EXPIRY_SECONDS)
    
    @staticmethod
    def get_captcha(captcha_id: str):
        """Get CAPTCHA challenge from cache"""
        cache_key = CaptchaCacheKeys.captcha(captcha_id)
        return cache.get(cache_key)
    
    @staticmethod
    def delete_captcha(captcha_id: str):
        """Delete CAPTCHA challenge from cache (after verification)"""
        cache_key = CaptchaCacheKeys.captcha(captcha_id)
        cache.delete(cache_key)
    
    @staticmethod
    def clear_all():
        """Clear all CAPTCHA cache (use with caution)"""
        try:
            cache.delete_pattern(CaptchaCacheKeys.all_keys_pattern())
        except (AttributeError, NotImplementedError):
            # Fallback if delete_pattern not available
            pass

