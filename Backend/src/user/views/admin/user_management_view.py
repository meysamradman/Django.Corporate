from rest_framework.exceptions import PermissionDenied, NotFound
from rest_framework.exceptions import PermissionDenied, NotFound
from rest_framework import status
from rest_framework.authentication import SessionAuthentication
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from django.contrib.auth import get_user_model
from django.http import Http404

from src.core.responses import APIResponse, PaginationAPIResponse
from src.user.views.base_management_view import BaseManagementView
from src.user.serializers.admin.user_management_serializer import (
    UserListSerializer,
    UserDetailSerializer,
    UserUpdateSerializer,
    UserFilterSerializer,
    BulkDeleteSerializer
)
from src.user.serializers.admin.admin_register_serializer import UserRegisterByAdminSerializer
from src.user.services import BaseManagementService
from src.user.messages import AUTH_ERRORS, AUTH_SUCCESS
from django.core.exceptions import ValidationError
from src.user.models import User
from src.user.auth.auth_mixin import UserAuthMixin
from src.user.auth.admin_session_auth import CSRFExemptSessionAuthentication
from django.middleware.csrf import get_token
from src.user.authorization import (
    AdminRolePermission,
    UserManagementPermission,
    SimpleAdminPermission,
    require_admin_roles,
    SuperAdminOnly,
    UserManagerAccess
)

# User model is imported from models

