from django.core.cache import cache
from typing import Optional
from src.core.cache import CacheKeyBuilder, CacheService


class UserCacheKeys:
    
    @staticmethod
    def user_permissions(user_id: int):
        return CacheKeyBuilder.user_permissions(user_id)
    
    @staticmethod
    def user_modules_actions(user_id: int):
        return CacheKeyBuilder.user_modules(user_id)
    
    @staticmethod
    def user_module_perms(user_id: int):
        return CacheKeyBuilder.user_module_perms(user_id)
    
    @staticmethod
    def admin_permissions(user_id: int):
        return CacheKeyBuilder.admin_permissions(user_id)
    
    @staticmethod
    def admin_roles(user_id: int):
        return CacheKeyBuilder.admin_roles(user_id)
    
    @staticmethod
    def admin_info(user_id: int):
        return CacheKeyBuilder.admin_info(user_id)
    
    @staticmethod
    def admin_perms(user_id: int):
        return CacheKeyBuilder.admin_permissions(user_id)
    
    @staticmethod
    def admin_simple_perms(user_id: int):
        return f"admin_simple_perms_{user_id}"
    
    @staticmethod
    def admin_perm_check(user_id: int, method: str, view_name: str):
        return CacheKeyBuilder.admin_perm_check(user_id, method, view_name)
    
    @staticmethod
    def admin_profile(user_id: int, profile_type: str = 'super'):
        return CacheKeyBuilder.admin_profile(user_id, profile_type)
    
    @staticmethod
    def permission_map():
        return CacheKeyBuilder.permission_map()
    
    @staticmethod
    def permission_display_name(perm: str):
        return CacheKeyBuilder.permission_display(perm)
    
    @staticmethod
    def all_user_keys(user_id: int):
        return CacheKeyBuilder.user_all_keys(user_id)
    
    @staticmethod
    def user_permissions_pattern():
        return CacheKeyBuilder.pattern("user:perms")
    
    @staticmethod
    def user_modules_actions_pattern():
        return CacheKeyBuilder.pattern("user:modules")
    
    @staticmethod
    def user_module_perms_pattern():
        return CacheKeyBuilder.pattern("user:mod:perms")
    
    @staticmethod
    def admin_perm_pattern(user_id: Optional[int] = None):
        if user_id:
            return CacheKeyBuilder.pattern(f"admin:perms:{user_id}")
        return CacheKeyBuilder.pattern("admin:perms")


class UserCacheManager:
    
    @staticmethod
    def invalidate_user(user_id: int):
        return CacheService.clear_user_cache(user_id)
    
    @staticmethod
    def invalidate_permissions(user_id: Optional[int] = None):
        if user_id:
            keys = [
                UserCacheKeys.user_permissions(user_id),
                UserCacheKeys.user_modules_actions(user_id),
                UserCacheKeys.user_module_perms(user_id),
                UserCacheKeys.admin_permissions(user_id),
                UserCacheKeys.admin_perms(user_id),
                UserCacheKeys.admin_simple_perms(user_id),
            ]
            cache.delete_many(keys)
            try:
                cache.delete_pattern(UserCacheKeys.admin_perm_pattern(user_id))
            except (AttributeError, NotImplementedError):
                pass
        else:
            try:
                cache.delete_pattern(UserCacheKeys.user_permissions_pattern())
                cache.delete_pattern(UserCacheKeys.user_modules_actions_pattern())
                cache.delete_pattern(UserCacheKeys.user_module_perms_pattern())
                cache.delete_pattern(UserCacheKeys.admin_perm_pattern())
            except (AttributeError, NotImplementedError):
                pass
    
    @staticmethod
    def invalidate_profile(user_id: int):
        cache.delete(UserCacheKeys.admin_profile(user_id, 'super'))
        cache.delete(UserCacheKeys.admin_profile(user_id, 'regular'))
    
    @staticmethod
    def invalidate_permission_map():
        cache.delete(UserCacheKeys.permission_map())
    
    @staticmethod
    def invalidate_all(user_id: Optional[int] = None):
        if user_id:
            UserCacheManager.invalidate_user(user_id)
        else:
            UserCacheManager.invalidate_permissions()
            UserCacheManager.invalidate_permission_map()

