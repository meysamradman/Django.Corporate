from rest_framework import permissions
from django.core.cache import cache
from django.utils import timezone
from django.conf import settings
from typing import List, Dict, Any
from src.user.messages import AUTH_ERRORS
from src.user.access_control.definitions.config import BASE_ADMIN_PERMISSIONS
from src.user.access_control.definitions.module_mappings import MODULE_MAPPINGS
from src.user.utils.cache import UserCacheKeys, UserCacheManager
from src.user.models import AdminUserRole
from src.user.access_control.definitions import PermissionValidator, PermissionRegistry
from src.user.access_control.core.cache_strategy import PermissionCacheStrategy

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
        cache_key = UserCacheKeys.admin_perm_check(user.id, method, view.__class__.__name__)
        
        cached_result = cache.get(cache_key)
        if cached_result is not None:
            return cached_result
        
        has_permission = self._calculate_admin_permission(user, method, view)
        
        timeout = PermissionCacheStrategy.get_cache_timeout(user, method)
        cache.set(cache_key, has_permission, timeout)
        
        return has_permission
    
    def _calculate_admin_permission(self, user, method: str, view) -> bool:
        try:
            view_action = getattr(view, 'action', None)
            view_name = view.__class__.__name__
            
            required_action = self._calculate_required_action(method, view)
            
            user_roles = AdminUserRole.objects.filter(
                user=user,
                is_active=True
            ).select_related(
                'role'
            ).only(
                'role__name',
                'role__permissions',
                'permissions_cache',
                'is_active'
            )
            
            if not user_roles.exists() and user.is_admin_full:
                return True
            
            for user_role in user_roles:
                permissions = user_role.permissions_cache or user_role.role.permissions
                
                has_perm = self._role_has_permission(permissions, required_action, method, view)
                
                if has_perm:
                    return True
            
            return False
            
        except Exception:
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
        has_action = 'all' in allowed_actions or 'manage' in allowed_actions or action in allowed_actions
        
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
        try:
            view_kwargs = getattr(view, 'kwargs', {}) or {}
            if view_kwargs.get('action') == 'me':
                return True
            
            target_id = view_kwargs.get('pk') or view_kwargs.get('admin_id')
            if target_id is None:
                target_id = request.query_params.get('admin_id')
            
            if target_id is None:
                return False
            
            return str(target_id) == str(request.user.id)
        except Exception:
            return False

class RequireAdminRole(AdminRolePermission):
    
    def __init__(self, *required_roles):
        self.required_roles = list(required_roles)
        super().__init__()
    
    def _calculate_admin_permission(self, user, method: str, view) -> bool:
        if not self.required_roles:
            return super()._calculate_admin_permission(user, method, view)
        
        try:
            user_role_names = list(AdminUserRole.objects.filter(
                user=user,
                is_active=True
            ).values_list('role__name', flat=True))
            
            has_required_role = any(role in user_role_names for role in self.required_roles)
            
            if not has_required_role:
                return False
            
            return super()._calculate_admin_permission(user, method, view)
            
        except Exception:
            return False

