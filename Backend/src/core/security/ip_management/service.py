"""
IP Ban Service
سرویس بن کردن IP های مشکوک و مدیریت Whitelist
"""
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
    WHITELIST_CACHE_KEY = 'ip_whitelist'  # لیست IPهای whitelist در cache
    MAX_ATTEMPTS = 8  # بعد از 8 تلاش، بن میشه
    BAN_DURATION = 600  # 10 دقیقه
    
    @classmethod
    def record_attempt(cls, ip: str) -> bool:
        """
        ثبت تلاش و چک کردن آیا باید بن بشه
        Returns: True اگر باید بن بشه
        """
        # ✅ IPهای whitelist شده هرگز ban نمی‌شوند
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
        """بن کردن IP"""
        # ✅ IPهای whitelist شده هرگز ban نمی‌شوند
        if cls._is_whitelisted(ip):
            logger.warning(f"⚠️ Attempted to ban whitelisted IP: {ip} | Reason: {reason}")
            return
        
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
        # ✅ IPهای whitelist شده هرگز ban نیستند
        if cls._is_whitelisted(ip):
            return False
        
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
    
    @classmethod
    def get_all_banned_ips(cls) -> dict:
        """دریافت همه IPهای ban شده"""
        return cache.get(cls.BAN_CACHE_KEY, {})
    
    @classmethod
    def _is_whitelisted(cls, ip: str) -> bool:
        """چک کردن آیا IP در whitelist است"""
        # ✅ استثنا: localhost در حالت DEBUG
        if settings.DEBUG and ip in ['127.0.0.1', 'localhost', '::1']:
            return True
        
        # ✅ اول چک کردن cache (whitelist runtime)
        cache_whitelist = cache.get(cls.WHITELIST_CACHE_KEY, [])
        if ip in cache_whitelist:
            return True
        
        # ✅ چک کردن IP whitelist از settings (static)
        settings_whitelist = getattr(settings, 'IP_BAN_WHITELIST', [])
        if isinstance(settings_whitelist, str):
            settings_whitelist = [ip.strip() for ip in settings_whitelist.split(',') if ip.strip()]
        
        return ip in settings_whitelist
    
    @classmethod
    def get_whitelist(cls) -> list:
        """دریافت لیست IPهای whitelist"""
        # ترکیب cache و settings
        cache_whitelist = cache.get(cls.WHITELIST_CACHE_KEY, [])
        settings_whitelist = getattr(settings, 'IP_BAN_WHITELIST', [])
        if isinstance(settings_whitelist, str):
            settings_whitelist = [ip.strip() for ip in settings_whitelist.split(',') if ip.strip()]
        
        # ترکیب و حذف تکراری
        combined = list(set(cache_whitelist + settings_whitelist))
        return combined
    
    @classmethod
    def add_to_whitelist(cls, ip: str) -> bool:
        """اضافه کردن IP به whitelist"""
        whitelist = cache.get(cls.WHITELIST_CACHE_KEY, [])
        if ip not in whitelist:
            whitelist.append(ip)
            # Cache برای مدت طولانی (24 ساعت)
            cache.set(cls.WHITELIST_CACHE_KEY, whitelist, timeout=86400)
            logger.info(f"✅ IP ADDED TO WHITELIST: {ip}")
            return True
        return False
    
    @classmethod
    def remove_from_whitelist(cls, ip: str) -> bool:
        """حذف IP از whitelist"""
        whitelist = cache.get(cls.WHITELIST_CACHE_KEY, [])
        if ip in whitelist:
            whitelist.remove(ip)
            cache.set(cls.WHITELIST_CACHE_KEY, whitelist, timeout=86400)
            logger.info(f"✅ IP REMOVED FROM WHITELIST: {ip}")
            return True
        return False

