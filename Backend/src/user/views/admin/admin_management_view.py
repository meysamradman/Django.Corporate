from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework.views import APIView
from rest_framework.exceptions import PermissionDenied, NotFound
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from src.user.auth.admin_session_auth import CSRFExemptSessionAuthentication
from src.core.responses import APIResponse
from src.user.serializers.admin.admin_management_serializer import (
    AdminListSerializer,
    AdminDetailSerializer,
    AdminUpdateSerializer,
    AdminFilterSerializer,
    BulkDeleteSerializer
)
from src.user.services.admin.admin_management_service import AdminManagementService
from src.user.messages import AUTH_ERRORS, AUTH_SUCCESS
from src.user.models import User
from src.user.auth.auth_mixin import UserAuthMixin
from src.user.authorization import SimpleAdminPermission
from src.core.pagination.pagination import StandardLimitPagination


@method_decorator(ensure_csrf_cookie, name='dispatch')
class AdminManagementView(UserAuthMixin, APIView):
    authentication_classes = [CSRFExemptSessionAuthentication]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    pagination_class = StandardLimitPagination
    # No throttling for admin operations - admins can work freely

    def get_permissions(self):
        return [SimpleAdminPermission()]

    def get(self, request, admin_id=None, **kwargs):
        try:
            action = kwargs.get('action')
            if action == 'me':
                admin_id = request.user.id

            if admin_id:
                is_own_profile = str(admin_id) == str(request.user.id)
                if not is_own_profile and not self._can_view_other_admins(request.user):
                    return self._forbidden_response(AUTH_ERRORS["admin_profile_view_restricted"])

                try:
                    admin = AdminManagementService.get_admin_detail(admin_id)
                    serializer = AdminDetailSerializer(admin, context={'request': request})
                    return APIResponse.success(
                        message=AUTH_SUCCESS["user_retrieved_successfully"],
                        data=serializer.data
                    )
                except Exception as exc:
                    return APIResponse.error(
                        message=AUTH_ERRORS["error_occurred"],
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )

            # Check if user can view admin list - extra security layer
            if not self._can_view_other_admins(request.user):
                return self._forbidden_response(AUTH_ERRORS["admin_list_view_forbidden"])

            filter_serializer = AdminFilterSerializer(data=request.query_params)
            if not filter_serializer.is_valid():
                return APIResponse.error(
                    message=AUTH_ERRORS["auth_validation_error"],
                    errors=filter_serializer.errors
                )

            validated_filters = filter_serializer.validated_data
            search_value = validated_filters.get('search')
            is_active_filter = validated_filters.get('is_active')

            admins_data = AdminManagementService.get_admins_list(
                search=search_value,
                is_active=is_active_filter,
                is_superuser=validated_filters.get('is_superuser'),
                request=request
            )
            
            if isinstance(admins_data, dict) and 'admins' in admins_data:
                admins = admins_data['admins']
            elif isinstance(admins_data, tuple) and len(admins_data) == 2:
                admins, _ = admins_data
            else:
                admins = admins_data
            
            paginator = self.pagination_class()
            paginated_admins = paginator.paginate_queryset(admins, request)
            
            serializer = AdminListSerializer(paginated_admins, many=True, context={'request': request})
            
            return paginator.get_paginated_response(serializer.data)
                
        except PermissionDenied:
            return self._forbidden_response()
        except Exception as exc:
            return APIResponse.error(
                message=AUTH_ERRORS["error_occurred"],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @staticmethod
    def get_by_public_id(request, public_id=None):
        try:
            admin = AdminManagementService.get_admin_detail(public_id)
            serializer = AdminDetailSerializer(admin, context={'request': request})
            return APIResponse.success(
                message=AUTH_SUCCESS["user_retrieved_successfully"],
                data=serializer.data
            )
        except Exception as e:
            return APIResponse.error(
                message=AUTH_ERRORS.get("error_occurred"),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def post(self, request, *args, **kwargs):
        bulk_action = kwargs.get('action')
        
        if bulk_action == 'bulk-delete':
            return self.bulk_delete_post(request)
        else:
            return self.create_admin_post(request)

    def create_admin_post(self, request):
        from src.user.serializers.admin.admin_register_serializer import AdminRegisterSerializer
        serializer = AdminRegisterSerializer(data=request.data, context={'admin_user': request.user})
        
        if not serializer.is_valid():
            return APIResponse.error(
                message=AUTH_ERRORS["auth_validation_error"],
                errors=serializer.errors
            )
            
        try:
            from src.user.services.admin.admin_register_service import AdminRegisterService
            admin = AdminRegisterService.register_admin_from_serializer(
                validated_data=serializer.validated_data,
                admin_user=request.user
            )
            
            response_serializer = AdminDetailSerializer(admin, context={'request': request})
            return APIResponse.success(
                message=AUTH_SUCCESS["user_created_successfully"],
                data=response_serializer.data
            )
        except Exception as e:
            return APIResponse.error(
                message=AUTH_ERRORS.get("error_occurred"),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def bulk_delete_post(self, request):
        serializer = BulkDeleteSerializer(data=request.data)
        if not serializer.is_valid():
            return APIResponse.error(
                message=AUTH_ERRORS["auth_validation_error"],
                errors=serializer.errors
            )
            
        admin_ids = serializer.validated_data.get('ids', [])
        
        try:
            deleted_count = AdminManagementService.bulk_delete_admins(admin_ids, admin_user=request.user)
            
            return APIResponse.success(
                message=AUTH_SUCCESS["users_deleted_successfully"].format(count=deleted_count),
                data={'deleted_count': deleted_count}
            )
        except Exception as e:
            return APIResponse.error(
                message=AUTH_ERRORS.get("error_occurred"),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def put(self, request, admin_id, **kwargs):
        try:
            is_own_profile = str(admin_id) == str(request.user.id)
            admin = AdminManagementService.get_admin_detail(admin_id)

            if not is_own_profile:
                if not self._can_edit_other_admins(request.user):
                    return self._forbidden_response(AUTH_ERRORS["admin_profile_edit_restricted"])
                if admin.is_admin_full and not self._is_super_admin(request.user):
                    return self._forbidden_response(AUTH_ERRORS["admin_superadmin_edit_forbidden"])
            else:
                restricted_fields = ['is_superuser', 'is_staff', 'is_admin_full', 'role_id', 'roles', 'permissions']
                for field in restricted_fields:
                    if field in request.data:
                        return self._forbidden_response(
                            AUTH_ERRORS["admin_field_edit_forbidden"].format(field=field)
                        )

            payload = request.data.copy()
            serializer = AdminUpdateSerializer(
                data=payload,
                context={'user_id': admin_id, 'admin_user': request.user, 'request': request},
                partial=True
            )
            
            if not serializer.is_valid():
                return APIResponse.error(
                    message=AUTH_ERRORS["auth_validation_error"],
                    errors=serializer.errors
                )
            
            updated_admin = AdminManagementService.update_admin(admin_id, serializer.validated_data, request.user)
            
            response_serializer = AdminDetailSerializer(updated_admin, context={'request': request})
            return APIResponse.success(
                message=AUTH_SUCCESS["user_updated_successfully"],
                data=response_serializer.data
            )
            
        except PermissionDenied:
            return self._forbidden_response()
        except Exception as exc:
            return APIResponse.error(
                message=AUTH_ERRORS.get("error_occurred"),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def delete(self, request, admin_id, **kwargs):
        try:
            if str(request.user.id) == str(admin_id):
                return self._forbidden_response(AUTH_ERRORS["admin_cannot_self_delete"])

            if not self._can_delete_other_admins(request.user):
                return self._forbidden_response(AUTH_ERRORS["admin_delete_superadmin_required"])

            admin = AdminManagementService.get_admin_detail(admin_id)
            if admin.is_admin_full:
                return self._forbidden_response(AUTH_ERRORS["admin_superadmin_delete_forbidden"])
            
            AdminManagementService.delete_admin(admin_id, admin_user=request.user)
            
            return APIResponse.success(
                message=AUTH_SUCCESS["user_deleted_successfully"]
            )
            
        except PermissionDenied:
            return self._forbidden_response()
        except Exception as exc:
            return APIResponse.error(
                message=AUTH_ERRORS.get("error_occurred"),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    # Helper methods
    def _forbidden_response(self, message=None):
        return APIResponse.error(
            message=message or AUTH_ERRORS["auth_not_authorized"],
            status_code=status.HTTP_403_FORBIDDEN
        )

    def _is_super_admin(self, user):
        return getattr(user, 'is_admin_full', False) or getattr(user, 'is_superuser', False)

    def _has_role(self, user, role_name: str) -> bool:
        try:
            return hasattr(user, 'adminuserrole_set') and user.adminuserrole_set.filter(
                role__name=role_name,
                is_active=True
            ).exists()
        except Exception:
            return False

    def _can_view_other_admins(self, user):
        # Super admin has full access
        if self._is_super_admin(user):
            return True
        
        # User manager role has full access
        if self._has_role(user, 'user_manager'):
            return True
        
        # All active admin users can view the list (read-only)
        # Edit/delete operations have separate checks
        user_type = getattr(user, 'user_type', None)
        is_admin_active = getattr(user, 'is_admin_active', False)
        
        return user_type == 'admin' and is_admin_active

    def _can_edit_other_admins(self, user):
        return self._is_super_admin(user)

    def _can_delete_other_admins(self, user):
        return self._is_super_admin(user)