class RequireModuleAccess(AdminRolePermission):
    
    def __init__(self, *required_modules):
        self.required_modules = list(required_modules)
        self.required_action = getattr(self, 'required_action', None)
        super().__init__()
    
    def _normalize_module_name(self, module: str) -> List[str]:
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
            
            for perm in specific_perms:
                if not isinstance(perm, dict):
                    continue

                permission_key = perm.get('permission_key')
                if permission_key:
                    perm_obj = PermissionRegistry.get(permission_key)
                    if not perm_obj:
                        continue
                    perm_module = perm_obj.module
                    perm_action = perm_obj.action
                else:
                    perm_module = perm.get('module')
                    perm_action = perm.get('action')
                
                if not perm_module or not perm_action:
                    continue
                
                if perm_module == 'all' or perm_action == 'all':
                    return True
                
                if self.required_modules:
                    has_module = any(
                        self._module_matches(perm_module, req_module) 
                        for req_module in self.required_modules
                    )
                else:
                    has_module = True
                
                has_action = (
                    perm_action in ['all', 'manage', 'admin'] or
                    perm_action == action or
                    (perm_action == 'read' and action == 'view') or
                    (perm_action == 'view' and action == 'read')
                )
                
                if has_module and has_action:
                    return True
            
            return False
        
        if self.required_modules:
            allowed_modules = permissions.get('modules', [])
            
            if 'all' in allowed_modules:
                pass
            else:
                has_module_access = any(
                    any(self._module_matches(allowed_mod, req_mod) for allowed_mod in allowed_modules)
                    for req_mod in self.required_modules
                )
                if not has_module_access:
                    return False
        
        allowed_actions = permissions.get('actions', [])
        if 'all' in allowed_actions or 'manage' in allowed_actions:
            return True
        
        return action in allowed_actions or (action == 'view' and 'read' in allowed_actions) or (action == 'read' and 'view' in allowed_actions)

def require_admin_roles(*roles):
    return RequireAdminRole(*roles)

def require_module_access(*modules):
    return RequireModuleAccess(*modules)

def super_admin_only():
    return RequireAdminRole('super_admin')

def user_managers_only():
    return RequireAdminRole('super_admin', 'user_manager')

def media_managers_only():
    return RequireAdminRole('super_admin', 'media_manager')

class UserManagementPermission(AdminRolePermission):
    
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
        
        return self._check_admin_role_permissions(request.user, request.method, view)

class IsAdminUser(permissions.BasePermission):
    
    message = "دسترسی رد شد. این پنل فقط برای مدیران است."
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        if not request.user.is_active:
            return False
        
        user_type = getattr(request.user, "user_type", None)
        if user_type != 'admin':
            return False
        
        if not request.user.is_staff:
            return False
        
        if not getattr(request.user, 'is_admin_active', False):
            return False
        
        return True

class IsSuperAdmin(permissions.BasePermission):
    
    message = "دسترسی رد شد. فقط مدیر کل سیستم می‌تواند به این بخش دسترسی داشته باشد."
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        if not request.user.is_active:
            return False
        
        user_type = getattr(request.user, "user_type", None)
        if user_type != 'admin':
            return False
        
        return bool(
            request.user.is_superuser or 
            getattr(request.user, 'is_admin_full', False)
        )

class SimpleAdminPermission(permissions.BasePermission):
    message = AUTH_ERRORS["auth_not_authorized"]
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        if not request.user.is_active:
            return False
        
        user_type = getattr(request.user, "user_type", None)
        if user_type != 'admin' and not request.user.is_staff:
            return False
        
        if request.user.is_superuser or getattr(request.user, 'is_admin_full', False):
            return True
        
        if not request.user.is_staff:
            return False
        
        if not getattr(request.user, 'is_admin_active', False):
            return False
        
        return True

class SuperAdminOnly(RequireAdminRole):
    def __init__(self):
        super().__init__('super_admin')

class RequirePermission(AdminRolePermission):
    
    def __init__(self, permission_id: str):
        self.permission_id = permission_id
        super().__init__()
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        if not request.user.is_active:
            return False
        
        if getattr(request.user, 'is_superuser', False) or getattr(request.user, 'is_admin_full', False):
            return True
        
        return PermissionValidator.has_permission(request.user, self.permission_id)

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
            
            cache.delete_many(cache_keys_to_clear)
            
            UserCacheManager.invalidate_permissions(user_id)
            
        except Exception:
            pass
    
    @staticmethod
    def clear_all_admin_cache():
        try:
            cache.clear()
        except Exception:
            pass

def _import_permission_classes():
    try:
        import src.user.access_control.definitions.permission_factory as pf
        
        for class_name in pf.__all__:
            globals()[class_name] = getattr(pf, class_name)
    except ImportError:
        pass

_import_permission_classes()
