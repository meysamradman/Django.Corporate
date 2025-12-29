"""
Permission Mixin - حذف تکرار Permission Check از ViewSet ها
✅ استاندارد 2025: DRY Principle
"""

from rest_framework import status
from src.core.responses.response import APIResponse
from src.user.access_control.definitions import PermissionValidator


class PermissionRequiredMixin:
    """
    Mixin برای automatic permission checking بر اساس action
    
    استفاده:
        class PropertyAdminViewSet(PermissionRequiredMixin, viewsets.ModelViewSet):
            permission_map = {
                'list': 'real_estate.property.read',
                'retrieve': 'real_estate.property.read',
                'create': 'real_estate.property.create',
                'update': 'real_estate.property.update',
                'destroy': 'real_estate.property.delete',
                'publish': 'real_estate.property.update',
                'bulk_delete': 'real_estate.property.delete',
            }
            permission_denied_message = "شما اجازه دسترسی به این بخش را ندارید"
    """
    permission_map = {}
    permission_denied_message = "شما اجازه دسترسی به این بخش را ندارید"
    permission_require_all = False  # اگر True باشه، برای list permissions همه رو چک می‌کنه (AND logic)
    
    def initial(self, request, *args, **kwargs):
        """Override DRF's initial to check permissions after action is set"""
        # Call parent first - this will call check_permissions
        super().initial(request, *args, **kwargs)
        
        # After initial, action should be set (it's set in dispatch before initial)
        action = getattr(self, 'action', None)
        if not action:
            return
        
        # Get required permission for this action
        required_permission = self.permission_map.get(action)
        if not required_permission:
            return  # No specific permission required
        
        # Super admin bypass
        user = request.user
        if getattr(user, 'is_superuser', False) or getattr(user, 'is_admin_full', False):
            return
        
        # Check permission - support both single permission and list of permissions
        if isinstance(required_permission, list):
            # Check if user has ANY (OR logic) or ALL (AND logic) of the permissions
            if getattr(self, 'permission_require_all', False):
                # AND logic: باید همه permissions رو داشته باشه
                has_permission = PermissionValidator.has_all_permissions(user, required_permission)
            else:
                # OR logic (default): کافیه یکی از permissions رو داشته باشه
                has_permission = PermissionValidator.has_any_permission(user, required_permission)
        else:
            # If it's a single permission string, check normally
            has_permission = PermissionValidator.has_permission(user, required_permission)
        
        if not has_permission:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied(self.permission_denied_message)


class RealEstatePermissionMixin(PermissionRequiredMixin):
    """
    Mixin مخصوص Real Estate با permission map پیش‌فرض
    """
    permission_denied_message = "شما اجازه دسترسی به بخش املاک را ندارید"
    
    def get_permission_map(self):
        """
        Override this method برای customize کردن permissions
        """
        return {}
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Merge default permissions with custom ones
        custom_map = self.get_permission_map()
        if custom_map:
            self.permission_map = {**self.permission_map, **custom_map}
