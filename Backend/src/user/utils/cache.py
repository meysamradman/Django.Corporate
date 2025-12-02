"""
Cache key utilities and cache management for user app
Standardized cache keys to avoid conflicts
"""
from django.core.cache import cache
from typing import Optional


class UserCacheKeys:
    """Standardized cache keys for user app"""
    
    # Permission cache keys
    @staticmethod
    def user_permissions(user_id: int):
        """Cache key for user permissions list"""
        return f"user_permissions_{user_id}"
    
    @staticmethod
    def user_modules_actions(user_id: int):
        """Cache key for user modules and actions"""
        return f"user_modules_actions_{user_id}"
    
    # Admin cache keys
    @staticmethod
    def admin_permissions(user_id: int):
        """Cache key for admin permissions"""
        return f"admin_permissions_{user_id}"
    
    @staticmethod
    def admin_roles(user_id: int):
        """Cache key for admin roles"""
        return f"admin_roles_{user_id}"
    
    @staticmethod
    def admin_info(user_id: int):
        """Cache key for admin info"""
        return f"admin_info_{user_id}"
    
    @staticmethod
    def admin_perms(user_id: int):
        """Cache key for admin permissions (detailed)"""
        return f"admin_perms_{user_id}"
    
    @staticmethod
    def admin_simple_perms(user_id: int):
        """Cache key for admin simple permissions"""
        return f"admin_simple_perms_{user_id}"
    
    @staticmethod
    def admin_perm_check(user_id: int, method: str, view_name: str):
        """Cache key for admin permission check"""
        return f"admin_perm_{user_id}_{method}_{view_name}"
    
    # Profile cache keys
    @staticmethod
    def admin_profile(user_id: int, profile_type: str = 'super'):
        """Cache key for admin profile"""
        return f"admin_profile_{user_id}_{profile_type}"
    
    # Permission map cache
    @staticmethod
    def permission_map():
        """Cache key for permission map"""
        return "all_permissions_map"
    
    @staticmethod
    def permission_display_name(perm: str):
        """Cache key for permission display name"""
        return f"perm_name_{perm}"
    
    # All keys for a user
    @staticmethod
    def all_user_keys(user_id: int):
        """Return all cache keys for a user"""
        return [
            UserCacheKeys.user_permissions(user_id),
            UserCacheKeys.user_modules_actions(user_id),
            UserCacheKeys.admin_permissions(user_id),
            UserCacheKeys.admin_roles(user_id),
            UserCacheKeys.admin_info(user_id),
            UserCacheKeys.admin_perms(user_id),
            UserCacheKeys.admin_simple_perms(user_id),
            UserCacheKeys.admin_profile(user_id, 'super'),
            UserCacheKeys.admin_profile(user_id, 'regular'),
        ]
    
    # Patterns for bulk operations
    @staticmethod
    def user_permissions_pattern():
        """Pattern for all user permissions cache keys"""
        return "user_permissions_*"
    
    @staticmethod
    def user_modules_actions_pattern():
        """Pattern for all user modules/actions cache keys"""
        return "user_modules_actions_*"
    
    @staticmethod
    def admin_perm_pattern(user_id: Optional[int] = None):
        """Pattern for admin permission cache keys"""
        if user_id:
            return f"admin_perm_{user_id}_*"
        return "admin_perm_*"


class UserCacheManager:
    """Cache management utilities for user operations"""
    
    @staticmethod
    def invalidate_user(user_id: int):
        """Invalidate all cache for a specific user"""
        cache_keys = UserCacheKeys.all_user_keys(user_id)
        cache.delete_many(cache_keys)
    
    @staticmethod
    def invalidate_permissions(user_id: Optional[int] = None):
        """Invalidate permission-related cache"""
        if user_id:
            cache.delete(UserCacheKeys.user_permissions(user_id))
            cache.delete(UserCacheKeys.user_modules_actions(user_id))
            cache.delete(UserCacheKeys.admin_permissions(user_id))
            cache.delete(UserCacheKeys.admin_perms(user_id))
            cache.delete(UserCacheKeys.admin_simple_perms(user_id))
            # Clear permission check cache
            try:
                cache.delete_pattern(UserCacheKeys.admin_perm_pattern(user_id))
            except (AttributeError, NotImplementedError):
                pass
        else:
            try:
                cache.delete_pattern(UserCacheKeys.user_permissions_pattern())
                cache.delete_pattern(UserCacheKeys.user_modules_actions_pattern())
                cache.delete_pattern(UserCacheKeys.admin_perm_pattern())
            except (AttributeError, NotImplementedError):
                pass
    
    @staticmethod
    def invalidate_profile(user_id: int):
        """Invalidate admin profile cache"""
        cache.delete(UserCacheKeys.admin_profile(user_id, 'super'))
        cache.delete(UserCacheKeys.admin_profile(user_id, 'regular'))
    
    @staticmethod
    def invalidate_permission_map():
        """Invalidate permission map cache"""
        cache.delete(UserCacheKeys.permission_map())
    
    @staticmethod
    def invalidate_all(user_id: Optional[int] = None):
        """Invalidate all user-related cache"""
        if user_id:
            UserCacheManager.invalidate_user(user_id)
        else:
            UserCacheManager.invalidate_permissions()
            UserCacheManager.invalidate_permission_map()

