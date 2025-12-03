from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework.views import APIView
from rest_framework.exceptions import PermissionDenied, NotFound
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from src.user.auth.admin_session_auth import CSRFExemptSessionAuthentication
from src.core.responses import APIResponse
from src.user.serializers.admin.user_management_serializer import (
    UserListSerializer,
    UserDetailSerializer,
    UserUpdateSerializer,
    UserFilterSerializer,
    BulkDeleteSerializer
)
from src.user.serializers.admin.admin_register_serializer import AdminCreateRegularUserSerializer
from src.user.services.admin.user_management_service import UserManagementService
from src.user.messages import AUTH_ERRORS, AUTH_SUCCESS
from src.user.models import User
from src.user.auth.auth_mixin import UserAuthMixin
from src.user.authorization import (
    AdminRolePermission,
    UserManagementPermission,
    SimpleAdminPermission,
    require_admin_roles,
    SuperAdminOnly,
    UserManagerAccess
)
from src.user.permissions import PermissionValidator
from src.core.pagination.pagination import StandardLimitPagination


@method_decorator(ensure_csrf_cookie, name='dispatch')
class UserManagementView(UserAuthMixin, APIView):
    authentication_classes = [CSRFExemptSessionAuthentication]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    pagination_class = StandardLimitPagination

    def get_permissions(self):
        return [UserManagerAccess()]

    def get(self, request, user_id=None):
        if not PermissionValidator.has_permission(request.user, 'users.read'):
            return APIResponse.error(
                message=AUTH_ERRORS["auth_not_authorized"],
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        try:
            if user_id:
                try:
                    user = UserManagementService.get_user_detail(user_id)
                    if user.is_staff:
                        raise NotFound(AUTH_ERRORS["not_found"])
                    serializer = UserDetailSerializer(user, context={'request': request})
                    return APIResponse.success(
                        message=AUTH_SUCCESS["user_retrieved_successfully"],
                        data=serializer.data
                    )
                except Exception as e:
                    return APIResponse.error(message=AUTH_ERRORS["error_occurred"])

            filter_serializer = UserFilterSerializer(data=request.query_params)
            if not filter_serializer.is_valid():
                return APIResponse.error(
                    message=AUTH_ERRORS["auth_validation_error"],
                    errors=filter_serializer.errors
                )

            validated_filters = filter_serializer.validated_data
            search_value = validated_filters.get('search')
            is_active_filter = validated_filters.get('is_active')

            try:
                users_data = UserManagementService.get_users_list(
                    search=search_value,
                    is_active=is_active_filter,
                    request=request
                )
                
                if isinstance(users_data, dict) and 'users' in users_data:
                    users = users_data['users']
                elif isinstance(users_data, tuple) and len(users_data) == 2:
                    users, _ = users_data
                else:
                    users = users_data
                
                paginator = self.pagination_class()
                paginated_users = paginator.paginate_queryset(users, request)
                
                serializer = UserListSerializer(paginated_users, many=True, context={'request': request})
                
                return paginator.get_paginated_response(serializer.data)
            except Exception as e:
                return APIResponse.error(
                    message=AUTH_ERRORS["error_fetching_users"],
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
        except PermissionDenied as e:
            return APIResponse.error(
                message=AUTH_ERRORS["auth_not_authorized"],
                status_code=status.HTTP_403_FORBIDDEN
            )
        except Exception as e:
            return APIResponse.error(
                message=AUTH_ERRORS["error_occurred"],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @staticmethod
    def get_by_public_id(request, public_id=None):
        try:
            user = UserManagementService.get_user_by_public_id(public_id)
            if user.is_staff:
                raise NotFound(AUTH_ERRORS["not_found"])
            serializer = UserDetailSerializer(user, context={'request': request})
            return APIResponse.success(
                message=AUTH_SUCCESS["user_retrieved_successfully"],
                data=serializer.data
            )
        except Exception as e:
            return APIResponse.error(message=AUTH_ERRORS["error_occurred"])

    def post(self, request, *args, **kwargs):
        bulk_action = kwargs.get('action')
        
        if bulk_action == 'bulk-delete':
            return self.bulk_delete_post(request)
        else:
            return self.create_user_post(request)

    def create_user_post(self, request):
        if not PermissionValidator.has_permission(request.user, 'users.create'):
            return APIResponse.error(
                message=AUTH_ERRORS["auth_not_authorized"],
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        serializer = AdminCreateRegularUserSerializer(data=request.data, context={'admin_user': request.user})
        
        if not serializer.is_valid():
            return APIResponse.error(
                message=AUTH_ERRORS["auth_validation_error"],
                errors=serializer.errors
            )
            
        try:
            from src.user.services.user.user_register_service import UserRegisterService
            user = UserRegisterService.register_user_from_serializer(
                validated_data=serializer.validated_data,
                admin_user=request.user
            )
            
            user.refresh_from_db()
            
            response_serializer = UserDetailSerializer(user, context={'request': request})
            return APIResponse.success(
                message=AUTH_SUCCESS["user_created_successfully"],
                data=response_serializer.data
            )
        except Exception as e:
            return APIResponse.error(message=AUTH_ERRORS["error_occurred"])

    def bulk_delete_post(self, request):
        if not PermissionValidator.has_permission(request.user, 'users.delete'):
            return APIResponse.error(
                message=AUTH_ERRORS["auth_not_authorized"],
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        serializer = BulkDeleteSerializer(data=request.data)
        if not serializer.is_valid():
            return APIResponse.error(
                message=AUTH_ERRORS["auth_validation_error"],
                errors=serializer.errors
            )
            
        user_ids = serializer.validated_data.get('ids', [])
        
        try:
            deleted_count = UserManagementService.bulk_delete_users(user_ids, admin_user=request.user)
            
            return APIResponse.success(
                message=AUTH_SUCCESS["users_deleted_successfully"].format(count=deleted_count),
                data={'deleted_count': deleted_count}
            )
        except Exception as e:
            return APIResponse.error(message=AUTH_ERRORS["error_occurred"])

    def put(self, request, user_id):
        if not PermissionValidator.has_permission(request.user, 'users.update'):
            return APIResponse.error(
                message=AUTH_ERRORS["auth_not_authorized"],
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        try:
            user = UserManagementService.get_user_detail(user_id)
            if user.is_staff:
                return APIResponse.error(
                    message=AUTH_ERRORS["cannot_update_admin_user"],
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            profile_data = request.data.get('profile', {})
            national_id = profile_data.get('national_id')
            if national_id:
                from src.user.models import UserProfile
                existing_profile = UserProfile.objects.filter(national_id=national_id).exclude(user_id=user_id).first()
                if existing_profile:
                    return APIResponse.error(
                        message=AUTH_ERRORS["national_id_exists"],
                        status_code=status.HTTP_400_BAD_REQUEST
                    )
            
            serializer = UserUpdateSerializer(
                instance=user,
                data=request.data, 
                context={'user_id': user_id, 'admin_user': request.user, 'request': request}
            )
            
            if not serializer.is_valid():
                return APIResponse.error(
                    message=AUTH_ERRORS["auth_validation_error"],
                    errors=serializer.errors
                )
            
            updated_user = UserManagementService.update_user(user_id, serializer.validated_data, request.user)
            
            response_serializer = UserDetailSerializer(updated_user, context={'request': request})
            return APIResponse.success(
                message=AUTH_SUCCESS["user_updated_successfully"],
                data=response_serializer.data
            )
            
        except Exception as e:
            return APIResponse.error(message=AUTH_ERRORS["error_occurred"])

    def delete(self, request, user_id):
        if not PermissionValidator.has_permission(request.user, 'users.delete'):
            return APIResponse.error(
                message=AUTH_ERRORS["auth_not_authorized"],
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        try:
            user = UserManagementService.get_user_detail(user_id)
            if user.is_staff:
                return APIResponse.error(
                    message=AUTH_ERRORS["cannot_delete_admin_user"],
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            UserManagementService.delete_user(user_id, admin_user=request.user)
            
            return APIResponse.success(
                message=AUTH_SUCCESS["user_deleted_successfully"]
            )
            
        except Exception as e:
            return APIResponse.error(message=AUTH_ERRORS["error_occurred"])