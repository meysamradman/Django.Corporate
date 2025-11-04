from rest_framework import permissions
from django.core.cache import cache
from django.utils import timezone
from rest_framework import permissions
from typing import List, Dict, Any
import logging

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
            print(f"[PERMISSION DEBUG] AdminRolePermission: User not authenticated - user={request.user}, is_authenticated={getattr(request.user, 'is_authenticated', False)}")
            logger.debug("AdminRolePermission: User not authenticated")
            return False
        
        if not request.user.is_active:
            logger.debug("AdminRolePermission: User not active")
            return False
        
        # Admin panel access check
        if not self._is_valid_admin_user(request.user):
            logger.debug(f"AdminRolePermission: Invalid admin user - is_staff: {request.user.is_staff}, is_admin_active: {request.user.is_admin_active}")
            return False
        
        # Super Admin bypass (fastest path for super admins)
        if request.user.is_admin_full:
            print(f"[PERMISSION DEBUG] AdminRolePermission: Allowing is_admin_full user {request.user.id}")
            logger.debug(f"AdminRolePermission: Allowing is_admin_full user {request.user.id}")
            return True
        
        # Also check is_superuser as fallback
        if getattr(request.user, 'is_superuser', False):
            print(f"[PERMISSION DEBUG] AdminRolePermission: Allowing superuser {request.user.id}")
            logger.debug(f"AdminRolePermission: Allowing superuser {request.user.id}")
            return True
        
        # Role-based permission check with caching
        result = self._check_admin_role_permissions(request.user, request.method, view)
        logger.debug(f"AdminRolePermission: Role-based check result for user {request.user.id}: {result}")
        return result
    
    def _is_valid_admin_user(self, user) -> bool:
        """Fast admin user validation"""
        return (
            user.is_staff and 
            user.is_admin_active and
            user.is_active
        )
    
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
            # Import here to avoid circular imports
            from src.user.models import AdminUserRole
            
            # Map HTTP methods to actions
            method_to_action = {
                'GET': 'read',
                'POST': 'create',
                'PUT': 'update',
                'PATCH': 'update',
                'DELETE': 'delete'
            }
            
            required_action = method_to_action.get(method, 'read')
            
            # Get user's active roles with permissions
            user_roles = AdminUserRole.objects.filter(
                user=user,
                is_active=True
            ).select_related('role').prefetch_related()
            
            # If no roles but is_admin_full, allow for user management operations
            if not user_roles.exists() and user.is_admin_full:
                # Allow user management operations for super admins without specific roles
                logger.debug(f"AdminRolePermission: Allowing is_admin_full user {user.id} without roles")
                return True
            
            # Check each role's permissions
            for user_role in user_roles:
                # Use cached permissions if available
                permissions = user_role.permissions_cache or user_role.role.permissions
                
                if self._role_has_permission(permissions, required_action, view):
                    return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error calculating admin permission for user {user.id}: {e}")
            return False
    
    def _role_has_permission(self, permissions: Dict[str, Any], action: str, view) -> bool:
        """Check if role permissions allow the action"""
        if not isinstance(permissions, dict):
            return False
        
        # ✅ BASE PERMISSIONS: همه ادمین‌ها این دسترسی‌ها رو دارند
        base_permissions = self._check_base_admin_permissions(action, view)
        if base_permissions:
            return True
        
        # Check actions
        allowed_actions = permissions.get('actions', [])
        if 'all' in allowed_actions or action in allowed_actions:
            return True
        
        return False
    
    def _check_base_admin_permissions(self, action: str, view) -> bool:
        """دسترسی‌های پایه که همه ادمین‌ها دارند"""
        view_name = view.__class__.__name__
        
        # 🟢 همه ادمین‌ها می‌تونند:
        base_access_patterns = [
            # Dashboard
            ('GET', 'StatisticsView'),
            ('GET', 'DashboardView'),
            
            # Media - فقط مشاهده
            ('GET', 'MediaView'),
            ('GET', 'AdminMediaView'),
            
            # پروفایل خودشان
            ('GET', 'AdminProfileView'),
            ('PUT', 'AdminProfileView'),
            ('PATCH', 'AdminProfileView'),
            
            # اطلاعات خودشان
            ('GET', 'AdminManagementView'),  # برای /me endpoint
        ]
        
        # چک کن این action و view در لیست پایه هست یا نه
        for allowed_action, allowed_view in base_access_patterns:
            if action == allowed_action.lower() and allowed_view in view_name:
                return True
        
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
        print(f"[PERMISSION DEBUG] RequireAdminRole._calculate_admin_permission: user={user}, required_roles={self.required_roles}")
        if not self.required_roles:
            return super()._calculate_admin_permission(user, method, view)
        
        try:
            from src.user.models import AdminUserRole
            
            # Get user's role names
            user_role_names = list(AdminUserRole.objects.filter(
                user=user,
                is_active=True
            ).values_list('role__name', flat=True))
            
            print(f"[PERMISSION DEBUG] RequireAdminRole: user_role_names={user_role_names}, required={self.required_roles}")
            
            # Check if user has any of the required roles
            has_required_role = any(role in user_role_names for role in self.required_roles)
            
            if not has_required_role:
                print(f"[PERMISSION DEBUG] RequireAdminRole: User does not have required roles")
                return False
            
            # If user has required role, check action permissions
            return super()._calculate_admin_permission(user, method, view)
            
        except Exception as e:
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
    
    def _role_has_permission(self, permissions: Dict[str, Any], action: str, view) -> bool:
        """Override to check module access"""
        if not isinstance(permissions, dict):
            return False
        
        # Check module access first
        if self.required_modules:
            allowed_modules = permissions.get('modules', [])
            
            # If 'all' is in modules, allow everything
            if 'all' in allowed_modules:
                pass  # Continue to action check
            else:
                # Check if user has access to any required module
                has_module_access = any(
                    module in allowed_modules for module in self.required_modules
                )
                if not has_module_access:
                    return False
        
        # Check actions
        allowed_actions = permissions.get('actions', [])
        return 'all' in allowed_actions or action in allowed_actions


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
            logger.debug("UserManagementPermission: User not authenticated")
            return False
        
        if not request.user.is_active:
            logger.debug("UserManagementPermission: User not active")
            return False
        
        # Admin panel access check
        if not self._is_valid_admin_user(request.user):
            logger.debug(f"UserManagementPermission: Invalid admin user - is_staff: {request.user.is_staff}, is_admin_active: {request.user.is_admin_active}")
            return False
        
        # Super Admin bypass (fastest path for super admins)
        if request.user.is_admin_full:
            logger.debug(f"UserManagementPermission: Allowing is_admin_full user {request.user.id}")
            return True
        
        # For regular admins, use role-based permission check
        logger.debug(f"UserManagementPermission: Checking role-based permissions for user {request.user.id}")
        return self._check_admin_role_permissions(request.user, request.method, view)


