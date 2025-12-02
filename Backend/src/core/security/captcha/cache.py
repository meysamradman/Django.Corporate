from django.core.cache import cache
from django.conf import settings


class CaptchaCacheKeys:
    
    REDIS_PREFIX = getattr(settings, 'CAPTCHA_REDIS_PREFIX', "captcha:")
    EXPIRY_SECONDS = getattr(settings, 'CAPTCHA_EXPIRY_SECONDS', 300)
    
    @staticmethod
    def captcha(captcha_id: str):
        return f"{CaptchaCacheKeys.REDIS_PREFIX}{captcha_id}"
    
    @staticmethod
    def all_keys_pattern():
        return f"{CaptchaCacheKeys.REDIS_PREFIX}*"


class CaptchaCacheManager:
    
    @staticmethod
    def set_captcha(captcha_id: str, digits: str):
        cache_key = CaptchaCacheKeys.captcha(captcha_id)
        cache.set(cache_key, digits, CaptchaCacheKeys.EXPIRY_SECONDS)
    
    @staticmethod
    def get_captcha(captcha_id: str):
        cache_key = CaptchaCacheKeys.captcha(captcha_id)
        return cache.get(cache_key)
    
    @staticmethod
    def delete_captcha(captcha_id: str):
        cache_key = CaptchaCacheKeys.captcha(captcha_id)
        cache.delete(cache_key)
    
    @staticmethod
    def clear_all():
        try:
            cache.delete_pattern(CaptchaCacheKeys.all_keys_pattern())
        except (AttributeError, NotImplementedError):
            pass