@method_decorator(ensure_csrf_cookie, name='dispatch')
class UserManagementView(UserAuthMixin, BaseManagementView):
    authentication_classes = [CSRFExemptSessionAuthentication]
    serializer_class = UserDetailSerializer
    service_class = BaseManagementService
    filter_serializer_class = UserFilterSerializer
    create_serializer_class = UserRegisterByAdminSerializer
    update_serializer_class = UserUpdateSerializer
    bulk_delete_serializer_class = BulkDeleteSerializer

    def get_permissions(self):
        """Dynamic permission assignment based on HTTP method"""
        # Use SimpleAdminPermission for now to fix immediate issues
        return [SimpleAdminPermission()]

    def check_admin_permission(self):
        if not self.current_user.is_staff:
            raise PermissionDenied(AUTH_ERRORS["auth_not_authorized"])

    def get(self, request, user_id=None):
        """Get regular users with AdminRole-based permissions"""
        try:
            self.check_admin_permission()
            
            if user_id:
                try:
                    user = self.service_class.get_user_detail(user_id)
                    # Ensure it's a regular user
                    if user.is_staff:
                        raise NotFound("Admin user not found in user management")
                    serializer = UserDetailSerializer(user, context={'request': request})
                    return APIResponse.success(
                        message=AUTH_SUCCESS["user_retrieved_successfully"],
                        data=serializer.data
                    )
                except Exception as e:
                    return APIResponse.error(message=str(e))

            # Filter validation
            filter_serializer = self.filter_serializer_class(data=request.query_params)
            if not filter_serializer.is_valid():
                return APIResponse.error(
                    message=AUTH_ERRORS["auth_validation_error"],
                    errors=filter_serializer.errors
                )

            validated_filters = filter_serializer.validated_data
            search_value = validated_filters.get('search')
            is_active_filter = validated_filters.get('is_active')

            # Force user_type to 'user' for regular users
            user_type = 'user'

            # Call the service method with better error handling
            try:
                users_data = self.service_class.get_users_list(
                    search=search_value,
                    is_active=is_active_filter,
                    user_type=user_type,
                    request=request
                )
                
                # Handle different data structures from service
                if isinstance(users_data, dict) and 'users' in users_data:
                    users = users_data['users']
                elif isinstance(users_data, tuple) and len(users_data) == 2:
                    users, _ = users_data
                else:
                    users = users_data
                
                # Get paginated users using the standard pagination class
                paginator = self.pagination_class()
                paginated_users = paginator.paginate_queryset(users, request)
                
                # Serialize the paginated users
                serializer = UserListSerializer(paginated_users, many=True, context={'request': request})
                
                # Return paginated response with pagination info from paginator
                return PaginationAPIResponse.paginated_success(
                    message=AUTH_SUCCESS["auth_users_retrieved_successfully"],
                    paginated_data={
                        'count': paginator.count,
                        'next': paginator.get_next_link(),
                        'previous': paginator.get_previous_link(),
                        'results': serializer.data
                    }
                )
            except Exception as e:
                import traceback
                print(f"Error in get_users_list: {str(e)}")
                print(traceback.format_exc())
                return APIResponse.error(
                    message=f"Error fetching users: {str(e)}",
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
        except PermissionDenied as e:
            return APIResponse.error(
                message=str(e),
                status_code=status.HTTP_403_FORBIDDEN
            )
        except Exception as e:
            import traceback
            print(f"Unexpected error in get method: {str(e)}")
            print(traceback.format_exc())
            return APIResponse.error(
                message=f"An error occurred: {str(e)}",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @staticmethod
    def get_by_public_id(request, public_id=None):
        """Get a user by public_id"""
        try:
            user = BaseManagementService.get_user_by_public_id(public_id)
            # Ensure it's a regular user
            if user.is_staff:
                raise NotFound("Admin user not found in user management")
            serializer = UserDetailSerializer(user, context={'request': request})
            return APIResponse.success(
                message=AUTH_SUCCESS["user_retrieved_successfully"],
                data=serializer.data
            )
        except Exception as e:
            return APIResponse.error(message=str(e))

    def post(self, request, *args, **kwargs):
        """
        POST handling logic that delegates to appropriate handlers.
        This is a router method that calls different methods based on the action parameter.
        """
        bulk_action = kwargs.get('action')
        
        if bulk_action == 'bulk-delete':
            return self.bulk_delete_post(request)
        else:
            # Default case - create a new regular user
            return self.create_user_post(request)

    def create_user_post(self, request):
        """Handle POST request to create a new regular user"""
        serializer = self.create_serializer_class(data=request.data, context={'admin_user': request.user})
        
        if not serializer.is_valid():
            return APIResponse.error(
                message=AUTH_ERRORS["auth_validation_error"],
                errors=serializer.errors
            )
            
        try:
            # Use BaseRegisterService for creating regular users
            from src.user.services import BaseRegisterService
            user = BaseRegisterService.register_user_from_serializer(
                validated_data=serializer.validated_data,
                admin_user=request.user
            )
            
            # Return serialized user data
            response_serializer = self.serializer_class(user, context={'request': request})
            return APIResponse.success(
                message=AUTH_SUCCESS["user_created_successfully"],
                data=response_serializer.data
            )
        except Exception as e:
            return APIResponse.error(message=str(e))

    def bulk_delete_post(self, request):
        """Handle bulk deletion of users via POST"""
        # Validate incoming data
        serializer = self.bulk_delete_serializer_class(data=request.data)
        if not serializer.is_valid():
            return APIResponse.error(
                message=AUTH_ERRORS["auth_validation_error"],
                errors=serializer.errors
            )
            
        # Extract user IDs to delete
        user_ids = serializer.validated_data.get('ids', [])
        
        try:
            # Call service to perform bulk deletion
            deleted_count = self.service_class.bulk_delete_users(user_ids, admin_user=request.user)
            
            return APIResponse.success(
                message=f"{deleted_count} users were successfully deleted",
                data={'deleted_count': deleted_count}
            )
        except Exception as e:
            return APIResponse.error(message=str(e))

    def put(self, request, user_id):
        """Handles updating a regular user, including profile data and picture."""
        try:
            self.check_admin_permission()
            
            # Get the user and ensure it's a regular user
            user = self.service_class.get_user_detail(user_id)
            if user.is_staff:
                return APIResponse.error(
                    message="Cannot update admin user in user management",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            serializer = self.update_serializer_class(
                data=request.data, 
                context={'user_id': user_id, 'admin_user': request.user, 'request': request}
            )
            
            if not serializer.is_valid():
                return APIResponse.error(
                    message=AUTH_ERRORS["auth_validation_error"],
                    errors=serializer.errors
                )
            
            # Update the user
            updated_user = self.service_class.update_user(user_id, serializer.validated_data, request.user)
            
            # Return updated user data
            response_serializer = self.serializer_class(updated_user, context={'request': request})
            return APIResponse.success(
                message=AUTH_SUCCESS["user_updated_successfully"],
                data=response_serializer.data
            )
            
        except Exception as e:
            return APIResponse.error(message=str(e))

    def delete(self, request, user_id):
        """Delete a regular user"""
        try:
            self.check_admin_permission()
            
            # Get the user and ensure it's a regular user
            user = self.service_class.get_user_detail(user_id)
            if user.is_staff:
                return APIResponse.error(
                    message="Cannot delete admin user in user management",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            # Delete the user
            self.service_class.delete_user(user_id, admin_user=request.user)
            
            return APIResponse.success(
                message=AUTH_SUCCESS["user_deleted_successfully"]
            )
            
        except Exception as e:
            return APIResponse.error(message=str(e))
