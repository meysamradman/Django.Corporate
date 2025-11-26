"""
Centralized Permission Helper - Eliminates code duplication
Optimized for performance and security - Single source of truth
"""
from django.core.cache import cache
from typing import Dict, List, Set, Any


class PermissionHelper:
    """
    Centralized helper for all permission-related operations
    Eliminates code duplication across serializers and views
    """
    
    # Cache timeouts
    CACHE_TIMEOUT = 300  # 5 minutes
    
    # Module mapping - single source of truth
    MODULE_MAP = {
        'user': 'user_management',
        'media': 'media_management', 
        'admin': 'system_admin',
        'auth': 'authentication',
        'contenttypes': 'content_types',
        'sessions': 'session_management'
    }
    
    # Action mapping - single source of truth
    ACTION_MAP = {
        'add': 'create',
        'change': 'update', 
        'delete': 'delete',
        'view': 'read'
    }
    
    @classmethod
    def get_optimized_permissions(cls, user, list_view=False) -> Dict[str, Any]:
        """
        Get optimized permissions for any user type
        list_view=True returns simplified data for lists
        list_view=False returns detailed data for single user view
        """
        if not user.is_authenticated or not user.is_active:
            return cls._get_empty_permissions()
        
        # ✅ REGULAR USER: Simple response (no roles/permissions)
        if user.user_type == 'user' and not user.is_staff and not user.is_superuser:
            return cls._get_regular_user_permissions(list_view)
        
        # ✅ SUPERUSER: Ultra-fast minimal response (≤200B)
        if user.is_superuser:
            return cls._get_superuser_permissions(list_view)
        
        # ✅ REGULAR ADMIN: Smart response based on view type
        if list_view:
            return cls._get_admin_permissions_simple(user)
        else:
            return cls._get_admin_permissions(user)
    
    @classmethod
    def _get_empty_permissions(cls) -> Dict[str, Any]:
        """Empty permissions for unauthenticated users"""
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
        """Permissions for regular website users - no roles/admin permissions"""
        if list_view:
            # Minimal for list view
            return {
                'access_level': 'user',
                'roles': [],
                'permissions_count': 0
            }
        
        # Full data for detail view
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
        """Optimized response for superusers - static data"""
        if list_view:
            # Ultra-minimal for list view
            return {
                'access_level': 'super_admin',
                'roles': ['super_admin'],
                'permissions_count': 'unlimited'
            }
        
        # Full data for detail view
        return {
            'access_level': 'super_admin',
            'permissions': ['all'],
            'roles': ['super_admin'],  # Fixed: superuser should show as super_admin role
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
        """
        ✅ Detailed permissions for regular admins with caching
        IMPORTANT: Cache is cleared automatically when roles change via signals
        """
        cache_key = f"admin_perms_{user.id}"
        cached_data = cache.get(cache_key)
        
        if cached_data:
            # ✅ Return cached data - cache is cleared by signals when roles change
            return cached_data
        
        # ✅ Calculate fresh permissions (cache was cleared or expired)
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
        
        # Cache for 5 minutes
        cache.set(cache_key, result, cls.CACHE_TIMEOUT)
        return result
        
    @classmethod
    def _get_admin_permissions_simple(cls, user) -> Dict[str, Any]:
        """Simplified permissions for list view - much faster"""
        cache_key = f"admin_simple_perms_{user.id}"
        cached_data = cache.get(cache_key)
            
        if cached_data:
            return cached_data
            
        # Get only essential data
        roles = cls._get_user_roles(user)
        permissions_count = cls._count_user_permissions(user)
            
        result = {
            'access_level': 'admin',
            'roles': roles,
            'permissions_count': permissions_count,
            'has_permissions': permissions_count > 0
        }
            
        # Cache for longer (10 minutes)
        cache.set(cache_key, result, 600)
        return result
        
    @classmethod
    def _count_user_permissions(cls, user) -> int:
        """Count permissions without loading all data - only from assigned roles"""
        if user.is_superuser:
            return 999  # Unlimited for superuser
                
        count = 0
            
        # Count from ONLY assigned AdminRoles
        if hasattr(user, 'adminuserrole_set'):
            user_role_assignments = user.adminuserrole_set.filter(
                is_active=True
            ).select_related('role')
                
            for user_role in user_role_assignments:
                role_perms = user_role.role.permissions
                
                # ✅ NEW: Check for specific_permissions format first
                if 'specific_permissions' in role_perms:
                    specific_perms = role_perms.get('specific_permissions', [])
                    if isinstance(specific_perms, list):
                        # Each item in specific_permissions is one exact permission
                        for perm in specific_perms:
                            if isinstance(perm, dict):
                                if perm.get('module') == 'all' or perm.get('action') == 'all':
                                    return 999  # Large number for "all" permissions
                        count += len(specific_perms)
                else:
                    # Old format: cartesian product
                    role_actions = role_perms.get('actions', [])
                    role_modules = role_perms.get('modules', [])
                    
                    # Count combinations (module × action) for this specific role
                    if 'all' in role_modules or 'all' in role_actions:
                        return 999  # Large number for "all" permissions
                    count += len(role_modules) * len(role_actions)
            
        return count
    
    @classmethod
    def _calculate_user_permissions(cls, user) -> List[str]:
        """Calculate all permissions for a user - only from assigned roles"""
        # For superuser, return all permissions
        if user.is_superuser:
            return ['all']
            
        # For regular admins, get permissions from ONLY assigned AdminRoles
        permissions_set = set()
        
        # Get permissions from assigned AdminRoles ONLY
        if hasattr(user, 'adminuserrole_set'):
            user_role_assignments = user.adminuserrole_set.filter(
                is_active=True
            ).select_related('role')
            
            for user_role in user_role_assignments:
                role_perms = user_role.role.permissions
                
                # ✅ NEW: Check for specific_permissions format first
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
                    # Old format: modules and actions
                    role_modules = role_perms.get('modules', [])
                    role_actions = role_perms.get('actions', [])
                    
                    # Convert role permissions to permission strings
                    for module in role_modules:
                        for action in role_actions:
                            if module != 'all' and action != 'all':
                                permissions_set.add(f"{module}.{action}")
        
        # Also get Django direct permissions (if any)
        for app_label, codename in user.user_permissions.values_list('content_type__app_label', 'codename'):
            permissions_set.add(f"{app_label}.{codename}")
            
        # Also get Django group permissions (if any)
        for group in user.groups.all(): 
            for app_label, codename in group.permissions.values_list('content_type__app_label', 'codename'):
                permissions_set.add(f"{app_label}.{codename}")
        
        return sorted(list(permissions_set))
    
    @classmethod
    def _get_user_roles(cls, user) -> List[str]:
        """Get user's role names - only assigned roles"""
        # For superuser, return super_admin role only
        if user.is_superuser:
            return ['super_admin']
            
        # For regular admins, get ONLY their assigned AdminRoles
        assigned_roles = []
        
        # Check if user has adminuserrole_set (should be available for admin users)
        try:
            if hasattr(user, 'adminuserrole_set'):
                # Only get active role assignments for this specific user
                user_role_assignments = user.adminuserrole_set.filter(
                    is_active=True
                ).select_related('role')
                
                assigned_roles = [ur.role.name for ur in user_role_assignments]
        except Exception as e:
            # Log error but don't fail
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error getting user roles for user {user.id}: {e}")
            
        return assigned_roles
    
    @classmethod
    def _get_accessible_modules(cls, permissions: List[str]) -> List[str]:
        """Extract modules from permissions - optimized"""
        modules = set()
        for perm in permissions:
            if '.' in perm:
                app_label = perm.split('.')[0]
                modules.add(cls.MODULE_MAP.get(app_label, app_label))
        return list(modules)
    
    @classmethod
    def _get_accessible_actions(cls, permissions: List[str]) -> List[str]:
        """Extract actions from permissions - optimized"""
        actions = set()
        for perm in permissions:
            if '.' in perm:
                action = perm.split('.')[1]
                actions.add(cls.ACTION_MAP.get(action, action))
        return list(actions)
    
    @classmethod
    def clear_user_cache(cls, user_id: int) -> None:
        """
        ✅ پاک کردن کامل تمام cache های مربوط به کاربر از Redis
        شامل تمام permission data, profile data, و role data
        """
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
        
        # Also try to clear pattern-based keys if Redis supports it
        try:
            cache.delete_pattern(f"admin_perm_{user_id}_*")
        except (AttributeError, NotImplementedError):
            # Pattern deletion not supported, already cleared specific keys above
            pass
    
    @classmethod
    def clear_all_permission_cache(cls) -> None:
        """Clear all permission caches"""
        # Use pattern matching if available, otherwise clear specific keys
        cache.delete_pattern("admin_perms_*")
    
    @classmethod
    def get_permission_categories(cls, permissions: List[str]) -> Dict[str, List[Dict[str, str]]]:
        """Get permissions organized by categories - for detailed views"""
        categories = {}
        
        for perm in permissions:
            if '.' not in perm:
                continue
                
            app_label, codename = perm.split('.', 1)
            category = cls.MODULE_MAP.get(app_label, app_label.title())
            
            if category not in categories:
                categories[category] = []
            
            # Get permission display name from cache
            cache_key = f"perm_name_{perm}"
            display_name = cache.get(cache_key)
            
            if not display_name:
                # Use codename with spaces (faster than DB query)
                display_name = " ".join(codename.split('_')).title()
                # Cache the result for 24 hours
                cache.set(cache_key, display_name, 86400)
            
            categories[category].append({
                'code': perm,
                'name': display_name
            })
        
        # Sort each category's permissions by name
        for category in categories:
            categories[category] = sorted(categories[category], key=lambda x: x['name'])
            
        return categories