from rest_framework import viewsets, status
from rest_framework.decorators import action
from src.user.auth.admin_session_auth import CSRFExemptSessionAuthentication
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from django.core.cache import cache

from src.core.responses.response import APIResponse
from src.user.models import AdminRole, AdminUserRole, User
from src.user.messages import ROLE_SUCCESS, ROLE_ERRORS
from src.user.messages import AUTH_ERRORS, AUTH_SUCCESS
from .admin_permission import (
    SuperAdminOnly,
    require_admin_roles,
    AdminPermissionCache
)
from src.user.access_control.definitions.config import AVAILABLE_MODULES, AVAILABLE_ACTIONS

@method_decorator(ensure_csrf_cookie, name='dispatch')
class AdminPermissionView(viewsets.ViewSet):
    authentication_classes = [CSRFExemptSessionAuthentication]
    
    def get_permissions(self):
        permission_map = {
            'check_permission': [require_admin_roles('super_admin', 'user_manager')],
            'user_permissions': [require_admin_roles('super_admin', 'user_manager')],
            'available_modules': [require_admin_roles('super_admin', 'user_manager')],
            'available_actions': [require_admin_roles('super_admin', 'user_manager')],
            'permission_matrix': [SuperAdminOnly()],
            'clear_cache': [SuperAdminOnly()],
            'system_permissions': [SuperAdminOnly()],
        }
        
        action = getattr(self, 'action', None)
        permissions = permission_map.get(action, [SuperAdminOnly()])
        return permissions
    
    @action(detail=False, methods=['post'])
    def check_permission(self, request):
        try:
            user_id = request.data.get('user_id')
            required_action = request.data.get('action', 'read')
            required_modules = request.data.get('modules', [])
            
            if not user_id:
                return APIResponse.error(
                    message=AUTH_ERRORS["auth_validation_error"],
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            user = User.objects.get(id=user_id)
            
            if not user.is_admin_active:
                return APIResponse.success(
                    message=AUTH_SUCCESS["auth_retrieved_successfully"],
                    data={
                        'user_id': user_id,
                        'has_permission': False,
                        'reason': 'User does not have admin panel access'
                    }
                )
            
            if user.is_admin_full:
                return APIResponse.success(
                    message=AUTH_SUCCESS["auth_retrieved_successfully"],
                    data={
                        'user_id': user_id,
                        'has_permission': True,
                        'reason': 'Super admin has all permissions'
                    }
                )
            
            has_permission, details = self._check_user_role_permissions(
                user, required_action, required_modules
            )
            
            return APIResponse.success(
                message=AUTH_SUCCESS["auth_retrieved_successfully"],
                data={
                    'user_id': user_id,
                    'has_permission': has_permission,
                    'details': details
                }
            )
            
        except User.DoesNotExist:
            return APIResponse.error(
                message=AUTH_ERRORS["auth_user_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return APIResponse.error(
                message=AUTH_ERRORS["error_occurred"],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def user_permissions(self, request):
        try:
            user_id = request.query_params.get('user_id')
            
            if not user_id:
                return APIResponse.error(
                    message=AUTH_ERRORS["auth_validation_error"],
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            user = User.objects.get(id=user_id)
            
            permissions_data = user.get_cached_permissions()
            
            user_roles = AdminUserRole.objects.filter(
                user=user,
                is_active=True
            ).select_related('role').values(
                'role__name',
                'role__display_name',
                'role__level',
                'permissions_cache',
                'assigned_at',
                'expires_at'
            )
            
            return APIResponse.success(
                message=AUTH_SUCCESS["auth_retrieved_successfully"],
                data={
                    'user_id': user_id,
                    'user_email': user.email,
                    'user_mobile': user.mobile,
                    'is_admin_full': user.is_admin_full,
                    'cached_permissions': permissions_data,
                    'roles': list(user_roles),
                    'last_cache_update': user.updated_at.isoformat() if user.updated_at else None
                }
            )
            
        except User.DoesNotExist:
            return APIResponse.error(
                message=AUTH_ERRORS["auth_user_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return APIResponse.error(
                message=AUTH_ERRORS["error_occurred"],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def available_modules(self, request):
        try:
            return APIResponse.success(
                message=AUTH_SUCCESS["auth_retrieved_successfully"],
                data=AVAILABLE_MODULES
            )
            
        except Exception as e:
            return APIResponse.error(
                message=AUTH_ERRORS["error_occurred"],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def available_actions(self, request):
        try:
            return APIResponse.success(
                message=AUTH_SUCCESS["auth_retrieved_successfully"],
                data=AVAILABLE_ACTIONS
            )
            
        except Exception as e:
            return APIResponse.error(
                message=AUTH_ERRORS["error_occurred"],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def permission_matrix(self, request):
        try:
            roles = AdminRole.objects.filter(is_active=True).order_by('level')
            
            matrix = []
            for role in roles:
                permissions = role.permissions
                
                matrix.append({
                    'role_id': role.id,
                    'role_name': role.name,
                    'role_display_name': role.display_name,
                    'level': role.level,
                    'is_system_role': role.is_system_role,
                    'permissions': permissions,
                    'user_count': role.admin_user_roles.filter(is_active=True).count()
                })
            
            return APIResponse.success(
                message=ROLE_SUCCESS["permission_matrix_retrieved"],
                data={
                    'roles': matrix,
                    'total_roles': len(matrix),
                    'system_roles': len([r for r in matrix if r['is_system_role']])
                }
            )
            
        except Exception:
            return APIResponse.error(
                message=ROLE_ERRORS["permission_matrix_retrieve_failed"],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def clear_cache(self, request):
        try:
            cache_type = request.data.get('cache_type', 'all')
            user_id = request.data.get('user_id')
            
            if cache_type == 'user' and user_id:
                AdminPermissionCache.clear_user_cache(user_id)
                message = ROLE_SUCCESS["cache_cleared_for_user"].format(user_id=user_id)
            elif cache_type == 'all':
                AdminPermissionCache.clear_all_admin_cache()
                message = ROLE_SUCCESS["all_cache_cleared"]
            else:
                return APIResponse.error(
                    message=ROLE_ERRORS["invalid_cache_type"],
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            return APIResponse.success(message=message)
            
        except Exception:
            return APIResponse.error(
                message=ROLE_ERRORS["cache_clear_failed"],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def system_permissions(self, request):
        try:
            total_roles = AdminRole.objects.filter(is_active=True).count()
            system_roles = AdminRole.objects.filter(is_active=True, is_system_role=True).count()
            custom_roles = total_roles - system_roles
            
            total_assignments = AdminUserRole.objects.filter(is_active=True).count()
            admin_users = User.objects.filter(
                user_type='admin',
                is_admin_active=True,
                is_active=True
            ).count()
            
            super_admins = User.objects.filter(
                is_admin_full=True,
                is_active=True
            ).count()
            
            role_distribution = []
            roles = AdminRole.objects.filter(is_active=True).order_by('level')
            
            for role in roles:
                user_count = role.admin_user_roles.filter(is_active=True).count()
                role_distribution.append({
                    'role_name': role.name,
                    'role_display_name': role.display_name,
                    'user_count': user_count,
                    'level': role.level
                })
            
            return APIResponse.success(
                message=ROLE_SUCCESS["system_permissions_retrieved"],
                data={
                    'statistics': {
                        'total_roles': total_roles,
                        'system_roles': system_roles,
                        'custom_roles': custom_roles,
                        'total_assignments': total_assignments,
                        'admin_users': admin_users,
                        'super_admins': super_admins
                    },
                    'role_distribution': role_distribution
                }
            )
            
        except Exception:
            return APIResponse.error(
                message=ROLE_ERRORS["system_permissions_retrieve_failed"],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _check_user_role_permissions(self, user, required_action, required_modules):
        try:
            user_roles = AdminUserRole.objects.filter(
                user=user,
                is_active=True
            ).select_related('role')
            
            if not user_roles.exists():
                return False, {'reason': 'User has no active roles'}
            
            matching_roles = []
            
            for user_role in user_roles:
                permissions = user_role.permissions_cache or user_role.role.permissions
                
                allowed_actions = permissions.get('actions', [])
                has_action = 'all' in allowed_actions or required_action in allowed_actions
                
                has_module = True
                if required_modules:
                    allowed_modules = permissions.get('modules', [])
                    has_module = 'all' in allowed_modules or any(
                        module in allowed_modules for module in required_modules
                    )
                
                if has_action and has_module:
                    matching_roles.append({
                        'role_name': user_role.role.name,
                        'role_display_name': user_role.role.display_name,
                        'permissions': permissions
                    })
            
            if matching_roles:
                return True, {
                    'reason': 'User has required permissions through roles',
                    'matching_roles': matching_roles
                }
            else:
                return False, {
                    'reason': 'User does not have required permissions',
                    'user_roles': [
                        {
                            'role_name': ur.role.name,
                            'permissions': ur.permissions_cache or ur.role.permissions
                        }
                        for ur in user_roles
                    ]
                }
                
        except Exception:
            return False, {'reason': 'Error checking permissions'}

    def can_delete_admin(self, admin_to_delete, current_admin):
        if admin_to_delete.is_admin_full:
            return False, {
                'error': 'Full admins cannot be deleted',
                'reason': 'This admin has full access and is protected from deletion'
            }
        
        if not current_admin.is_admin_full:
            return False, {
                'error': 'Insufficient permissions',
                'reason': 'Only full admins can delete other admin users'
            }
        
        if admin_to_delete.id == current_admin.id:
            return False, {
                'error': 'Cannot delete yourself',
                'reason': 'You cannot delete your own admin account'
            }
        
        return True, {'message': 'Delete operation allowed'}
