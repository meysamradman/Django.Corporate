from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.core.cache import cache
from src.core.responses.response import APIResponse
from src.user.utils.cache import UserCacheKeys
from .registry import PermissionRegistry
from .validator import PermissionValidator
from .config import BASE_ADMIN_PERMISSIONS
from src.user.messages.permission import PERMISSION_SUCCESS, PERMISSION_ERRORS

@api_view(["GET"])
def get_permission_map(request):
    
    try:
        cache_key_all_perms = UserCacheKeys.permission_map()
        all_permissions = cache.get(cache_key_all_perms)
        if all_permissions is None:
            all_permissions = PermissionRegistry.export_for_frontend()
            cache.set(cache_key_all_perms, all_permissions, 3600)
        
        is_authenticated = request.user and request.user.is_authenticated
        
        if is_authenticated:
            user_permissions = PermissionValidator.get_user_permissions(request.user)
            base_permissions = list(BASE_ADMIN_PERMISSIONS.keys())
            is_superadmin = bool(
                getattr(request.user, "is_superuser", False) or getattr(request.user, "is_admin_full", False)
            )
        else:
            user_permissions = []
            base_permissions = []
            is_superadmin = False
        
        return APIResponse.success(
            message=PERMISSION_SUCCESS["permission_map_retrieved"],
            data={
                "all_permissions": all_permissions,
                "user_permissions": user_permissions,
                "base_permissions": base_permissions,
                "is_superadmin": is_superadmin,
                "is_authenticated": is_authenticated,
            },
            status_code=status.HTTP_200_OK,
        )
    except Exception as e:
        return APIResponse.error(
            message=PERMISSION_ERRORS["permission_map_failed"],
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

@api_view(["POST"])
def check_permission(request):
    
    try:
        permission_ids = request.data.get("permissions", [])
        if not isinstance(permission_ids, list):
            return APIResponse.error(
                message=PERMISSION_ERRORS["permissions_must_be_list"],
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        is_authenticated = request.user and request.user.is_authenticated
        
        if not is_authenticated:
            results = {perm_id: False for perm_id in permission_ids}
        else:
            is_superadmin = bool(
                getattr(request.user, "is_superuser", False) or getattr(request.user, "is_admin_full", False)
            )
            
            if is_superadmin:
                results = {perm_id: True for perm_id in permission_ids}
            else:
                user_perms_set = set(PermissionValidator.get_user_permissions(request.user))
                results = {perm_id: perm_id in user_perms_set for perm_id in permission_ids}
        
        return APIResponse.success(
            message=PERMISSION_SUCCESS["permission_check_completed"],
            data={
                "results": results,
                "has_all": all(results.values()) if results else False,
                "has_any": any(results.values()) if results else False,
                "is_authenticated": is_authenticated,
            },
            status_code=status.HTTP_200_OK,
        )
    except Exception as e:
        return APIResponse.error(
            message=PERMISSION_ERRORS["permission_check_failed"],
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

