from rest_framework import permissions
from django.core.cache import cache
from django.utils import timezone
from django.conf import settings
from typing import List, Dict, Any
from src.user.messages import AUTH_ERRORS
from src.user.permissions.config import BASE_ADMIN_PERMISSIONS


class AdminRolePermission(permissions.BasePermission):
    message = "Access denied. Admin permission required."
    cache_timeout = 300
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        if not request.user.is_active:
            return False
        
        if not self._is_valid_admin_user(request.user):
            return False
        
        if request.user.is_admin_full:
            return True
        
        if getattr(request.user, 'is_superuser', False):
            return True
        
        if self._is_accessing_own_profile(request, view):
            return True
        
        result = self._check_admin_role_permissions(request.user, request.method, view)
        return result
    
    def _is_valid_admin_user(self, user) -> bool:
        user_type = getattr(user, "user_type", None)
        return (
            (user_type == 'admin' or user.is_staff) and
            getattr(user, "is_admin_active", True) and
            user.is_active
        )
    
    def _calculate_required_action(self, method: str, view) -> str:
        view_action = getattr(view, 'action', None)
        
        if view_action:
            role_management_actions = ['assign_role', 'remove_role', 'update', 'partial_update']
            if view_action in role_management_actions:
                return 'update'
            
            delete_actions = ['destroy', 'bulk_delete']
            if view_action in delete_actions:
                return 'delete'
            
            create_actions = ['create']
            if view_action in create_actions:
                return 'create'
        
        action_map = {
            'list': 'view',
            'retrieve': 'view',
            'create': 'create',
            'update': 'update',
            'partial_update': 'update',
            'destroy': 'delete',
        }
        
        if view_action and view_action in action_map:
            return action_map[view_action]
        
        if method.upper() == 'GET':
            return 'view'
        elif method.upper() == 'POST':
            return 'create'
        elif method.upper() in ['PUT', 'PATCH']:
            return 'update'
        elif method.upper() == 'DELETE':
            return 'delete'
        
        return 'view'
    
    def _check_admin_role_permissions(self, user, method: str, view) -> bool:
        from src.user.utils.cache import UserCacheKeys
        cache_key = UserCacheKeys.admin_perm_check(user.id, method, view.__class__.__name__)
        
        has_permission = self._calculate_admin_permission(user, method, view)
        
        cache.set(cache_key, has_permission, self.cache_timeout)
        return has_permission
    
    def _calculate_admin_permission(self, user, method: str, view) -> bool:
        try:
            from src.user.models import AdminUserRole
            
            view_action = getattr(view, 'action', None)
            view_name = view.__class__.__name__
            
            required_action = self._calculate_required_action(method, view)
            
            user_roles = AdminUserRole.objects.filter(
                user=user,
                is_active=True
            ).select_related('role').prefetch_related()
            
            if not user_roles.exists() and user.is_admin_full:
                return True
            
            for user_role in user_roles:
                permissions = user_role.permissions_cache or user_role.role.permissions
                
                has_perm = self._role_has_permission(permissions, required_action, method, view)
                
                if has_perm:
                    return True
            
            return False
            
        except Exception as e:
            return False
    
    def _role_has_permission(self, permissions: Dict[str, Any], action: str, method: str, view) -> bool:
        if not isinstance(permissions, dict):
            return False
        
        view_name = view.__class__.__name__
        view_action = getattr(view, 'action', None)
        
        base_permissions = self._check_base_admin_permissions(action, method, view)
        if base_permissions:
            return True
        
        allowed_actions = permissions.get('actions', [])
        has_action = 'all' in allowed_actions or action in allowed_actions
        
        if view_name == 'AdminRoleView':
            allowed_modules = permissions.get('modules', [])
            has_module = 'all' in allowed_modules or 'admin' in allowed_modules
            
            result = has_action and has_module
            return result
        
        return has_action
    
    def _check_base_admin_permissions(self, action: str, method: str, view) -> bool:
        view_name = view.__class__.__name__
        view_action = getattr(view, 'action', None)
        
        if view_action in ['assign_role', 'remove_role']:
            return False
        
        if method.upper() == 'GET' and any(x in view_name for x in ['Statistics', 'Dashboard']):
            return True
        
        if 'Profile' in view_name and method.upper() in ['GET', 'PUT', 'PATCH']:
            return True
        
        return False

    def _is_accessing_own_profile(self, request, view) -> bool:
        """
        Checks whether admin is accessing only their own profile (retrieve/update/me).
        Works for both APIView and ViewSet implementations.
        """
        try:
            view_kwargs = getattr(view, 'kwargs', {}) or {}
            if view_kwargs.get('action') == 'me':
                return True
            
            # Check kwargs for admin identifiers
            target_id = view_kwargs.get('pk') or view_kwargs.get('admin_id')
            if target_id is None:
                # Some APIs pass ?admin_id= in query params
                target_id = request.query_params.get('admin_id')
            
            if target_id is None:
                return False
            
            return str(target_id) == str(request.user.id)
        except Exception as exc:
            return False