class SimpleAdminPermission(permissions.BasePermission):
    """
    Simple admin permission that works reliably
    """
    message = "شما مجاز به انجام این عمل نیستید."
    
    def has_permission(self, request, view):
        """Simple permission check - allow all superusers"""
        # Quick checks first
        if not request.user or not request.user.is_authenticated:
            return False
        
        if not request.user.is_active:
            return False
        
        # If user is superuser, allow everything (highest priority)
        if request.user.is_superuser:
            return True
        
        # Check if user is staff
        if not request.user.is_staff:
            return False
        
        # Check if user has admin panel access
        if not getattr(request.user, 'is_admin_active', False):
            return False
        
        # If user is admin_full, allow everything
        if getattr(request.user, 'is_admin_full', False):
            return True
        
        # For now, allow all admin operations while we debug
        return True


# Performance optimized permission combinations
class SuperAdminOnly(RequireAdminRole):
    """Optimized permission class for super admin only"""
    def __init__(self):
        super().__init__('super_admin')

class ContentManagerAccess(RequireAdminRole):
    """Optimized permission class for content managers"""
    def __init__(self):
        super().__init__('super_admin', 'content_manager')

class UserManagerAccess(RequireAdminRole):
    """Optimized permission class for user managers"""
    def __init__(self):
        super().__init__('super_admin', 'user_manager')

class MediaManagerAccess(RequireAdminRole):
    """Optimized permission class for media managers"""
    def __init__(self):
        super().__init__('super_admin', 'media_manager')

class AnalyticsViewerAccess(RequireAdminRole):
    """Optimized permission class for analytics viewers"""
    def __init__(self):
        super().__init__('super_admin', 'analytics_viewer')

class SupportAdminAccess(RequireAdminRole):
    """Optimized permission class for support admins"""
    def __init__(self):
        super().__init__('super_admin', 'support_admin')


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
            logger.error(f"Error clearing permission cache for user {user_id}: {e}")
    
    @staticmethod
    def clear_all_admin_cache():
        """Clear all admin permission cache - use carefully"""
        try:
            # This is a heavy operation, use only when necessary
            cache.clear()
        except Exception as e:
            logger.error(f"Error clearing all admin cache: {e}")
