

from rest_framework import status
from src.core.responses.response import APIResponse
from src.user.access_control.definitions import PermissionValidator

class PermissionRequiredMixin:
    
    permission_map = {}
    permission_denied_message = "شما اجازه دسترسی به این بخش را ندارید"
    permission_require_all = False  # اگر True باشه، برای list permissions همه رو چک می‌کنه (AND logic)
    
    def initial(self, request, *args, **kwargs):
        
        super().initial(request, *args, **kwargs)
        
        action = getattr(self, 'action', None)
        if not action:
            return
        
        required_permission = self.permission_map.get(action)
        if not required_permission:
            return  # No specific permission required
        
        user = request.user
        if getattr(user, 'is_superuser', False) or getattr(user, 'is_admin_full', False):
            return
        
        if isinstance(required_permission, list):
            if getattr(self, 'permission_require_all', False):
                has_permission = PermissionValidator.has_all_permissions(user, required_permission)
            else:
                has_permission = PermissionValidator.has_any_permission(user, required_permission)
        else:
            has_permission = PermissionValidator.has_permission(user, required_permission)
        
        if not has_permission:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied(self.permission_denied_message)

class RealEstatePermissionMixin(PermissionRequiredMixin):
    
    permission_denied_message = "شما اجازه دسترسی به بخش املاک را ندارید"
    
    def get_permission_map(self):
        
        return {}
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        custom_map = self.get_permission_map()
        if custom_map:
            self.permission_map = {**self.permission_map, **custom_map}
