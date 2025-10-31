from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.authentication import SessionAuthentication
from src.user.auth.admin_session_auth import CSRFExemptSessionAuthentication
from django.db import transaction, models
from django.core.exceptions import ValidationError
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie

from src.core.responses import APIResponse
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
from .role_permissions import RolePermissionManager, BASE_ADMIN_PERMISSIONS
from .create_admin_roles import create_default_admin_roles, get_role_summary
from src.user.messages import AUTH_SUCCESS, AUTH_ERRORS, ROLE_ERRORS, ROLE_SUCCESS
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
            is_system_role = request.query_params.get('is_system_role')
            search = request.query_params.get('search', '').strip()
            
            # Build queryset with optimization for users_count
            from django.db.models import Count
            queryset = AdminRole.objects.annotate(
                users_count=Count('adminuserrole', filter=models.Q(adminuserrole__is_active=True))
            ).order_by('level', 'name')
            
            # Apply filters
            if is_active is not None:
                is_active_bool = is_active.lower() in ('true', '1', 'yes')
                queryset = queryset.filter(is_active=is_active_bool)
            
            # ✅ Filter by is_system_role
            if is_system_role is not None:
                is_system_role_bool = is_system_role.lower() in ('true', '1', 'yes')
                queryset = queryset.filter(is_system_role=is_system_role_bool)
            
            if search:
                queryset = queryset.filter(
                    name__icontains=search
                ) | queryset.filter(
                    display_name__icontains=search
                )
            
            # Pagination
            paginator = self.pagination_class()
            page = paginator.paginate_queryset(queryset, request)
            if page is not None:
                serializer = AdminRoleListSerializer(page, many=True)
                # Return paginated response using DRF's standard pagination response
                return paginator.get_paginated_response(serializer.data)
            
            serializer = AdminRoleListSerializer(queryset, many=True)
            return APIResponse.success(
                message=AUTH_SUCCESS["auth_users_retrieved_successfully"],
                data=serializer.data,
                status_code=200
            )
            
        except Exception as e:
            logger.error(f"Error listing admin roles: {e}")
            return APIResponse.error(
                message=ROLE_ERRORS["failed_to_retrieve_admin_roles"],
                status_code=500
            )
    
    def retrieve(self, request, pk=None):
        """Get specific admin role details"""
        try:
            role = AdminRole.objects.get(pk=pk, is_active=True)
            serializer = AdminRoleSerializer(role)
            
            return APIResponse.success(
                message=AUTH_SUCCESS["user_retrieved_successfully"],
                data=serializer.data,
                status_code=200
            )
            
        except AdminRole.DoesNotExist:
            return APIResponse.error(
                message=ROLE_ERRORS["admin_role_not_found"],
                status_code=404
            )
        except Exception as e:
            logger.error(f"Error retrieving admin role {pk}: {e}")
            return APIResponse.error(
                message=ROLE_ERRORS["failed_to_retrieve_admin_role"],
                status_code=500
            )
    
    def create(self, request):
        """Create new admin role (Super Admin only)"""
        try:
            serializer = AdminRoleSerializer(data=request.data)
            
            if not serializer.is_valid():
                return APIResponse.error(
                    message=ROLE_ERRORS["validation_failed"],
                    errors=serializer.errors,
                    status_code=400
                )
            
            with transaction.atomic():
                role = serializer.save()
                
                # Clear cache since we added a new role
                AdminPermissionCache.clear_all_admin_cache()
            
            return APIResponse.success(
                message=ROLE_SUCCESS["admin_role_created_successfully"],
                data=AdminRoleSerializer(role).data,
                status_code=201
            )
            
        except Exception as e:
            logger.error(f"Error creating admin role: {e}")
            return APIResponse.error(
                message=ROLE_ERRORS["failed_to_create_admin_role"],
                status_code=500
            )
    
    def update(self, request, pk=None):
        """Update admin role (Super Admin only)"""
        try:
            role = AdminRole.objects.get(pk=pk)
            
            # Prevent modification of system roles unless explicitly allowed
            if role.is_system_role and not request.data.get('force_update_system_role'):
                return APIResponse.error(
                    message=ROLE_ERRORS["system_roles_cannot_be_modified"],
                    status_code=403
                )
            
            serializer = AdminRoleSerializer(role, data=request.data, partial=True)
            
            if not serializer.is_valid():
                return APIResponse.error(
                    message=ROLE_ERRORS["validation_failed"],
                    errors=serializer.errors,
                    status_code=400
                )
            
            with transaction.atomic():
                updated_role = serializer.save()
                
                # Update permissions cache for all users with this role
                user_roles = AdminUserRole.objects.filter(role=role, is_active=True)
                for user_role in user_roles:
                    user_role.update_permissions_cache()
                    AdminPermissionCache.clear_user_cache(user_role.user_id)
            
            return APIResponse.success(
                message=ROLE_SUCCESS["admin_role_updated_successfully"],
                data=AdminRoleSerializer(updated_role).data,
                status_code=200
            )
            
        except AdminRole.DoesNotExist:
            return APIResponse.error(
                message=ROLE_ERRORS["admin_role_not_found"],
                status_code=404
            )
        except Exception as e:
            logger.error(f"Error updating admin role {pk}: {e}")
            return APIResponse.error(
                message=ROLE_ERRORS["failed_to_update_admin_role"],
                status_code=500
            )
    
    def destroy(self, request, pk=None):
        """Delete admin role (Super Admin only)"""
        try:
            role = AdminRole.objects.get(pk=pk)
            
            # Prevent deletion of system roles
            if role.is_system_role:
                return APIResponse.error(
                    message=ROLE_ERRORS["system_roles_cannot_be_deleted"],
                    status_code=403
                )
            
            # Check if role is assigned to any users
            assigned_users_count = AdminUserRole.objects.filter(
                role=role, is_active=True
            ).count()
            
            if assigned_users_count > 0:
                return APIResponse.error(
                    message=ROLE_ERRORS["role_cannot_delete_assigned"],
                    status_code=400
                )
            
            with transaction.atomic():
                role.delete()
                AdminPermissionCache.clear_all_admin_cache()
            
            return APIResponse.success(
                message=ROLE_SUCCESS["admin_role_deleted_successfully"],
                data={},
                status_code=204
            )
            
        except AdminRole.DoesNotExist:
            return APIResponse.error(
                message=ROLE_ERRORS["admin_role_not_found"],
                status_code=404
            )
        except Exception as e:
            logger.error(f"Error deleting admin role {pk}: {e}")
            return APIResponse.error(
                message=ROLE_ERRORS["failed_to_delete_admin_role"],
                status_code=500
            )
    
    @action(detail=False, methods=['post'])
    def assign_role(self, request):
        """Assign role to admin user (Super Admin only)"""
        try:
            serializer = UserRoleAssignmentSerializer(data=request.data)
            
            if not serializer.is_valid():
                logger.error(f"Serializer validation failed: {serializer.errors}")
                return APIResponse.error(
                    message=ROLE_ERRORS["validation_failed"],
                    errors=serializer.errors,
                    status_code=400
                )
            
            user_id = serializer.validated_data['user_id']
            role_ids = serializer.validated_data['role_ids']
            expires_at = serializer.validated_data.get('expires_at')
            
            user = User.objects.get(id=user_id)
            roles = AdminRole.objects.filter(id__in=role_ids, is_active=True)
            
            created_assignments = []
            
            with transaction.atomic():
                for role in roles:
                    try:
                        # ✅ FIX: Check if assignment exists (active OR inactive)
                        existing = AdminUserRole.objects.filter(
                            user=user, role=role
                        ).first()
                        
                        if existing:
                            # If exists but inactive, reactivate it
                            if not existing.is_active:
                                logger.info(f"Reactivating role {role.id} ({role.name}) for user {user.id} ({user.email})")
                                existing.is_active = True
                                existing.assigned_by = request.user
                                existing.expires_at = expires_at
                                existing.save()
                                existing.update_permissions_cache()
                                created_assignments.append(existing)
                            else:
                                # Already active, skip
                                logger.info(f"Role {role.id} ({role.name}) already assigned to user {user.id}")
                        else:
                            # Create new assignment
                            logger.info(f"Assigning role {role.id} ({role.name}) to user {user.id} ({user.email})")
                            
                            assignment = AdminUserRole.objects.create(
                                user=user,
                                role=role,
                                assigned_by=request.user,
                                expires_at=expires_at
                            )
                            assignment.update_permissions_cache()
                            created_assignments.append(assignment)
                    except ValidationError as ve:
                        logger.error(f"Validation error assigning role {role.id} ({role.name}): {ve}")
                        # Re-raise to be caught by outer exception handler
                        raise ValidationError(ROLE_ERRORS["validation_error_assigning_role"].format(role_name=role.display_name, role_id=role.id, error=str(ve)))
                    except Exception as e:
                        logger.error(f"Error assigning role {role.id} ({role.name}): {type(e).__name__}: {e}")
                        raise Exception(ROLE_ERRORS["error_assigning_role"].format(role_name=role.display_name, role_id=role.id, error=str(e)))
                
                # Clear user's permission cache
                AdminPermissionCache.clear_user_cache(user_id)
            
            return APIResponse.success(
                message=ROLE_SUCCESS["role_assigned_successfully"],
                data={
                    'user_id': user_id,
                    'assigned_roles': len(created_assignments),
                    'assignments': [
                        AdminRoleAssignmentSerializer(assignment).data 
                        for assignment in created_assignments
                    ]
                },
                status_code=200
            )
            
        except User.DoesNotExist:
            return APIResponse.error(
                message=ROLE_ERRORS["user_not_found"],
                status_code=404
            )
        except ValidationError as e:
            logger.error(f"Validation error assigning roles: {e}")
            return APIResponse.error(
                message=ROLE_ERRORS["validation_error_detail"].format(error=str(e)),
                errors={"validation_errors": e.message_dict if hasattr(e, 'message_dict') else str(e)},
                status_code=400
            )
        except Exception as e:
            logger.error(f"Error assigning roles: {type(e).__name__}: {e}", exc_info=True)
            return APIResponse.error(
                message=ROLE_ERRORS["failed_to_assign_roles"].format(error=str(e)),
                errors={"error_type": type(e).__name__, "error_details": str(e)},
                status_code=500
            )
    
    @action(detail=True, methods=['delete'])
    def remove_role(self, request, pk=None):
        """Remove role from admin user (Super Admin only)"""
        try:
            # pk is role_id, get user_id from query params
            user_id = request.query_params.get('user_id')
            
            if not user_id:
                return APIResponse.error(
                    message=ROLE_ERRORS["user_id_parameter_required"],
                    status_code=400
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
                message=ROLE_SUCCESS["role_removed_from_user_successfully"],
                data={},
                status_code=200
            )
            
        except AdminUserRole.DoesNotExist:
            return APIResponse.error(
                message=ROLE_ERRORS["role_assignment_not_found"],
                status_code=404
            )
        except Exception as e:
            logger.error(f"Error removing role: {e}")
            return APIResponse.error(
                message=ROLE_ERRORS["failed_to_remove_role"],
                status_code=500
            )
    
    @action(detail=False, methods=['post'])
    def fix_custom_roles(self, request):
        """Fix roles that were incorrectly marked as system roles"""
        try:
            # Only super admin can fix roles
            if not request.user.is_full_admin_user():
                return APIResponse.error(
                    message=ROLE_ERRORS["only_super_admin_can_fix_custom_roles"],
                    status_code=403
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
                message=ROLE_SUCCESS["custom_roles_fixed_successfully"],
                data={
                    'fixed_count': fixed_count,
                    'fixed_roles': [role.name for role in incorrect_roles]
                },
                status_code=200
            )
            
        except Exception as e:
            logger.error(f"Error fixing custom roles: {e}")
            return APIResponse.error(
                message=ROLE_ERRORS["failed_to_fix_custom_roles"],
                status_code=500
            )
    
    @action(detail=False, methods=['post'])
    def bulk_delete(self, request):
        """Bulk delete admin roles (Super Admin only)"""
        try:
            role_ids = request.data.get('ids', [])
            
            if not role_ids:
                return APIResponse.error(
                    message=ROLE_ERRORS["no_role_ids_provided"],
                    status_code=400
                )
            
            # Get roles to delete
            roles_to_delete = AdminRole.objects.filter(
                id__in=role_ids, is_active=True
            )
            
            # Check for system roles
            system_roles = roles_to_delete.filter(is_system_role=True)
            if system_roles.exists():
                return APIResponse.error(
                    message=ROLE_ERRORS["cannot_delete_system_roles"],
                    status_code=403
                )
            
            # Check for roles assigned to users
            assigned_roles = roles_to_delete.filter(
                adminuserrole__is_active=True
            ).distinct()
            
            if assigned_roles.exists():
                assigned_count = assigned_roles.count()
                return APIResponse.error(
                    message=ROLE_ERRORS["roles_cannot_delete_assigned"].format(count=assigned_count),
                    status_code=400
                )
            
            # Delete roles
            with transaction.atomic():
                deleted_count = roles_to_delete.count()
                roles_to_delete.delete()
                AdminPermissionCache.clear_all_admin_cache()
            
            return APIResponse.success(
                message=ROLE_SUCCESS["roles_deleted_successfully"],
                data={'deleted_count': deleted_count},
                status_code=200
            )
            
        except Exception as e:
            logger.error(f"Error bulk deleting admin roles: {e}")
            return APIResponse.error(
                message=ROLE_ERRORS["failed_to_bulk_delete_admin_roles"],
                status_code=500
            )
    
    @action(detail=False, methods=['get'])
    def user_roles(self, request):
        """Get roles for a specific user"""
        try:
            user_id = request.query_params.get('user_id')
            
            if not user_id:
                return APIResponse.error(
                    message=ROLE_ERRORS["user_id_parameter_required"],
                    status_code=400
                )
            
            user = User.objects.get(id=user_id)
            
            assignments = AdminUserRole.objects.filter(
                user=user,
                is_active=True
            ).select_related('role', 'assigned_by').order_by('role__level')
            
            serializer = AdminRoleAssignmentSerializer(assignments, many=True)
            
            return APIResponse.success(
                message=ROLE_SUCCESS["user_roles_retrieved_successfully"],
                data={
                    'user_id': user_id,
                    'user_email': user.email,
                    'user_mobile': user.mobile,
                    'roles': serializer.data
                },
                status_code=200
            )
            
        except User.DoesNotExist:
            return APIResponse.error(
                message=ROLE_ERRORS["user_not_found"],
                status_code=404
            )
        except Exception as e:
            logger.error(f"Error getting user roles: {e}")
            return APIResponse.error(
                message=ROLE_ERRORS["failed_to_retrieve_user_roles"],
                status_code=500
            )
    
    @action(detail=True, methods=['get'])
    def role_permissions(self, request, pk=None):
        """Get permissions for a specific role"""
        try:
            role = AdminRole.objects.get(pk=pk, is_active=True)
            serializer = AdminRolePermissionsSerializer(role)
            
            return APIResponse.success(
                message=ROLE_SUCCESS["admin_role_retrieved_successfully"],
                data={
                    'role_id': role.id,
                    'role_name': role.name,
                    'role_display_name': role.display_name,
                    'permissions': serializer.data['permissions']
                },
                status_code=200
            )
            
        except AdminRole.DoesNotExist:
            return APIResponse.error(
                message=ROLE_ERRORS["admin_role_not_found"],
                status_code=404
            )
        except Exception as e:
            logger.error(f"Error getting role permissions: {e}")
            return APIResponse.error(
                message="Failed to retrieve role permissions",
                status_code=500
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
                data=permission_groups,
                status_code=200
            )
            
        except Exception as e:
            logger.error(f"Error getting available permissions: {e}")
            return APIResponse.error(
                message="Failed to retrieve available permissions",
                status_code=500
            )
    
    @action(detail=False, methods=['get'])
    def base_permissions(self, request):
        """Get base permissions that all admins have - for frontend display"""
        try:
            # Use centralized BASE_ADMIN_PERMISSIONS constant
            return APIResponse.success(
                message="Base permissions retrieved successfully",
                data=BASE_ADMIN_PERMISSIONS,
                status_code=200
            )
            
        except Exception as e:
            logger.error(f"Error getting base permissions: {e}")
            return APIResponse.error(
                message="Failed to retrieve base permissions",
                status_code=500
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
                    status_code=403
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
                },
                status_code=200
            )
            
        except Exception as e:
            logger.error(f"Error setting up default roles: {e}")
            return APIResponse.error(
                message="Failed to setup default roles",
                status_code=500
            )
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get roles summary and statistics"""
        try:
            summary = get_role_summary()
            
            return APIResponse.success(
                message="Roles summary retrieved successfully",
                data=summary,
                status_code=200
            )
            
        except Exception as e:
            logger.error(f"Error getting roles summary: {e}")
            return APIResponse.error(
                message="Failed to retrieve roles summary",
                status_code=500
            )