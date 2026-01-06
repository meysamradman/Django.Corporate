from django.core.cache import cache
from django.conf import settings
from django.utils import timezone


class IPBanService:
    BAN_CACHE_KEY = 'banned_ips'
    ATTEMPT_CACHE_KEY = 'honeypot_attempts:{ip}'
    WHITELIST_CACHE_KEY = 'ip_whitelist'
    MAX_ATTEMPTS = 8
    BAN_DURATION = 600
    
    @classmethod
    def record_attempt(cls, ip: str) -> bool:
        if cls._is_whitelisted(ip):
            return False
        
        cache_key = cls.ATTEMPT_CACHE_KEY.format(ip=ip)
        attempts = cache.get(cache_key, 0)
        attempts += 1
        
        cache.set(cache_key, attempts, timeout=cls.BAN_DURATION)
        
        if attempts >= cls.MAX_ATTEMPTS:
            cls.ban_ip(ip, reason=f'Too many honeypot attempts: {attempts}')
            return True
        
        return False
    
    @classmethod
    def ban_ip(cls, ip: str, reason: str = 'Honeypot triggered'):
        if cls._is_whitelisted(ip):
            return
        
        banned_ips = cache.get(cls.BAN_CACHE_KEY, {})
        banned_ips[ip] = {
            'reason': reason,
            'banned_at': str(timezone.now())
        }
        cache.set(cls.BAN_CACHE_KEY, banned_ips, timeout=cls.BAN_DURATION)
    
    @classmethod
    def is_banned(cls, ip: str) -> bool:
        if cls._is_whitelisted(ip):
            return False
        
        banned_ips = cache.get(cls.BAN_CACHE_KEY, {})
        return ip in banned_ips
    
    @classmethod
    def unban_ip(cls, ip: str):
        banned_ips = cache.get(cls.BAN_CACHE_KEY, {})
        if ip in banned_ips:
            del banned_ips[ip]
            cache.set(cls.BAN_CACHE_KEY, banned_ips)
    
    @classmethod
    def get_attempts(cls, ip: str) -> int:
        cache_key = cls.ATTEMPT_CACHE_KEY.format(ip=ip)
        return cache.get(cache_key, 0)
    
    @classmethod
    def reset_attempts(cls, ip: str):
        cache_key = cls.ATTEMPT_CACHE_KEY.format(ip=ip)
        cache.delete(cache_key)
    
    @classmethod
    def get_all_banned_ips(cls) -> dict:
        return cache.get(cls.BAN_CACHE_KEY, {})
    
    @classmethod
    def _is_whitelisted(cls, ip: str) -> bool:
        if settings.DEBUG and ip in ['127.0.0.1', 'localhost', '::1']:
            return True
        
        cache_whitelist = cache.get(cls.WHITELIST_CACHE_KEY, [])
        if ip in cache_whitelist:
            return True
        
        settings_whitelist = getattr(settings, 'IP_BAN_WHITELIST', [])
        if isinstance(settings_whitelist, str):
            settings_whitelist = [ip.strip() for ip in settings_whitelist.split(',') if ip.strip()]
        
        return ip in settings_whitelist
    
    @classmethod
    def get_whitelist(cls) -> list:
        cache_whitelist = cache.get(cls.WHITELIST_CACHE_KEY, [])
        settings_whitelist = getattr(settings, 'IP_BAN_WHITELIST', [])
        if isinstance(settings_whitelist, str):
            settings_whitelist = [ip.strip() for ip in settings_whitelist.split(',') if ip.strip()]
        
        combined = list(set(cache_whitelist + settings_whitelist))
        return combined
    
    @classmethod
    def add_to_whitelist(cls, ip: str) -> bool:
        whitelist = cache.get(cls.WHITELIST_CACHE_KEY, [])
        if ip not in whitelist:
            whitelist.append(ip)
            cache.set(cls.WHITELIST_CACHE_KEY, whitelist, timeout=86400)
            return True
        return False
    
    @classmethod
    def remove_from_whitelist(cls, ip: str) -> bool:
        whitelist = cache.get(cls.WHITELIST_CACHE_KEY, [])
        if ip in whitelist:
            whitelist.remove(ip)
            cache.set(cls.WHITELIST_CACHE_KEY, whitelist, timeout=86400)
            return True
        return False

