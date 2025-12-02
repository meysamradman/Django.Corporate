from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.core.cache import cache
from src.core.responses.response import APIResponse
from .registry import PermissionRegistry
from .validator import PermissionValidator
from .config import BASE_ADMIN_PERMISSIONS
from src.user.messages.permission import PERMISSION_SUCCESS, PERMISSION_ERRORS


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_permission_map(request):
    try:
        import logging
        logger = logging.getLogger(__name__)
        
        # ✅ Use standardized cache key from UserCacheKeys
        from src.user.utils.cache import UserCacheKeys
        cache_key_all_perms = UserCacheKeys.permission_map()
        all_permissions = cache.get(cache_key_all_perms)
        if all_permissions is None:
            all_permissions = PermissionRegistry.export_for_frontend()
            cache.set(cache_key_all_perms, all_permissions, 3600)
        
        user_permissions = PermissionValidator.get_user_permissions(request.user)
        
        # Get base permissions (همیشه برای همه ادمین‌ها رایگان)
        base_permissions = list(BASE_ADMIN_PERMISSIONS.keys())
        
        return APIResponse.success(
            message=PERMISSION_SUCCESS["permission_map_retrieved"],
            data={
                "all_permissions": all_permissions,
                "user_permissions": user_permissions,
                "base_permissions": base_permissions,
                "is_superadmin": bool(
                    getattr(request.user, "is_superuser", False) or getattr(request.user, "is_admin_full", False)
                ),
            },
            status_code=status.HTTP_200_OK,
        )
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error getting permission map: {e}", exc_info=True)
        return APIResponse.error(
            message=PERMISSION_ERRORS["permission_map_failed"],
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def check_permission(request):
    try:
        permission_ids = request.data.get("permissions", [])
        if not isinstance(permission_ids, list):
            return APIResponse.error(
                message=PERMISSION_ERRORS["permissions_must_be_list"],
                status_code=status.HTTP_400_BAD_REQUEST,
            )

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
            },
            status_code=status.HTTP_200_OK,
        )
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error checking permissions: {e}", exc_info=True)
        return APIResponse.error(
            message=PERMISSION_ERRORS["permission_check_failed"],
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