class RequireAdminRole(AdminRolePermission):
    """
    Permission class that requires specific admin roles
    Usage: permission_classes = [RequireAdminRole('super_admin', 'content_manager')]
    """
    
    def __init__(self, *required_roles):
        self.required_roles = list(required_roles)
        super().__init__()
    
    def _calculate_admin_permission(self, user, method: str, view) -> bool:
        if not self.required_roles:
            return super()._calculate_admin_permission(user, method, view)
        
        try:
            from src.user.models import AdminUserRole
            
            # Get user's role names
            user_role_names = list(AdminUserRole.objects.filter(
                user=user,
                is_active=True
            ).values_list('role__name', flat=True))
            
            # Check if user has any of the required roles
            has_required_role = any(role in user_role_names for role in self.required_roles)
            
            if not has_required_role:
                return False
            
            # If user has required role, check action permissions
            return super()._calculate_admin_permission(user, method, view)
            
        except Exception as e:
            return False


class RequireModuleAccess(AdminRolePermission):
    
    def __init__(self, *required_modules):
        self.required_modules = list(required_modules)
        self.required_action = getattr(self, 'required_action', None)
        super().__init__()
    
    def _normalize_module_name(self, module: str) -> List[str]:
        from src.user.permissions.permission_factory import MODULE_MAPPINGS
        
        module_mappings = {}
        for base_module, related_modules in MODULE_MAPPINGS.items():
            for variant in related_modules:
                if variant not in module_mappings:
                    module_mappings[variant] = list(related_modules)
                else:
                    module_mappings[variant].extend(related_modules)
                    module_mappings[variant] = list(set(module_mappings[variant]))
        
        return module_mappings.get(module, [module])
    
    def _module_matches(self, perm_module: str, required_module: str) -> bool:
        perm_variants = self._normalize_module_name(perm_module)
        required_variants = self._normalize_module_name(required_module)
        
        return bool(set(perm_variants) & set(required_variants))
    
    def _role_has_permission(self, permissions: Dict[str, Any], action: str, method: str, view) -> bool:
        if not isinstance(permissions, dict):
            return False
        
        if self._check_base_admin_permissions(action, method, view):
            return True
        
        if hasattr(self, 'required_action') and self.required_action:
            view_action = getattr(view, 'action', None)
            read_actions = ['read', 'view']
            read_view_actions = ['list', 'retrieve']
            
            if action in read_actions or (view_action and view_action in read_view_actions):
                action = 'read'
            else:
                action = self.required_action
        
        if 'specific_permissions' in permissions:
            specific_perms = permissions.get('specific_permissions', [])
            if not isinstance(specific_perms, list):
                return False
            
            # Check for exact module+action match in specific_permissions
            for perm in specific_perms:
                if not isinstance(perm, dict):
                    continue
                
                perm_module = perm.get('module')
                perm_action = perm.get('action')
                
                # Skip if module or action is missing
                if not perm_module or not perm_action:
                    continue
                
                # Check for 'all' wildcards
                if perm_module == 'all' or perm_action == 'all':
                    return True
                
                # Check if this permission matches (with normalization)
                if self.required_modules:
                    # Check if any required module matches this permission module
                    has_module = any(
                        self._module_matches(perm_module, req_module) 
                        for req_module in self.required_modules
                    )
                else:
                    has_module = True
                
                # Action can be 'view' or 'read' (both mean the same)
                has_action = perm_action == action or (perm_action == 'read' and action == 'view') or (perm_action == 'view' and action == 'read')
                
                if has_module and has_action:
                    return True
            
            return False
        
        # Old format: check modules AND actions (cartesian product)
        # Check module access first
        if self.required_modules:
            allowed_modules = permissions.get('modules', [])
            
            # If 'all' is in modules, allow everything
            if 'all' in allowed_modules:
                pass  # Continue to action check
            else:
                # Check if user has access to any required module (with normalization)
                has_module_access = any(
                    any(self._module_matches(allowed_mod, req_mod) for allowed_mod in allowed_modules)
                    for req_mod in self.required_modules
                )
                if not has_module_access:
                    return False
        
        # Check actions (with read/view normalization)
        allowed_actions = permissions.get('actions', [])
        if 'all' in allowed_actions:
            return True
        
        # Check direct match or read/view synonym
        return action in allowed_actions or (action == 'view' and 'read' in allowed_actions) or (action == 'read' and 'view' in allowed_actions)


# Decorator functions for easy usage
def require_admin_roles(*roles):
    """
    Decorator function to create RequireAdminRole permission
    Usage: @require_admin_roles('super_admin', 'content_manager')
    """
    return RequireAdminRole(*roles)

def require_module_access(*modules):
    """
    Decorator function to create RequireModuleAccess permission
    Usage: @require_module_access('users', 'media')
    """
    return RequireModuleAccess(*modules)

