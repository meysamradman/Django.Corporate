from django.core.cache import cache
from typing import Optional


class PermissionCacheStrategy:
    
    SUPER_ADMIN_TIMEOUT = 600
    READ_TIMEOUT = 300
    WRITE_TIMEOUT = 60
    
    @classmethod
    def get_cache_timeout(cls, user, method: str) -> int:
        if getattr(user, 'is_admin_full', False) or getattr(user, 'is_superuser', False):
            return cls.SUPER_ADMIN_TIMEOUT
        
        if method.upper() in {'GET', 'HEAD', 'OPTIONS'}:
            return cls.READ_TIMEOUT
        
        return cls.WRITE_TIMEOUT
    
    @classmethod
    def invalidate_user_cache(cls, user_id: int):
        patterns = [
            f"perm_{user_id}_*",
            f"admin_perm_{user_id}_*",
        ]
        for pattern in patterns:
            try:
                cache.delete_pattern(pattern)
            except (AttributeError, NotImplementedError):
                pass

