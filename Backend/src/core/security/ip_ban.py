from django.core.cache import cache
from django.conf import settings
from django.utils import timezone
import logging

logger = logging.getLogger('security')


class IPBanService:
    """
    سرویس بن کردن IP های مشکوک
    """
    BAN_CACHE_KEY = 'banned_ips'
    ATTEMPT_CACHE_KEY = 'honeypot_attempts:{ip}'
    MAX_ATTEMPTS = 3  # بعد از 3 تلاش، بن میشه
    BAN_DURATION = 3600  # 1 ساعت
    
    @classmethod
    def record_attempt(cls, ip: str) -> bool:
        """
        ثبت تلاش و چک کردن آیا باید بن بشه
        Returns: True اگر باید بن بشه
        """
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
        """بن کردن IP"""
        banned_ips = cache.get(cls.BAN_CACHE_KEY, {})
        banned_ips[ip] = {
            'reason': reason,
            'banned_at': str(timezone.now())
        }
        cache.set(cls.BAN_CACHE_KEY, banned_ips, timeout=cls.BAN_DURATION)
        
        logger.error(f"🚫 IP BANNED: {ip} | Reason: {reason}")
    
    @classmethod
    def is_banned(cls, ip: str) -> bool:
        """چک کردن آیا IP بن شده"""
        banned_ips = cache.get(cls.BAN_CACHE_KEY, {})
        return ip in banned_ips
    
    @classmethod
    def unban_ip(cls, ip: str):
        """رفع بن IP"""
        banned_ips = cache.get(cls.BAN_CACHE_KEY, {})
        if ip in banned_ips:
            del banned_ips[ip]
            cache.set(cls.BAN_CACHE_KEY, banned_ips)
            logger.info(f"✅ IP UNBANNED: {ip}")
    
    @classmethod
    def get_attempts(cls, ip: str) -> int:
        """دریافت تعداد تلاش‌های یک IP"""
        cache_key = cls.ATTEMPT_CACHE_KEY.format(ip=ip)
        return cache.get(cache_key, 0)
    
    @classmethod
    def reset_attempts(cls, ip: str):
        """ریست کردن تعداد تلاش‌ها"""
        cache_key = cls.ATTEMPT_CACHE_KEY.format(ip=ip)
        cache.delete(cache_key)