def super_admin_only():
    """
    Decorator for super admin only access
    Usage: @super_admin_only()
    """
    return RequireAdminRole('super_admin')

def content_managers_only():
    """
    Decorator for content managers and super admins
    Usage: @content_managers_only()
    """
    return RequireAdminRole('super_admin', 'content_manager')

def user_managers_only():
    """
    Decorator for user managers and super admins
    Usage: @user_managers_only()
    """
    return RequireAdminRole('super_admin', 'user_manager')

def media_managers_only():
    """
    Decorator for media managers and super admins
    Usage: @media_managers_only()
    """
    return RequireAdminRole('super_admin', 'media_manager')


class UserManagementPermission(AdminRolePermission):
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        if not request.user.is_active:
            return False
        
        # Admin panel access check
        if not self._is_valid_admin_user(request.user):
            return False
        
        # Super Admin bypass (fastest path for super admins)
        if request.user.is_admin_full:
            return True
        
        # For regular admins, use role-based permission check
        return self._check_admin_role_permissions(request.user, request.method, view)


class SimpleAdminPermission(permissions.BasePermission):
    message = AUTH_ERRORS["auth_not_authorized"]
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Active status check
        if not request.user.is_active:
            return False
        
        # SECURITY: Block regular users from admin panel
        user_type = getattr(request.user, "user_type", None)
        if user_type != 'admin' and not request.user.is_staff:
            return False
        
        # Super admin bypass (full access)
        if request.user.is_superuser or getattr(request.user, 'is_admin_full', False):
            return True
        
        # Staff check
        if not request.user.is_staff:
            return False
        
        # Admin panel access check
        if not getattr(request.user, 'is_admin_active', False):
            return False
        
        # Allow all active admins
        return True


# Performance optimized permission combinations - Auto-generated from registry
class SuperAdminOnly(RequireAdminRole):
    def __init__(self):
        super().__init__('super_admin')

import src.user.permissions.permission_factory as permission_factory

# Make all factory classes available in this module
for class_name in permission_factory.__all__:
    globals()[class_name] = getattr(permission_factory, class_name)

# Legacy aliases for backward compatibility - safe version
def _setup_aliases():
    if 'BlogManagerAccess' in globals():
        globals()['ContentManagerAccess'] = globals()['BlogManagerAccess']
    if 'UsersManagerAccess' in globals():
        globals()['UserManagerAccess'] = globals()['UsersManagerAccess']
        globals()['SupportAdminAccess'] = globals()['UsersManagerAccess']
    if 'StatisticsManagerAccess' in globals():
        globals()['AnalyticsViewerAccess'] = globals()['StatisticsManagerAccess']

_setup_aliases()

class RequirePermission(AdminRolePermission):
    """
    Permission class that requires specific permission ID from registry
    Usage: permission_classes = [RequirePermission('ai.chat.manage')]
    """
    
    def __init__(self, permission_id: str):
        self.permission_id = permission_id
        super().__init__()
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        if not request.user.is_active:
            return False
        
        # Super admin bypass
        if getattr(request.user, 'is_superuser', False) or getattr(request.user, 'is_admin_full', False):
            return True
        
        # Check permission using PermissionValidator
        from src.user.permissions import PermissionValidator
        return PermissionValidator.has_permission(request.user, self.permission_id)


# Cache management utilities
class AdminPermissionCache:
    
    @staticmethod
    def clear_user_cache(user_id: int):
        try:
            methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
            
            cache_keys_to_clear = []
            
            for method in methods:
                cache_keys_to_clear.extend([
                    f"admin_perm_{user_id}_{method}_AdminManagementView",
                    f"admin_perm_{user_id}_{method}_AdminRoleView",
                    f"admin_perm_{user_id}_{method}_AdminPermissionView",
                    f"admin_perm_{user_id}_{method}_AdminProfileView",
                    f"admin_perm_{user_id}_{method}_UserManagementView",
                ])
            
            # General permission cache keys
            cache_keys_to_clear.extend([
                f"admin_permissions_{user_id}",
                f"admin_roles_{user_id}",
                f"admin_info_{user_id}",
                f"user_permissions_{user_id}",
                f"user_modules_actions_{user_id}",
                f"admin_perms_{user_id}",
                f"admin_simple_perms_{user_id}",
                f"admin_profile_{user_id}_super",
                f"admin_profile_{user_id}_regular",
            ])
            
            # Clear all keys at once
            cache.delete_many(cache_keys_to_clear)
            
            # ✅ Use Cache Manager for standardized cache invalidation (Redis)
            from src.user.utils.cache import UserCacheManager
            try:
                UserCacheManager.invalidate_permissions(user_id)
            except Exception:
                # Fallback if pattern deletion not supported
                pass
            
        except Exception:
            pass
    
    @staticmethod
    def clear_all_admin_cache():
        try:
            cache.clear()
        except Exception:
            pass
