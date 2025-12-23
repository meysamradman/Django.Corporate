from django.core.cache import cache
from typing import Dict, List, Set, Any
from src.user.utils.cache import UserCacheKeys, UserCacheManager


class PermissionHelper:
    
    CACHE_TIMEOUT = 300
    
    MODULE_MAP = {
        'user': 'user_management',
        'media': 'media_management', 
        'admin': 'system_admin',
        'auth': 'authentication',
        'contenttypes': 'content_types',
        'sessions': 'session_management',
        'real_estate': 'real_estate_management',
        'blog': 'blog_management',
        'portfolio': 'portfolio_management',
    }
    
    ACTION_MAP = {
        'add': 'create',
        'change': 'update', 
        'delete': 'delete',
        'view': 'read'
    }
    
    @classmethod
    def get_optimized_permissions(cls, user, list_view=False) -> Dict[str, Any]:
        if not user.is_authenticated or not user.is_active:
            return cls._get_empty_permissions()
        
        if user.user_type == 'user' and not user.is_staff and not user.is_superuser:
            return cls._get_regular_user_permissions(list_view)
        
        if user.is_superuser:
            return cls._get_superuser_permissions(list_view)
        
        if list_view:
            return cls._get_admin_permissions_simple(user)
        else:
            return cls._get_admin_permissions(user)
    
    @classmethod
    def _get_empty_permissions(cls) -> Dict[str, Any]:
        return {
            'access_level': 'none',
            'permissions': [],
            'roles': [],
            'modules': [],
            'actions': [],
            'permission_summary': {
                'total_permissions': 0,
                'access_type': 'no_access',
                'restrictions': 'all'
            }
        }
    
    @classmethod
    def _get_regular_user_permissions(cls, list_view=False) -> Dict[str, Any]:
        if list_view:
            return {
                'access_level': 'user',
                'roles': [],
                'permissions_count': 0
            }
        
        return {
            'access_level': 'user',
            'permissions': [],
            'roles': [],
            'modules': [],
            'actions': [],
            'permission_summary': {
                'total_permissions': 0,
                'accessible_modules': 0,
                'available_actions': 0,
                'access_type': 'website_user'
            }
        }
    
    @classmethod
    def _get_superuser_permissions(cls, list_view=False) -> Dict[str, Any]:
        if list_view:
            return {
                'access_level': 'super_admin',
                'roles': ['super_admin'],
                'permissions_count': 'unlimited'
            }
        
        return {
            'access_level': 'super_admin',
            'permissions': ['all'],
            'roles': ['super_admin'],
            'modules': ['all'],
            'actions': ['all'],
            'permission_summary': {
                'total_permissions': 'unlimited',
                'access_type': 'full_system_access',
                'restrictions': 'none'
            }
        }
    
    @classmethod
    def _get_admin_permissions(cls, user) -> Dict[str, Any]:
        cache_key = UserCacheKeys.admin_perms(user.id)
        cached_data = cache.get(cache_key)
        
        if cached_data:
            return cached_data
        
        permissions_list = cls._calculate_user_permissions(user)
        roles = cls._get_user_roles(user)
        modules = cls._get_accessible_modules(permissions_list)
        actions = cls._get_accessible_actions(permissions_list)
        
        result = {
            'access_level': 'admin',
            'permissions': permissions_list,
            'roles': roles,
            'modules': modules,
            'actions': actions,
            'permission_summary': {
                'total_permissions': len(permissions_list),
                'accessible_modules': len(modules),
                'available_actions': len(actions),
                'access_type': 'role_based_access'
            }
        }
        
        cache.set(cache_key, result, cls.CACHE_TIMEOUT)
        return result
        
    @classmethod
    def _get_admin_permissions_simple(cls, user) -> Dict[str, Any]:
        cache_key = UserCacheKeys.admin_simple_perms(user.id)
        cached_data = cache.get(cache_key)
            
        if cached_data:
            return cached_data
            
        roles = cls._get_user_roles(user)
        permissions_count = cls._count_user_permissions(user)
            
        result = {
            'access_level': 'admin',
            'roles': roles,
            'permissions_count': permissions_count,
            'has_permissions': permissions_count > 0
        }
            
        cache.set(cache_key, result, 600)
        return result
        
    @classmethod
    def _count_user_permissions(cls, user) -> int:
        if user.is_superuser:
            return 999
                
        count = 0
            
        if hasattr(user, 'admin_user_roles'):
            user_role_assignments = user.admin_user_roles.filter(
                is_active=True
            ).select_related('role')
                
            for user_role in user_role_assignments:
                role_perms = user_role.role.permissions
                
                if 'specific_permissions' in role_perms:
                    specific_perms = role_perms.get('specific_permissions', [])
                    if isinstance(specific_perms, list):
                        for perm in specific_perms:
                            if isinstance(perm, dict):
                                if perm.get('module') == 'all' or perm.get('action') == 'all':
                                    return 999
                        count += len(specific_perms)
                else:
                    role_actions = role_perms.get('actions', [])
                    role_modules = role_perms.get('modules', [])
                    
                    if 'all' in role_modules or 'all' in role_actions:
                        return 999
                    count += len(role_modules) * len(role_actions)
            
        return count
    
    @classmethod
    def _calculate_user_permissions(cls, user) -> List[str]:
        if user.is_superuser:
            return ['all']
            
        permissions_set = set()
        
        if hasattr(user, 'admin_user_roles'):
            user_role_assignments = user.admin_user_roles.filter(
                is_active=True
            ).select_related('role')
            
            for user_role in user_role_assignments:
                role_perms = user_role.role.permissions
                
                if 'specific_permissions' in role_perms:
                    specific_perms = role_perms.get('specific_permissions', [])
                    if isinstance(specific_perms, list):
                        for perm in specific_perms:
                            if isinstance(perm, dict):
                                module = perm.get('module')
                                action = perm.get('action')
                                if module and action:
                                    if module == 'all' or action == 'all':
                                        return ['all']
                                    permissions_set.add(f"{module}.{action}")
                else:
                    role_modules = role_perms.get('modules', [])
                    role_actions = role_perms.get('actions', [])
                    
                    for module in role_modules:
                        for action in role_actions:
                            if module != 'all' and action != 'all':
                                permissions_set.add(f"{module}.{action}")
        
        for app_label, codename in user.user_permissions.values_list('content_type__app_label', 'codename'):
            permissions_set.add(f"{app_label}.{codename}")
            
        for group in user.groups.all(): 
            for app_label, codename in group.permissions.values_list('content_type__app_label', 'codename'):
                permissions_set.add(f"{app_label}.{codename}")
        
        return sorted(list(permissions_set))
    
    @classmethod
    def _get_user_roles(cls, user) -> List[str]:
        if user.is_superuser:
            return ['super_admin']
            
        assigned_roles = []
        
        try:
            if hasattr(user, 'admin_user_roles'):
                user_role_assignments = user.admin_user_roles.filter(
                    is_active=True
                ).select_related('role')
                
                assigned_roles = [ur.role.name for ur in user_role_assignments]
        except Exception:
            pass
            
        return assigned_roles
    
    @classmethod
    def _get_accessible_modules(cls, permissions: List[str]) -> List[str]:
        modules = set()
        for perm in permissions:
            if '.' in perm:
                app_label = perm.split('.')[0]
                modules.add(cls.MODULE_MAP.get(app_label, app_label))
        return list(modules)
    
    @classmethod
    def _get_accessible_actions(cls, permissions: List[str]) -> List[str]:
        actions = set()
        for perm in permissions:
            if '.' in perm:
                action = perm.split('.')[1]
                actions.add(cls.ACTION_MAP.get(action, action))
        return list(actions)
    
    @classmethod
    def clear_user_cache(cls, user_id: int) -> None:
        cache_keys = [
            f"admin_perms_{user_id}",
            f"admin_simple_perms_{user_id}",
            f"admin_permissions_{user_id}",
            f"admin_roles_{user_id}",
            f"admin_info_{user_id}",
            f"user_permissions_{user_id}",
            f"user_modules_actions_{user_id}",
            f"admin_profile_{user_id}_super",
            f"admin_profile_{user_id}_regular",
        ]
        cache.delete_many(cache_keys)
        
        try:
            UserCacheManager.invalidate_permissions(user_id)
        except Exception:
            pass
    
    @classmethod
    def clear_all_permission_cache(cls) -> None:
        UserCacheManager.invalidate_permissions()
    
    @classmethod
    def get_permission_categories(cls, permissions: List[str]) -> Dict[str, List[Dict[str, str]]]:
        categories = {}
        
        for perm in permissions:
            if '.' not in perm:
                continue
                
            app_label, codename = perm.split('.', 1)
            category = cls.MODULE_MAP.get(app_label, app_label.title())
            
            if category not in categories:
                categories[category] = []
            
            cache_key = UserCacheKeys.permission_display_name(perm)
            display_name = cache.get(cache_key)
            
            if not display_name:
                display_name = " ".join(codename.split('_')).title()
                cache.set(cache_key, display_name, 86400)
            
            categories[category].append({
                'code': perm,
                'name': display_name
            })
        
        for category in categories:
            categories[category] = sorted(categories[category], key=lambda x: x['name'])
            
        return categories