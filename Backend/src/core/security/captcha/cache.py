from django.core.cache import cache
from django.conf import settings
from src.core.cache import CacheService


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
        return CacheService.set_captcha(captcha_id, digits, CaptchaCacheKeys.EXPIRY_SECONDS)
    
    @staticmethod
    def get_captcha(captcha_id: str):
        return CacheService.get_captcha(captcha_id)
    
    @staticmethod
    def delete_captcha(captcha_id: str):
        return CacheService.delete_captcha(captcha_id)
    
    @staticmethod
    def clear_all():
        return CacheService.delete_pattern(CaptchaCacheKeys.all_keys_pattern())

