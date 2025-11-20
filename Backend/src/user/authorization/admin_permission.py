from rest_framework import permissions
from django.core.cache import cache
from django.utils import timezone
from django.conf import settings
from typing import List, Dict, Any
import logging
from src.user.messages import AUTH_ERRORS
from src.user.permissions.config import BASE_ADMIN_PERMISSIONS

logger = logging.getLogger(__name__)


class AdminRolePermission(permissions.BasePermission):
    """
    High-performance permission system for admin panel based on AdminRole
    Compatible with Django 5.2.6 and optimized for speed
    Uses Redis caching and JSON-based permissions from AdminRole model
    """
    message = "Access denied. Admin permission required."
    cache_timeout = 300  # 5 minutes
    
    def has_permission(self, request, view):
        """Main permission check with multiple optimization layers"""
        # Quick checks first (fastest)
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
        
        # Also check is_superuser as fallback
        if getattr(request.user, 'is_superuser', False):
            return True
        
        # Allow admins to access their own profile without extra role checks
        if self._is_accessing_own_profile(request, view):
            return True
        
        # Role-based permission check with caching
        result = self._check_admin_role_permissions(request.user, request.method, view)
        return result
    
    def _is_valid_admin_user(self, user) -> bool:
        """
        Fast admin user validation
        فقط ادمین‌ها می‌تونن به API های admin دسترسی داشته باشن
        کاربران معمولی (user_type='user') رد می‌شن
        """
        user_type = getattr(user, "user_type", None)
        return (
            (user_type == 'admin' or user.is_staff) and  # فقط ادمین‌ها
            getattr(user, "is_admin_active", True) and
            user.is_active
        )
    
    def _calculate_required_action(self, method: str, view) -> str:
        """
        ✅ NEW: Map HTTP method and DRF action to permission action
        DRF uses: list, retrieve, create, update, partial_update, destroy
        We use: view, create, update, delete
        """
        # Get DRF action name from view
        view_action = getattr(view, 'action', None)
        
        # Map DRF actions to our permission actions
        action_map = {
            'list': 'view',
            'retrieve': 'view',
            'create': 'create',
            'update': 'update',
            'partial_update': 'update',
            'destroy': 'delete',
        }
        
        # Use mapping if action is known
        if view_action and view_action in action_map:
            return action_map[view_action]
        
        # Fallback to method-based mapping
        if method.upper() == 'GET':
            return 'view'
        elif method.upper() == 'POST':
            return 'create'
        elif method.upper() in ['PUT', 'PATCH']:
            return 'update'
        elif method.upper() == 'DELETE':
            return 'delete'
        
        # Default to view for safety
        return 'view'
    
    def _check_admin_role_permissions(self, user, method: str, view) -> bool:
        """Check permissions using AdminRole system with Redis caching"""
        # Generate cache key
        cache_key = f"admin_perm_{user.id}_{method}_{view.__class__.__name__}"
        
        # Skip cache for now to ensure fresh permissions
        # cached_result = cache.get(cache_key)
        # if cached_result is not None:
        #     return cached_result
        
        # Calculate permission
        has_permission = self._calculate_admin_permission(user, method, view)
        
        # Cache the result
        cache.set(cache_key, has_permission, self.cache_timeout)
        return has_permission
    
    def _calculate_admin_permission(self, user, method: str, view) -> bool:
        """Calculate permission based on AdminRole permissions"""
        try:
            from src.user.models import AdminUserRole
            
            # ✅ NEW: Use the new action mapping
            required_action = self._calculate_required_action(method, view)
            
            # Get user's active roles with permissions
            user_roles = AdminUserRole.objects.filter(
                user=user,
                is_active=True
            ).select_related('role').prefetch_related()
            
            # If no roles but is_admin_full, allow for user management operations
            if not user_roles.exists() and user.is_admin_full:
                return True
            
            # Check each role's permissions
            for user_role in user_roles:
                permissions = user_role.permissions_cache or user_role.role.permissions
                
                if self._role_has_permission(permissions, required_action, method, view):
                    return True
            
            return False
            
        except Exception as e:
            if settings.DEBUG:
                logger.error(f"Error calculating admin permission for user {user.id}: {e}")
            return False
    
    def _role_has_permission(self, permissions: Dict[str, Any], action: str, method: str, view) -> bool:
        """Check if role permissions allow the action"""
        if not isinstance(permissions, dict):
            return False
        
        # Base permissions that every admin inherits
        base_permissions = self._check_base_admin_permissions(action, method, view)
        if base_permissions:
            return True
        
        # Check actions
        allowed_actions = permissions.get('actions', [])
        if 'all' in allowed_actions or action in allowed_actions:
            return True
        
        return False
    
    def _check_base_admin_permissions(self, action: str, method: str, view) -> bool:
        """Set of baseline permissions granted to every admin - using config."""
        # Only these permissions are in BASE_ADMIN_PERMISSIONS:
        # - dashboard.read (Statistics dashboard overview)
        # - profile.read (own profile)
        # - profile.update (own profile)
        # Media is NO LONGER in base - requires explicit permission
        
        view_name = view.__class__.__name__
        
        # Dashboard/Statistics - only general overview (GET)
        if method.upper() == 'GET' and any(x in view_name for x in ['Statistics', 'Dashboard']):
            # Only allow if it's the general dashboard endpoint
            # Specific stats endpoints (users_stats, admins_stats) will be blocked
            return True
        
        # Profile read/update (own profile only)
        if 'Profile' in view_name and method.upper() in ['GET', 'PUT', 'PATCH']:
            return True
        
        # Everything else requires explicit permission
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
        """Override to check specific roles"""
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
            if settings.DEBUG:
                logger.error(f"Error checking required roles for user {user.id}: {e}")
            return False


