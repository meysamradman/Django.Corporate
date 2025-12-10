"""
استراتژی Cache بهینه برای Permission System
"""
from django.core.cache import cache
from typing import Optional


class PermissionCacheStrategy:
    """مدیریت هوشمند Cache"""
    
    # Timeouts بهینه
    SUPER_ADMIN_TIMEOUT = 600  # 10 دقیقه
    READ_TIMEOUT = 300         # 5 دقیقه
    WRITE_TIMEOUT = 60         # 1 دقیقه
    
    @classmethod
    def get_cache_timeout(cls, user, method: str) -> int:
        """محاسبه timeout مناسب"""
        # Super Admin: cache طولانی‌تر
        if getattr(user, 'is_admin_full', False) or getattr(user, 'is_superuser', False):
            return cls.SUPER_ADMIN_TIMEOUT
        
        # Read operations: cache متوسط
        if method.upper() in {'GET', 'HEAD', 'OPTIONS'}:
            return cls.READ_TIMEOUT
        
        # Write operations: cache کوتاه
        return cls.WRITE_TIMEOUT
    
    @classmethod
    def invalidate_user_cache(cls, user_id: int):
        """پاک کردن cache کاربر"""
        patterns = [
            f"perm_{user_id}_*",
            f"admin_perm_{user_id}_*",
        ]
        for pattern in patterns:
            try:
                cache.delete_pattern(pattern)
            except (AttributeError, NotImplementedError):
                # اگر delete_pattern پشتیبانی نشود، از روش جایگزین استفاده کن
                pass

