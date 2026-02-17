from django.core.cache import cache
from typing import Optional

from src.user.utils.cache import UserCacheKeys
from src.user.utils.cache_ttl import (
    USER_ADMIN_PERMISSION_CHECK_SUPERADMIN_TTL,
    USER_ADMIN_PERMISSION_CHECK_READ_TTL,
    USER_ADMIN_PERMISSION_CHECK_WRITE_TTL,
)

class PermissionCacheStrategy:
    
    SUPER_ADMIN_TIMEOUT = USER_ADMIN_PERMISSION_CHECK_SUPERADMIN_TTL
    READ_TIMEOUT = USER_ADMIN_PERMISSION_CHECK_READ_TTL
    WRITE_TIMEOUT = USER_ADMIN_PERMISSION_CHECK_WRITE_TTL
    
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
            UserCacheKeys.admin_perm_pattern(user_id),
            f"admin_perm_{user_id}_*",
        ]
        for pattern in patterns:
            try:
                cache.delete_pattern(pattern)
            except (AttributeError, NotImplementedError):
                pass