class RequireModuleAccess(AdminRolePermission):
    """
    Permission class that requires access to specific modules
    Usage: permission_classes = [RequireModuleAccess('users', 'media')]
    """
    
    def __init__(self, *required_modules):
        self.required_modules = list(required_modules)
        super().__init__()
    
    def _normalize_module_name(self, module: str) -> List[str]:
        """Normalize module names to handle different formats - Auto-generated from factory"""
        # Import module mappings from factory to avoid duplication
        from src.user.permissions.permission_factory import MODULE_MAPPINGS
        
        # Build normalization map from MODULE_MAPPINGS
        module_mappings = {}
        for base_module, related_modules in MODULE_MAPPINGS.items():
            # Add all variants
            for variant in related_modules:
                if variant not in module_mappings:
                    module_mappings[variant] = list(related_modules)
                else:
                    module_mappings[variant].extend(related_modules)
                    module_mappings[variant] = list(set(module_mappings[variant]))
        
        # Return all possible variants for this module
        return module_mappings.get(module, [module])
    
    def _module_matches(self, perm_module: str, required_module: str) -> bool:
        """Check if permission module matches required module (with normalization)"""
        # Get all possible names for both modules
        perm_variants = self._normalize_module_name(perm_module)
        required_variants = self._normalize_module_name(required_module)
        
        # Check if any variant matches
        return bool(set(perm_variants) & set(required_variants))
    
    def _role_has_permission(self, permissions: Dict[str, Any], action: str, method: str, view) -> bool:
        """Check if role has permission for specific action and module"""
        if not isinstance(permissions, dict):
            return False
        
        # Allow baseline read-only access
        if self._check_base_admin_permissions(action, method, view):
            return True
        
        # ✅ Check specific_permissions format first (precise)
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
    """
    Special permission for user management that allows is_admin_full users
    to manage regular users even without specific roles
    """
    
    def has_permission(self, request, view):
        """Check permission for user management operations"""
        # Quick checks first
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
    """
    Base permission for admin panel access.
    Only allows authenticated admin users (user_type='admin').
    Regular users (user_type='user') are blocked.
    """
    message = AUTH_ERRORS["auth_not_authorized"]
    
    def has_permission(self, request, view):
        """Check if user is an active admin with panel access"""
        # Authentication check
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
    """Optimized permission class for super admin only"""
    def __init__(self):
        super().__init__('super_admin')

# Import all auto-generated permission classes from factory
# این import خودکار همه کلاس‌ها رو میاره - نیازی به لیست کردن نیست!
import src.user.permissions.permission_factory as permission_factory

# Make all factory classes available in this module
for class_name in permission_factory.__all__:
    globals()[class_name] = getattr(permission_factory, class_name)

# Legacy aliases for backward compatibility - safe version
def _setup_aliases():
    """Setup backward compatibility aliases"""
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
        """Check if user has the specific permission"""
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
    """Utility class for managing admin permission cache"""
    
    @staticmethod
    def clear_user_cache(user_id: int):
        """Clear all cached permissions for a specific user"""
        try:
            # Clear all permission cache keys for this user
            cache_pattern = f"admin_perm_{user_id}_*"
            
            # Since Django cache doesn't support pattern deletion by default,
            # we'll clear specific known patterns
            methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
            
            # This is a simplified approach - in production you might want to use
            # Redis directly for pattern-based deletion
            cache_keys_to_clear = []
            for method in methods:
                # Add common view patterns - you can expand this based on your views
                cache_keys_to_clear.extend([
                    f"admin_perm_{user_id}_{method}_AdminManagementView",
                    f"admin_perm_{user_id}_{method}_AdminRoleView",
                    f"admin_perm_{user_id}_{method}_AdminPermissionView",
                ])
            
            cache.delete_many(cache_keys_to_clear)
            
            # Also clear user's general permission cache
            cache.delete_many([
                f"admin_permissions_{user_id}",
                f"admin_roles_{user_id}",
                f"admin_info_{user_id}"
            ])
            
        except Exception as e:
            if settings.DEBUG:
                logger.error(f"Error clearing permission cache for user {user_id}: {e}")
    
    @staticmethod
    def clear_all_admin_cache():
        """Clear all admin permission cache - use carefully"""
        try:
            # This is a heavy operation, use only when necessary
            cache.clear()
        except Exception as e:
            if settings.DEBUG:
                logger.error(f"Error clearing all admin cache: {e}")
