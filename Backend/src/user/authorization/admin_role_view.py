from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.authentication import SessionAuthentication
from src.user.auth.admin_session_auth import CSRFExemptSessionAuthentication
from django.db import transaction
from django.core.exceptions import ValidationError
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie

from src.core.responses import APIResponse, PaginationAPIResponse
from src.core.pagination.pagination import StandardLimitPagination
from src.user.models import AdminRole, AdminUserRole, User
from .admin_role_serializer import (
    AdminRoleSerializer,
    AdminRoleListSerializer,
    AdminRoleAssignmentSerializer,
    UserRoleAssignmentSerializer,
    AdminRolePermissionsSerializer
)
from .admin_permission import (
    SuperAdminOnly,
    SimpleAdminPermission,
    require_admin_roles,
    AdminPermissionCache
)
from .role_permissions import RolePermissionManager
from .create_admin_roles import create_default_admin_roles, get_role_summary
from src.user.messages import AUTH_SUCCESS, AUTH_ERRORS
import logging

logger = logging.getLogger(__name__)

@method_decorator(ensure_csrf_cookie, name='dispatch')
class AdminRoleView(viewsets.ViewSet):
    """
    ViewSet for managing AdminRole and AdminUserRole
    High-performance implementation with caching and proper permissions
    Compatible with Django 5.2.6
    Located in authorization module for better organization
    """
    authentication_classes = [CSRFExemptSessionAuthentication]
    pagination_class = StandardLimitPagination
    
    def get_permissions(self):
        """Use SimpleAdminPermission for reliable access control"""
        return [SimpleAdminPermission()]
    
    def list(self, request):
        """List all admin roles with user counts"""
        try:
            # Get query parameters
            is_active = request.query_params.get('is_active')
            search = request.query_params.get('search', '').strip()
            
            # Build queryset
            queryset = AdminRole.objects.all().order_by('level', 'name')
            
            # Apply filters
            if is_active is not None:
                is_active_bool = is_active.lower() in ('true', '1', 'yes')
                queryset = queryset.filter(is_active=is_active_bool)
            
            if search:
                queryset = queryset.filter(
                    name__icontains=search
                ) | queryset.filter(
                    display_name__icontains=search
                )
            
            # Pagination
            paginator = self.pagination_class()
            paginated_roles = paginator.paginate_queryset(queryset, request)
            
            # Serialize
            serializer = AdminRoleListSerializer(paginated_roles, many=True)
            
            return PaginationAPIResponse.paginated_success(
                message="Admin roles retrieved successfully",
                paginated_data={
                    'count': paginator.count,
                    'next': paginator.get_next_link(),
                    'previous': paginator.get_previous_link(),
                    'results': serializer.data
                }
            )
            
        except Exception as e:
            logger.error(f"Error listing admin roles: {e}")
            return APIResponse.error(
                message="Failed to retrieve admin roles",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def retrieve(self, request, pk=None):
        """Get specific admin role details"""
        try:
            role = AdminRole.objects.get(pk=pk, is_active=True)
            serializer = AdminRoleSerializer(role)
            
            return APIResponse.success(
                message="Admin role retrieved successfully",
                data=serializer.data
            )
            
        except AdminRole.DoesNotExist:
            return APIResponse.error(
                message="Admin role not found",
                status_code=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error retrieving admin role {pk}: {e}")
            return APIResponse.error(
                message="Failed to retrieve admin role",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def create(self, request):
        """Create new admin role (Super Admin only)"""
        try:
            serializer = AdminRoleSerializer(data=request.data)
            
            if not serializer.is_valid():
                return APIResponse.error(
                    message="Validation failed",
                    errors=serializer.errors,
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            with transaction.atomic():
                role = serializer.save()
                
                # Clear cache since we added a new role
                AdminPermissionCache.clear_all_admin_cache()
            
            return APIResponse.success(
                message="Admin role created successfully",
                data=AdminRoleSerializer(role).data,
                status_code=status.HTTP_201_CREATED
            )
            
        except Exception as e:
            logger.error(f"Error creating admin role: {e}")
            return APIResponse.error(
                message="Failed to create admin role",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def update(self, request, pk=None):
        """Update admin role (Super Admin only)"""
        try:
            role = AdminRole.objects.get(pk=pk)
            
            # Prevent modification of system roles unless explicitly allowed
            if role.is_system_role and not request.data.get('force_update_system_role'):
                return APIResponse.error(
                    message="System roles cannot be modified. Use force_update_system_role=true to override.",
                    status_code=status.HTTP_403_FORBIDDEN
                )
            
            serializer = AdminRoleSerializer(role, data=request.data, partial=True)
            
            if not serializer.is_valid():
                return APIResponse.error(
                    message="Validation failed",
                    errors=serializer.errors,
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            with transaction.atomic():
                updated_role = serializer.save()
                
                # Update permissions cache for all users with this role
                user_roles = AdminUserRole.objects.filter(role=role, is_active=True)
                for user_role in user_roles:
                    user_role.update_permissions_cache()
                    AdminPermissionCache.clear_user_cache(user_role.user_id)
            
            return APIResponse.success(
                message="Admin role updated successfully",
                data=AdminRoleSerializer(updated_role).data
            )
            
        except AdminRole.DoesNotExist:
            return APIResponse.error(
                message="Admin role not found",
                status_code=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error updating admin role {pk}: {e}")
            return APIResponse.error(
                message="Failed to update admin role",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def destroy(self, request, pk=None):
        """Delete admin role (Super Admin only)"""
        try:
            role = AdminRole.objects.get(pk=pk)
            
            # Prevent deletion of system roles
            if role.is_system_role:
                return APIResponse.error(
                    message="System roles cannot be deleted",
                    status_code=status.HTTP_403_FORBIDDEN
                )
            
            # Check if role is assigned to any users
            assigned_users_count = AdminUserRole.objects.filter(
                role=role, is_active=True
            ).count()
            
            if assigned_users_count > 0:
                return APIResponse.error(
                    message=f"Cannot delete role. It is assigned to {assigned_users_count} users.",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            with transaction.atomic():
                role.delete()
                AdminPermissionCache.clear_all_admin_cache()
            
            return APIResponse.success(
                message="Admin role deleted successfully",
                status_code=status.HTTP_204_NO_CONTENT
            )
            
        except AdminRole.DoesNotExist:
            return APIResponse.error(
                message="Admin role not found",
                status_code=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error deleting admin role {pk}: {e}")
            return APIResponse.error(
                message="Failed to delete admin role",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def assign_role(self, request):
        """Assign role to admin user (Super Admin only)"""
        try:
            serializer = UserRoleAssignmentSerializer(data=request.data)
            
            if not serializer.is_valid():
                return APIResponse.error(
                    message="Validation failed",
                    errors=serializer.errors,
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            user_id = serializer.validated_data['user_id']
            role_ids = serializer.validated_data['role_ids']
            expires_at = serializer.validated_data.get('expires_at')
            
            user = User.objects.get(id=user_id)
            roles = AdminRole.objects.filter(id__in=role_ids, is_active=True)
            
            created_assignments = []
            
            with transaction.atomic():
                for role in roles:
                    # Check if assignment already exists
                    existing = AdminUserRole.objects.filter(
                        user=user, role=role, is_active=True
                    ).first()
                    
                    if not existing:
                        assignment = AdminUserRole.objects.create(
                            user=user,
                            role=role,
                            assigned_by=request.user,
                            expires_at=expires_at
                        )
                        assignment.update_permissions_cache()
                        created_assignments.append(assignment)
                
                # Clear user's permission cache
                AdminPermissionCache.clear_user_cache(user_id)
            
            return APIResponse.success(
                message=f"Successfully assigned {len(created_assignments)} roles to user",
                data={
                    'user_id': user_id,
                    'assigned_roles': len(created_assignments),
                    'assignments': [
                        AdminRoleAssignmentSerializer(assignment).data 
                        for assignment in created_assignments
                    ]
                }
            )
            
        except User.DoesNotExist:
            return APIResponse.error(
                message="User not found",
                status_code=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error assigning roles: {e}")
            return APIResponse.error(
                message="Failed to assign roles",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['delete'])
    def remove_role(self, request, pk=None):
        """Remove role from admin user (Super Admin only)"""
        try:
            # pk is role_id, get user_id from query params
            user_id = request.query_params.get('user_id')
            
            if not user_id:
                return APIResponse.error(
                    message="user_id parameter is required",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            assignment = AdminUserRole.objects.get(
                user_id=user_id,
                role_id=pk,
                is_active=True
            )
            
            with transaction.atomic():
                assignment.is_active = False
                assignment.save()
                
                # Clear user's permission cache
                AdminPermissionCache.clear_user_cache(int(user_id))
            
            return APIResponse.success(
                message="Role removed from user successfully"
            )
            
        except AdminUserRole.DoesNotExist:
            return APIResponse.error(
                message="Role assignment not found",
                status_code=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error removing role: {e}")
            return APIResponse.error(
                message="Failed to remove role",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def fix_custom_roles(self, request):
        """Fix roles that were incorrectly marked as system roles"""
        try:
            # Only super admin can fix roles
            if not request.user.is_full_admin_user():
                return APIResponse.error(
                    message="Only super admin can fix custom roles",
                    status_code=status.HTTP_403_FORBIDDEN
                )
            
            # Get predefined system role names
            system_role_names = [
                'super_admin', 'content_manager', 'user_manager', 
                'media_manager', 'analytics_viewer', 'support_admin'
            ]
            
            # Find roles that are marked as system but are not in predefined list
            incorrect_roles = AdminRole.objects.filter(
                is_system_role=True
            ).exclude(name__in=system_role_names)
            
            fixed_count = 0
            with transaction.atomic():
                for role in incorrect_roles:
                    role.is_system_role = False
                    role.save()
                    fixed_count += 1
                
                AdminPermissionCache.clear_all_admin_cache()
            
            return APIResponse.success(
                message=f"Fixed {fixed_count} roles that were incorrectly marked as system roles",
                data={
                    'fixed_count': fixed_count,
                    'fixed_roles': [role.name for role in incorrect_roles]
                }
            )
            
        except Exception as e:
            logger.error(f"Error fixing custom roles: {e}")
            return APIResponse.error(
                message="Failed to fix custom roles",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def bulk_delete(self, request):
        """Bulk delete admin roles (Super Admin only)"""
        try:
            role_ids = request.data.get('ids', [])
            
            if not role_ids:
                return APIResponse.error(
                    message="No role IDs provided",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            # Get roles to delete
            roles_to_delete = AdminRole.objects.filter(
                id__in=role_ids, is_active=True
            )
            
            # Check for system roles
            system_roles = roles_to_delete.filter(is_system_role=True)
            if system_roles.exists():
                return APIResponse.error(
                    message="Cannot delete system roles",
                    status_code=status.HTTP_403_FORBIDDEN
                )
            
            # Check for roles assigned to users
            assigned_roles = roles_to_delete.filter(
                adminuserrole__is_active=True
            ).distinct()
            
            if assigned_roles.exists():
                assigned_count = assigned_roles.count()
                return APIResponse.error(
                    message=f"Cannot delete {assigned_count} roles that are assigned to users",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            # Delete roles
            with transaction.atomic():
                deleted_count = roles_to_delete.count()
                roles_to_delete.delete()
                AdminPermissionCache.clear_all_admin_cache()
            
            return APIResponse.success(
                message=f"Successfully deleted {deleted_count} admin roles",
                data={'deleted_count': deleted_count},
                status_code=status.HTTP_200_OK
            )
            
        except Exception as e:
            logger.error(f"Error bulk deleting admin roles: {e}")
            return APIResponse.error(
                message="Failed to bulk delete admin roles",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def user_roles(self, request):
        """Get roles for a specific user"""
        try:
            user_id = request.query_params.get('user_id')
            
            if not user_id:
                return APIResponse.error(
                    message="user_id parameter is required",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            user = User.objects.get(id=user_id)
            
            assignments = AdminUserRole.objects.filter(
                user=user,
                is_active=True
            ).select_related('role', 'assigned_by').order_by('role__level')
            
            serializer = AdminRoleAssignmentSerializer(assignments, many=True)
            
            return APIResponse.success(
                message="User roles retrieved successfully",
                data={
                    'user_id': user_id,
                    'user_email': user.email,
                    'user_mobile': user.mobile,
                    'roles': serializer.data
                }
            )
            
        except User.DoesNotExist:
            return APIResponse.error(
                message="User not found",
                status_code=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error getting user roles: {e}")
            return APIResponse.error(
                message="Failed to retrieve user roles",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def role_permissions(self, request, pk=None):
        """Get permissions for a specific role"""
        try:
            role = AdminRole.objects.get(pk=pk, is_active=True)
            serializer = AdminRolePermissionsSerializer(role)
            
            return APIResponse.success(
                message="Role permissions retrieved successfully",
                data={
                    'role_id': role.id,
                    'role_name': role.name,
                    'role_display_name': role.display_name,
                    'permissions': serializer.data['permissions']
                }
            )
            
        except AdminRole.DoesNotExist:
            return APIResponse.error(
                message="Admin role not found",
                status_code=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error getting role permissions: {e}")
            return APIResponse.error(
                message="Failed to retrieve role permissions",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def permissions(self, request):
        """Get all available permissions grouped by modules - for frontend dropdown"""
        try:
            from .role_permissions import RolePermissionManager
            
            # Get all available modules and actions
            modules = RolePermissionManager.get_all_modules()
            actions = RolePermissionManager.get_all_actions()
            
            # Build permission groups in the format frontend expects
            permission_groups = []
            permission_id = 1
            
            for module_key, module_info in modules.items():
                if module_key == 'all':  # Skip 'all' module for individual selection
                    continue
                    
                permissions_for_module = []
                for action_key, action_info in actions.items():
                    if action_key == 'all':  # Skip 'all' action for individual selection
                        continue
                        
                    permissions_for_module.append({
                        'id': permission_id,
                        'resource': module_key,
                        'action': action_info['display_name'],
                        'description': f"{action_info['description']} در {module_info['display_name']}"
                    })
                    permission_id += 1
                
                permission_groups.append({
                    'resource': module_key,
                    'display_name': module_info['display_name'],
                    'permissions': permissions_for_module
                })
            
            return APIResponse.success(
                message="Available permissions retrieved successfully",
                data=permission_groups
            )
            
        except Exception as e:
            logger.error(f"Error getting available permissions: {e}")
            return APIResponse.error(
                message="Failed to retrieve available permissions",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def base_permissions(self, request):
        """Get base permissions that all admins have - for frontend display"""
        try:
            # Base permissions that all admins automatically have
            base_permissions = [
                {
                    'id': 'base_dashboard_read',
                    'resource': 'dashboard',
                    'action': 'مشاهده',
                    'display_name': 'مشاهده Dashboard',
                    'description': 'دسترسی به صفحه اصلی پنل ادمین',
                    'is_base': True
                },
                {
                    'id': 'base_media_read',
                    'resource': 'media',
                    'action': 'مشاهده',
                    'display_name': 'مشاهده Media',
                    'description': 'مشاهده لیست فایل‌ها و رسانه‌ها',
                    'is_base': True
                },
                {
                    'id': 'base_profile_read',
                    'resource': 'profile',
                    'action': 'مشاهده',
                    'display_name': 'مشاهده پروفایل شخصی',
                    'description': 'مشاهده اطلاعات پروفایل خود',
                    'is_base': True
                },
                {
                    'id': 'base_profile_update',
                    'resource': 'profile',
                    'action': 'ویرایش',
                    'display_name': 'ویرایش پروفایل شخصی',
                    'description': 'ویرایش اطلاعات پروفایل خود',
                    'is_base': True
                },
            ]
            
            return APIResponse.success(
                message="Base permissions retrieved successfully",
                data=base_permissions
            )
            
        except Exception as e:
            logger.error(f"Error getting base permissions: {e}")
            return APIResponse.error(
                message="Failed to retrieve base permissions",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def setup_default_roles(self, request):
        """Setup default admin roles (Super Admin only)"""
        try:
            force_update = request.data.get('force_update', False)
            
            # Only super admin can setup roles
            if not request.user.is_full_admin_user():
                return APIResponse.error(
                    message="Only super admin can setup default roles",
                    status_code=status.HTTP_403_FORBIDDEN
                )
            
            # Create/update default roles
            result = create_default_admin_roles(
                force_update=force_update, 
                verbose=False
            )
            
            return APIResponse.success(
                message="Default roles setup completed",
                data={
                    'summary': {
                        'created': result['created'],
                        'updated': result['updated'],
                        'skipped': result['skipped'],
                        'total_processed': result['total_processed']
                    },
                    'details': result['results']
                }
            )
            
        except Exception as e:
            logger.error(f"Error setting up default roles: {e}")
            return APIResponse.error(
                message="Failed to setup default roles",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get roles summary and statistics"""
        try:
            summary = get_role_summary()
            
            return APIResponse.success(
                message="Roles summary retrieved successfully",
                data=summary
            )
            
        except Exception as e:
            logger.error(f"Error getting roles summary: {e}")
            return APIResponse.error(
                message="Failed to retrieve roles summary",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
