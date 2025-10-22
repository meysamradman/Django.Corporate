from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
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
            return Response({
                "metaData": {
                    "status": "success",
                    "message": AUTH_SUCCESS["auth_users_retrieved_successfully"],
                    "AppStatusCode": 200,
                    "timestamp": "2025-10-14T22:11:51.985Z"
                },
                "data": serializer.data
            })
            
        except Exception as e:
            logger.error(f"Error listing admin roles: {e}")
            return Response({
                "metaData": {
                    "status": "error",
                    "message": "Failed to retrieve admin roles",
                    "AppStatusCode": 500,
                    "timestamp": "2025-10-14T22:11:51.985Z"
                },
                "data": {}
            }, status=500)
    
    def retrieve(self, request, pk=None):
        """Get specific admin role details"""
        try:
            role = AdminRole.objects.get(pk=pk, is_active=True)
            serializer = AdminRoleSerializer(role)
            
            return Response({
                "metaData": {
                    "status": "success",
                    "message": AUTH_SUCCESS["user_retrieved_successfully"],
                    "AppStatusCode": 200,
                    "timestamp": "2025-10-14T22:11:51.985Z"
                },
                "data": serializer.data
            })
            
        except AdminRole.DoesNotExist:
            return Response({
                "metaData": {
                    "status": "error",
                    "message": "Admin role not found",
                    "AppStatusCode": 404,
                    "timestamp": "2025-10-14T22:11:51.985Z"
                },
                "data": {}
            }, status=404)
        except Exception as e:
            logger.error(f"Error retrieving admin role {pk}: {e}")
            return Response({
                "metaData": {
                    "status": "error",
                    "message": "Failed to retrieve admin role",
                    "AppStatusCode": 500,
                    "timestamp": "2025-10-14T22:11:51.985Z"
                },
                "data": {}
            }, status=500)
    
    def create(self, request):
        """Create new admin role (Super Admin only)"""
        try:
            serializer = AdminRoleSerializer(data=request.data)
            
            if not serializer.is_valid():
                return Response({
                    "metaData": {
                        "status": "error",
                        "message": "Validation failed",
                        "AppStatusCode": 400,
                        "timestamp": "2025-10-14T22:11:51.985Z"
                    },
                    "data": {},
                    "errors": serializer.errors
                }, status=400)
            
            with transaction.atomic():
                role = serializer.save()
                
                # Clear cache since we added a new role
                AdminPermissionCache.clear_all_admin_cache()
            
            return Response({
                "metaData": {
                    "status": "success",
                    "message": AUTH_SUCCESS["user_created_successfully"],
                    "AppStatusCode": 201,
                    "timestamp": "2025-10-14T22:11:51.985Z"
                },
                "data": AdminRoleSerializer(role).data
            }, status=201)
            
        except Exception as e:
            logger.error(f"Error creating admin role: {e}")
            return Response({
                "metaData": {
                    "status": "error",
                    "message": "Failed to create admin role",
                    "AppStatusCode": 500,
                    "timestamp": "2025-10-14T22:11:51.985Z"
                },
                "data": {}
            }, status=500)
    
    def update(self, request, pk=None):
        """Update admin role (Super Admin only)"""
        try:
            role = AdminRole.objects.get(pk=pk)
            
            # Prevent modification of system roles unless explicitly allowed
            if role.is_system_role and not request.data.get('force_update_system_role'):
                return Response({
                    "metaData": {
                        "status": "error",
                        "message": "System roles cannot be modified. Use force_update_system_role=true to override.",
                        "AppStatusCode": 403,
                        "timestamp": "2025-10-14T22:11:51.985Z"
                    },
                    "data": {}
                }, status=403)
            
            serializer = AdminRoleSerializer(role, data=request.data, partial=True)
            
            if not serializer.is_valid():
                return Response({
                    "metaData": {
                        "status": "error",
                        "message": "Validation failed",
                        "AppStatusCode": 400,
                        "timestamp": "2025-10-14T22:11:51.985Z"
                    },
                    "data": {},
                    "errors": serializer.errors
                }, status=400)
            
            with transaction.atomic():
                updated_role = serializer.save()
                
                # Update permissions cache for all users with this role
                user_roles = AdminUserRole.objects.filter(role=role, is_active=True)
                for user_role in user_roles:
                    user_role.update_permissions_cache()
                    AdminPermissionCache.clear_user_cache(user_role.user_id)
            
            return Response({
                "metaData": {
                    "status": "success",
                    "message": AUTH_SUCCESS["user_updated_successfully"],
                    "AppStatusCode": 200,
                    "timestamp": "2025-10-14T22:11:51.985Z"
                },
                "data": AdminRoleSerializer(updated_role).data
            })
            
        except AdminRole.DoesNotExist:
            return Response({
                "metaData": {
                    "status": "error",
                    "message": "Admin role not found",
                    "AppStatusCode": 404,
                    "timestamp": "2025-10-14T22:11:51.985Z"
                },
                "data": {}
            }, status=404)
        except Exception as e:
            logger.error(f"Error updating admin role {pk}: {e}")
            return Response({
                "metaData": {
                    "status": "error",
                    "message": "Failed to update admin role",
                    "AppStatusCode": 500,
                    "timestamp": "2025-10-14T22:11:51.985Z"
                },
                "data": {}
            }, status=500)
    
    def destroy(self, request, pk=None):
        """Delete admin role (Super Admin only)"""
        try:
            role = AdminRole.objects.get(pk=pk)
            
            # Prevent deletion of system roles
            if role.is_system_role:
                return Response({
                    "metaData": {
                        "status": "error",
                        "message": "System roles cannot be deleted",
                        "AppStatusCode": 403,
                        "timestamp": "2025-10-14T22:11:51.985Z"
                    },
                    "data": {}
                }, status=403)
            
            # Check if role is assigned to any users
            assigned_users_count = AdminUserRole.objects.filter(
                role=role, is_active=True
            ).count()
            
            if assigned_users_count > 0:
                return Response({
                    "metaData": {
                        "status": "error",
                        "message": f"Cannot delete role. It is assigned to {assigned_users_count} users.",
                        "AppStatusCode": 400,
                        "timestamp": "2025-10-14T22:11:51.985Z"
                    },
                    "data": {}
                }, status=400)
            
            with transaction.atomic():
                role.delete()
                AdminPermissionCache.clear_all_admin_cache()
            
            return Response({
                "metaData": {
                    "status": "success",
                    "message": AUTH_SUCCESS["user_deleted_successfully"],
                    "AppStatusCode": 204,
                    "timestamp": "2025-10-14T22:11:51.985Z"
                },
                "data": {}
            }, status=204)
            
        except AdminRole.DoesNotExist:
            return Response({
                "metaData": {
                    "status": "error",
                    "message": "Admin role not found",
                    "AppStatusCode": 404,
                    "timestamp": "2025-10-14T22:11:51.985Z"
                },
                "data": {}
            }, status=404)
        except Exception as e:
            logger.error(f"Error deleting admin role {pk}: {e}")
            return Response({
                "metaData": {
                    "status": "error",
                    "message": "Failed to delete admin role",
                    "AppStatusCode": 500,
                    "timestamp": "2025-10-14T22:11:51.985Z"
                },
                "data": {}
            }, status=500)
    
    @action(detail=False, methods=['post'])
    def assign_role(self, request):
        """Assign role to admin user (Super Admin only)"""
        try:
            serializer = UserRoleAssignmentSerializer(data=request.data)
            
            if not serializer.is_valid():
                logger.error(f"Serializer validation failed: {serializer.errors}")
                return Response({
                    "metaData": {
                        "status": "error",
                        "message": "Validation failed",
                        "AppStatusCode": 400,
                        "timestamp": "2025-10-14T22:11:51.985Z"
                    },
                    "data": {
                        "validation_errors": serializer.errors,
                        "request_data": request.data
                    },
                    "errors": serializer.errors
                }, status=400)
            
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
                        raise ValidationError(f"نقش '{role.display_name}' (ID: {role.id}): {str(ve)}")
                    except Exception as e:
                        logger.error(f"Error assigning role {role.id} ({role.name}): {type(e).__name__}: {e}")
                        raise Exception(f"نقش '{role.display_name}' (ID: {role.id}): {str(e)}")
                
                # Clear user's permission cache
                AdminPermissionCache.clear_user_cache(user_id)
            
            return Response({
                "metaData": {
                    "status": "success",
                    "message": f"Successfully assigned {len(created_assignments)} roles to user",
                    "AppStatusCode": 200,
                    "timestamp": "2025-10-14T22:11:51.985Z"
                },
                "data": {
                    'user_id': user_id,
                    'assigned_roles': len(created_assignments),
                    'assignments': [
                        AdminRoleAssignmentSerializer(assignment).data 
                        for assignment in created_assignments
                    ]
                }
            })
            
        except User.DoesNotExist:
            return Response({
                "metaData": {
                    "status": "error",
                    "message": "User not found",
                    "AppStatusCode": 404,
                    "timestamp": "2025-10-14T22:11:51.985Z"
                },
                "data": {}
            }, status=404)
        except ValidationError as e:
            logger.error(f"Validation error assigning roles: {e}")
            return Response({
                "metaData": {
                    "status": "error",
                    "message": f"Validation error: {str(e)}",
                    "AppStatusCode": 400,
                    "timestamp": "2025-10-14T22:11:51.985Z"
                },
                "data": {"validation_errors": e.message_dict if hasattr(e, 'message_dict') else str(e)}
            }, status=400)
        except Exception as e:
            logger.error(f"Error assigning roles: {type(e).__name__}: {e}", exc_info=True)
            return Response({
                "metaData": {
                    "status": "error",
                    "message": f"Failed to assign roles: {str(e)}",
                    "AppStatusCode": 500,
                    "timestamp": "2025-10-14T22:11:51.985Z"
                },
                "data": {"error_type": type(e).__name__, "error_details": str(e)}
            }, status=500)
    
    @action(detail=True, methods=['delete'])
    def remove_role(self, request, pk=None):
        """Remove role from admin user (Super Admin only)"""
        try:
            # pk is role_id, get user_id from query params
            user_id = request.query_params.get('user_id')
            
            if not user_id:
                return Response({
                    "metaData": {
                        "status": "error",
                        "message": "user_id parameter is required",
                        "AppStatusCode": 400,
                        "timestamp": "2025-10-14T22:11:51.985Z"
                    },
                    "data": {}
                }, status=400)
            
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
            
            return Response({
                "metaData": {
                    "status": "success",
                    "message": "Role removed from user successfully",
                    "AppStatusCode": 200,
                    "timestamp": "2025-10-14T22:11:51.985Z"
                },
                "data": {}
            })
            
        except AdminUserRole.DoesNotExist:
            return Response({
                "metaData": {
                    "status": "error",
                    "message": "Role assignment not found",
                    "AppStatusCode": 404,
                    "timestamp": "2025-10-14T22:11:51.985Z"
                },
                "data": {}
            }, status=404)
        except Exception as e:
            logger.error(f"Error removing role: {e}")
            return Response({
                "metaData": {
                    "status": "error",
                    "message": "Failed to remove role",
                    "AppStatusCode": 500,
                    "timestamp": "2025-10-14T22:11:51.985Z"
                },
                "data": {}
            }, status=500)
    
    @action(detail=False, methods=['post'])
    def fix_custom_roles(self, request):
        """Fix roles that were incorrectly marked as system roles"""
        try:
            # Only super admin can fix roles
            if not request.user.is_full_admin_user():
                return Response({
                    "metaData": {
                        "status": "error",
                        "message": "Only super admin can fix custom roles",
                        "AppStatusCode": 403,
                        "timestamp": "2025-10-14T22:11:51.985Z"
                    },
                    "data": {}
                }, status=403)
            
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
            
            return Response({
                "metaData": {
                    "status": "success",
                    "message": f"Fixed {fixed_count} roles that were incorrectly marked as system roles",
                    "AppStatusCode": 200,
                    "timestamp": "2025-10-14T22:11:51.985Z"
                },
                "data": {
                    'fixed_count': fixed_count,
                    'fixed_roles': [role.name for role in incorrect_roles]
                }
            })
            
        except Exception as e:
            logger.error(f"Error fixing custom roles: {e}")
            return Response({
                "metaData": {
                    "status": "error",
                    "message": "Failed to fix custom roles",
                    "AppStatusCode": 500,
                    "timestamp": "2025-10-14T22:11:51.985Z"
                },
                "data": {}
            }, status=500)
    
    @action(detail=False, methods=['post'])
    def bulk_delete(self, request):
        """Bulk delete admin roles (Super Admin only)"""
        try:
            role_ids = request.data.get('ids', [])
            
            if not role_ids:
                return Response({
                    "metaData": {
                        "status": "error",
                        "message": "No role IDs provided",
                        "AppStatusCode": 400,
                        "timestamp": "2025-10-14T22:11:51.985Z"
                    },
                    "data": {}
                }, status=400)
            
            # Get roles to delete
            roles_to_delete = AdminRole.objects.filter(
                id__in=role_ids, is_active=True
            )
            
            # Check for system roles
            system_roles = roles_to_delete.filter(is_system_role=True)
            if system_roles.exists():
                return Response({
                    "metaData": {
                        "status": "error",
                        "message": "Cannot delete system roles",
                        "AppStatusCode": 403,
                        "timestamp": "2025-10-14T22:11:51.985Z"
                    },
                    "data": {}
                }, status=403)
            
            # Check for roles assigned to users
            assigned_roles = roles_to_delete.filter(
                adminuserrole__is_active=True
            ).distinct()
            
            if assigned_roles.exists():
                assigned_count = assigned_roles.count()
                return Response({
                    "metaData": {
                        "status": "error",
                        "message": f"Cannot delete {assigned_count} roles that are assigned to users",
                        "AppStatusCode": 400,
                        "timestamp": "2025-10-14T22:11:51.985Z"
                    },
                    "data": {}
                }, status=400)
            
            # Delete roles
            with transaction.atomic():
                deleted_count = roles_to_delete.count()
                roles_to_delete.delete()
                AdminPermissionCache.clear_all_admin_cache()
            
            return Response({
                "metaData": {
                    "status": "success",
                    "message": f"Successfully deleted {deleted_count} admin roles",
                    "AppStatusCode": 200,
                    "timestamp": "2025-10-14T22:11:51.985Z"
                },
                "data": {'deleted_count': deleted_count}
            }, status=200)
            
        except Exception as e:
            logger.error(f"Error bulk deleting admin roles: {e}")
            return Response({
                "metaData": {
                    "status": "error",
                    "message": "Failed to bulk delete admin roles",
                    "AppStatusCode": 500,
                    "timestamp": "2025-10-14T22:11:51.985Z"
                },
                "data": {}
            }, status=500)
    
    @action(detail=False, methods=['get'])
    def user_roles(self, request):
        """Get roles for a specific user"""
        try:
            user_id = request.query_params.get('user_id')
            
            if not user_id:
                return Response({
                    "metaData": {
                        "status": "error",
                        "message": "user_id parameter is required",
                        "AppStatusCode": 400,
                        "timestamp": "2025-10-14T22:11:51.985Z"
                    },
                    "data": {}
                }, status=400)
            
            user = User.objects.get(id=user_id)
            
            assignments = AdminUserRole.objects.filter(
                user=user,
                is_active=True
            ).select_related('role', 'assigned_by').order_by('role__level')
            
            serializer = AdminRoleAssignmentSerializer(assignments, many=True)
            
            return Response({
                "metaData": {
                    "status": "success",
                    "message": "User roles retrieved successfully",
                    "AppStatusCode": 200,
                    "timestamp": "2025-10-14T22:11:51.985Z"
                },
                "data": {
                    'user_id': user_id,
                    'user_email': user.email,
                    'user_mobile': user.mobile,
                    'roles': serializer.data
                }
            })
            
        except User.DoesNotExist:
            return Response({
                "metaData": {
                    "status": "error",
                    "message": "User not found",
                    "AppStatusCode": 404,
                    "timestamp": "2025-10-14T22:11:51.985Z"
                },
                "data": {}
            }, status=404)
        except Exception as e:
            logger.error(f"Error getting user roles: {e}")
            return Response({
                "metaData": {
                    "status": "error",
                    "message": "Failed to retrieve user roles",
                    "AppStatusCode": 500,
                    "timestamp": "2025-10-14T22:11:51.985Z"
                },
                "data": {}
            }, status=500)
    
    @action(detail=True, methods=['get'])
    def role_permissions(self, request, pk=None):
        """Get permissions for a specific role"""
        try:
            role = AdminRole.objects.get(pk=pk, is_active=True)
            serializer = AdminRolePermissionsSerializer(role)
            
            return Response({
                "metaData": {
                    "status": "success",
                    "message": "Role permissions retrieved successfully",
                    "AppStatusCode": 200,
                    "timestamp": "2025-10-14T22:11:51.985Z"
                },
                "data": {
                    'role_id': role.id,
                    'role_name': role.name,
                    'role_display_name': role.display_name,
                    'permissions': serializer.data['permissions']
                }
            })
            
        except AdminRole.DoesNotExist:
            return Response({
                "metaData": {
                    "status": "error",
                    "message": "Admin role not found",
                    "AppStatusCode": 404,
                    "timestamp": "2025-10-14T22:11:51.985Z"
                },
                "data": {}
            }, status=404)
        except Exception as e:
            logger.error(f"Error getting role permissions: {e}")
            return Response({
                "metaData": {
                    "status": "error",
                    "message": "Failed to retrieve role permissions",
                    "AppStatusCode": 500,
                    "timestamp": "2025-10-14T22:11:51.985Z"
                },
                "data": {}
            }, status=500)
    
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
            
            return Response({
                "metaData": {
                    "status": "success",
                    "message": "Available permissions retrieved successfully",
                    "AppStatusCode": 200,
                    "timestamp": "2025-10-14T22:11:51.985Z"
                },
                "data": permission_groups
            })
            
        except Exception as e:
            logger.error(f"Error getting available permissions: {e}")
            return Response({
                "metaData": {
                    "status": "error",
                    "message": "Failed to retrieve available permissions",
                    "AppStatusCode": 500,
                    "timestamp": "2025-10-14T22:11:51.985Z"
                },
                "data": {}
            }, status=500)
    
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
            
            return Response({
                "metaData": {
                    "status": "success",
                    "message": "Base permissions retrieved successfully",
                    "AppStatusCode": 200,
                    "timestamp": "2025-10-14T22:11:51.985Z"
                },
                "data": base_permissions
            })
            
        except Exception as e:
            logger.error(f"Error getting base permissions: {e}")
            return Response({
                "metaData": {
                    "status": "error",
                    "message": "Failed to retrieve base permissions",
                    "AppStatusCode": 500,
                    "timestamp": "2025-10-14T22:11:51.985Z"
                },
                "data": {}
            }, status=500)
    
    @action(detail=False, methods=['post'])
    def setup_default_roles(self, request):
        """Setup default admin roles (Super Admin only)"""
        try:
            force_update = request.data.get('force_update', False)
            
            # Only super admin can setup roles
            if not request.user.is_full_admin_user():
                return Response({
                    "metaData": {
                        "status": "error",
                        "message": "Only super admin can setup default roles",
                        "AppStatusCode": 403,
                        "timestamp": "2025-10-14T22:11:51.985Z"
                    },
                    "data": {}
                }, status=403)
            
            # Create/update default roles
            result = create_default_admin_roles(
                force_update=force_update, 
                verbose=False
            )
            
            return Response({
                "metaData": {
                    "status": "success",
                    "message": "Default roles setup completed",
                    "AppStatusCode": 200,
                    "timestamp": "2025-10-14T22:11:51.985Z"
                },
                "data": {
                    'summary': {
                        'created': result['created'],
                        'updated': result['updated'],
                        'skipped': result['skipped'],
                        'total_processed': result['total_processed']
                    },
                    'details': result['results']
                }
            })
            
        except Exception as e:
            logger.error(f"Error setting up default roles: {e}")
            return Response({
                "metaData": {
                    "status": "error",
                    "message": "Failed to setup default roles",
                    "AppStatusCode": 500,
                    "timestamp": "2025-10-14T22:11:51.985Z"
                },
                "data": {}
            }, status=500)
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get roles summary and statistics"""
        try:
            summary = get_role_summary()
            
            return Response({
                "metaData": {
                    "status": "success",
                    "message": "Roles summary retrieved successfully",
                    "AppStatusCode": 200,
                    "timestamp": "2025-10-14T22:11:51.985Z"
                },
                "data": summary
            })
            
        except Exception as e:
            logger.error(f"Error getting roles summary: {e}")
            return Response({
                "metaData": {
                    "status": "error",
                    "message": "Failed to retrieve roles summary",
                    "AppStatusCode": 500,
                    "timestamp": "2025-10-14T22:11:51.985Z"
                },
                "data": {}
            }, status=500)