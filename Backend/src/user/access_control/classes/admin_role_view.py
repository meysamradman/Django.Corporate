from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.authentication import SessionAuthentication
from django_filters.rest_framework import DjangoFilterBackend
from src.user.auth.admin_session_auth import CSRFExemptSessionAuthentication
from django.db import transaction, models
from django.db.models import Count
from django.core.exceptions import ValidationError
from django.core.cache import cache
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie

from src.core.responses.response import APIResponse
from src.core.pagination.pagination import StandardLimitPagination
from src.user.models import AdminRole, AdminUserRole, User
from src.user.filters.admin_role_filters import AdminRoleAdminFilter
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
from src.user.access_control.definitions.config import BASE_ADMIN_PERMISSIONS, AVAILABLE_MODULES, AVAILABLE_ACTIONS, get_permissions_by_module
from src.user.access_control.definitions.validator import PermissionValidator
from src.user.access_control.definitions.helpers import PermissionHelper
from src.user.utils.cache import UserCacheManager
from .role_utils import create_default_admin_roles, get_role_summary
from src.user.messages import AUTH_SUCCESS, AUTH_ERRORS, ROLE_ERRORS, ROLE_SUCCESS
from src.core.utils.validation_helpers import normalize_validation_error, extract_validation_message

@method_decorator(ensure_csrf_cookie, name='dispatch')
class AdminRoleView(viewsets.ViewSet):
    authentication_classes = [CSRFExemptSessionAuthentication]
    pagination_class = StandardLimitPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = AdminRoleAdminFilter
    search_fields = ['name', 'display_name', 'description']
    ordering_fields = ['name', 'display_name', 'level', 'created_at', 'updated_at', 'is_active', 'is_system_role']
    ordering = ['-created_at']
    
    def get_permissions(self):
        if self.action == 'user_roles' or self.action == 'permissions' or self.action == 'base_permissions':
            return [SimpleAdminPermission()]
        return [SuperAdminOnly()]
    
    def get_queryset(self):
        
        return AdminRole.objects.annotate(
            users_count=Count('admin_user_roles', filter=models.Q(admin_user_roles__is_active=True))
        )
    
    def filter_queryset(self, queryset):
        
        for backend in list(self.filter_backends):
            queryset = backend().filter_queryset(self.request, queryset, self)
        return queryset
    
    def list(self, request):
        try:
            queryset = self.filter_queryset(self.get_queryset())
            
            order_by = request.query_params.get('order_by')
            order_desc = request.query_params.get('order_desc', 'true').lower() in ('true', '1', 'yes')
            
            allowed_order_fields = {
                'name', 'display_name', 'level', 'created_at', 'updated_at', 
                'is_active', 'is_system_role', 'users_count'
            }
            
            if order_by and order_by in allowed_order_fields:
                order_prefix = '-' if order_desc else ''
                queryset = queryset.order_by(f'{order_prefix}{order_by}')
            
            paginator = self.pagination_class()
            page = paginator.paginate_queryset(queryset, request)
            if page is not None:
                serializer = AdminRoleListSerializer(page, many=True)
                return paginator.get_paginated_response(serializer.data)
            
            serializer = AdminRoleListSerializer(queryset, many=True)
            return APIResponse.success(
                message=AUTH_SUCCESS["auth_users_retrieved_successfully"],
                data=serializer.data,
                status_code=200
            )
            
        except Exception as e:
            return APIResponse.error(
                message=ROLE_ERRORS["failed_to_retrieve_admin_roles"],
                status_code=500
            )
    
    def retrieve(self, request, pk=None):
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
            return APIResponse.error(
                message=ROLE_ERRORS["failed_to_retrieve_admin_role"],
                status_code=500
            )
    
    def create(self, request):
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
                
                AdminPermissionCache.clear_all_admin_cache()
            
            return APIResponse.success(
                message=ROLE_SUCCESS["admin_role_created_successfully"],
                data=AdminRoleSerializer(role).data,
                status_code=201
            )
            
        except Exception as e:
            return APIResponse.error(
                message=ROLE_ERRORS["failed_to_create_admin_role"],
                status_code=500
            )
    
    def update(self, request, pk=None):
        try:
            role = AdminRole.objects.get(pk=pk)
            
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
                
                user_roles = AdminUserRole.objects.filter(role=role, is_active=True)
                for user_role in user_roles:
                    user_role.update_permissions_cache()
                    
                    AdminPermissionCache.clear_user_cache(user_role.user_id)
                    PermissionValidator.clear_user_cache(user_role.user_id)
                    PermissionHelper.clear_user_cache(user_role.user_id)
                    UserCacheManager.invalidate_profile(user_role.user_id)
            
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
            return APIResponse.error(
                message=ROLE_ERRORS["failed_to_update_admin_role"],
                status_code=500
            )
    
    def destroy(self, request, pk=None):
        try:
            role = AdminRole.objects.get(pk=pk)
            
            if role.is_system_role:
                return APIResponse.error(
                    message=ROLE_ERRORS["system_roles_cannot_be_deleted"],
                    status_code=403
                )
            
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
            return APIResponse.error(
                message=ROLE_ERRORS["failed_to_delete_admin_role"],
                status_code=500
            )
    
    @action(detail=False, methods=['post'])
    def assign_role(self, request):
        try:
            serializer = UserRoleAssignmentSerializer(data=request.data)
            
            if not serializer.is_valid():
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
                        existing = AdminUserRole.objects.filter(
                            user=user, role=role
                        ).first()
                        
                        if existing:
                            if not existing.is_active:
                                existing.is_active = True
                                existing.assigned_by = request.user
                                existing.expires_at = expires_at
                                existing.save()
                                existing.update_permissions_cache()
                                created_assignments.append(existing)
                        else:
                            
                            assignment = AdminUserRole.objects.create(
                                user=user,
                                role=role,
                                assigned_by=request.user,
                                expires_at=expires_at
                            )
                            assignment.update_permissions_cache()
                            created_assignments.append(assignment)
                    except ValidationError as ve:
                        raise ValidationError(ROLE_ERRORS["validation_error_assigning_role"].format(role_name=role.display_name, role_id=role.id, error=str(ve)))
                    except Exception as e:
                        raise Exception(ROLE_ERRORS["error_assigning_role"].format(role_name=role.display_name, role_id=role.id, error=str(e)))
                
                AdminPermissionCache.clear_user_cache(user_id)
                PermissionValidator.clear_user_cache(user_id)
                PermissionHelper.clear_user_cache(user_id)
                UserCacheManager.invalidate_profile(user_id)
            
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
            return APIResponse.error(
                message=ROLE_ERRORS["validation_error_detail"].format(
                    error=extract_validation_message(e, ROLE_ERRORS["validation_failed"])
                ),
                errors=normalize_validation_error(e),
                status_code=400
            )
        except Exception as e:
            error_detail = extract_validation_message(e, ROLE_ERRORS["validation_failed"])
            return APIResponse.error(
                message=ROLE_ERRORS["failed_to_assign_roles"].format(error=error_detail),
                errors={"error_type": type(e).__name__, "error_details": error_detail},
                status_code=500
            )
    
    @action(detail=True, methods=['delete'])
    def remove_role(self, request, pk=None):
        try:
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
                
                AdminPermissionCache.clear_user_cache(int(user_id))
                PermissionValidator.clear_user_cache(int(user_id))
                PermissionHelper.clear_user_cache(int(user_id))
                UserCacheManager.invalidate_profile(user_id)
            
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
            return APIResponse.error(
                message=ROLE_ERRORS["failed_to_remove_role"],
                status_code=500
            )
    
    @action(detail=False, methods=['post'])
    def fix_custom_roles(self, request):
        try:
            if not request.user.is_full_admin_user():
                return APIResponse.error(
                    message=ROLE_ERRORS["only_super_admin_can_fix_custom_roles"],
                    status_code=403
                )
            
            system_role_names = [
                'super_admin',
                'blog_manager',
                'portfolio_manager',
                'media_manager',
                'forms_manager',
                'pages_manager',
                'chatbot_manager',
                'email_manager',
                'ticket_manager',
                'ai_manager',
                'settings_manager',
                'panel_manager',
                'user_manager',
            ]
            
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
            return APIResponse.error(
                message=ROLE_ERRORS["failed_to_fix_custom_roles"],
                status_code=500
            )
    
    @action(detail=False, methods=['post'])
    def bulk_delete(self, request):
        try:
            role_ids = request.data.get('ids', [])
            
            if not role_ids:
                return APIResponse.error(
                    message=ROLE_ERRORS["no_role_ids_provided"],
                    status_code=400
                )
            
            roles_to_delete = AdminRole.objects.filter(
                id__in=role_ids, is_active=True
            )
            
            system_roles = roles_to_delete.filter(is_system_role=True)
            if system_roles.exists():
                return APIResponse.error(
                    message=ROLE_ERRORS["cannot_delete_system_roles"],
                    status_code=403
                )
            
            assigned_roles = roles_to_delete.filter(
                adminuserrole__is_active=True
            ).distinct()
            
            if assigned_roles.exists():
                assigned_count = assigned_roles.count()
                return APIResponse.error(
                    message=ROLE_ERRORS["roles_cannot_delete_assigned"].format(count=assigned_count),
                    status_code=400
                )
            
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
            return APIResponse.error(
                message=ROLE_ERRORS["failed_to_bulk_delete_admin_roles"],
                status_code=500
            )
    
    @action(detail=False, methods=['get'])
    def user_roles(self, request):
        try:
            user_id = request.query_params.get('user_id')
            
            if not user_id:
                return APIResponse.error(
                    message=ROLE_ERRORS["user_id_parameter_required"],
                    status_code=400
                )
            
            user = User.objects.get(id=user_id)
            
            if str(user.id) != str(request.user.id) and not (request.user.is_superuser or getattr(request.user, 'is_admin_full', False)):
                return APIResponse.error(
                    message=AUTH_ERRORS["auth_not_authorized"],
                    status_code=403
                )
            
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
            return APIResponse.error(
                message=ROLE_ERRORS["failed_to_retrieve_user_roles"],
                status_code=500
            )
    
    @action(detail=True, methods=['get'])
    def role_permissions(self, request, pk=None):
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
            return APIResponse.error(
                message=ROLE_ERRORS["failed_to_retrieve_role_permissions"],
                status_code=500
            )
    
    @action(detail=False, methods=['get'])
    def permissions(self, request):
        try:
            modules = AVAILABLE_MODULES
            
            permission_groups = []
            permission_id = 1
            
            base_permission_keys = set(BASE_ADMIN_PERMISSIONS.keys())
            
            ANALYTICS_USED_PERMISSIONS = {
                'analytics.manage',  # Website visit analytics (page views)
                'analytics.stats.manage',  # Full access to all app statistics
                'analytics.users.read',
                'analytics.admins.read',
                'analytics.content.read',
                'analytics.tickets.read',
                'analytics.emails.read',
                'analytics.system.read',
                'analytics.dashboard.read'
            }
            
            resource_map = {}
            
            for module_key, module_info in modules.items():
                if module_key == 'all':
                    continue
                
                real_perms = get_permissions_by_module(module_key)
                
                if not real_perms:
                    continue
                    
                for perm_key, perm_data in real_perms:
                    if perm_key in base_permission_keys:
                        continue
                    
                    if perm_data.get('requires_superadmin', False):
                        continue
                    
                    if module_key == 'analytics' and perm_key not in ANALYTICS_USED_PERMISSIONS:
                        continue
                    
                    perm_parts = perm_key.split('.')
                    if len(perm_parts) < 2:
                        continue
                    
                    resource = '.'.join(perm_parts[:-1])
                    
                    if resource not in resource_map:
                        if resource == module_key:
                            display_name = module_info['display_name']
                        else:
                            nested_part = perm_parts[-2] if len(perm_parts) > 2 else resource.split('.')[-1]
                            perm_display = perm_data.get('display_name', '')
                            action_words = ['View ', 'Create ', 'Update ', 'Delete ', 'Manage ', 'Edit ']
                            for action_word in action_words:
                                if perm_display.startswith(action_word):
                                    perm_display = perm_display[len(action_word):]
                                    break
                            display_name = perm_display or f"{module_info['display_name']} - {nested_part.title()}"
                        
                        resource_map[resource] = {
                            'resource': resource,
                            'display_name': display_name,
                            'permissions': []
                        }
                    
                    resource_map[resource]['permissions'].append({
                        'id': permission_id,
                        'resource': resource,
                        'action': perm_data['action'],
                        'display_name': perm_data['display_name'],
                        'description': perm_data['description'],
                        'is_standalone': perm_data.get('is_standalone', False),
                        'requires_superadmin': perm_data.get('requires_superadmin', False),
                        'permission_category': perm_data.get('permission_category'),
                        'original_key': perm_key
                    })
                    permission_id += 1
            
            permission_groups = list(resource_map.values())
            
            return APIResponse.success(
                message=ROLE_SUCCESS["available_permissions_retrieved"],
                data=permission_groups,
                status_code=200
            )
            
        except Exception as e:
            return APIResponse.error(
                message=ROLE_ERRORS["failed_to_retrieve_available_permissions"],
                status_code=500
            )
    
    @action(detail=False, methods=['get'])
    def base_permissions(self, request):
        try:
            return APIResponse.success(
                message=ROLE_SUCCESS["base_permissions_retrieved"],
                data=BASE_ADMIN_PERMISSIONS,
                status_code=200
            )
            
        except Exception as e:
            return APIResponse.error(
                message=ROLE_ERRORS["failed_to_retrieve_base_permissions"],
                status_code=500
            )
    
    @action(detail=False, methods=['post'])
    def setup_default_roles(self, request):
        try:
            force_update = request.data.get('force_update', False)
            
            if not request.user.is_full_admin_user():
                return APIResponse.error(
                    message=ROLE_ERRORS["only_super_admin_can_setup_roles"],
                    status_code=403
                )
            
            result = create_default_admin_roles(
                force_update=force_update, 
                verbose=False
            )
            
            return APIResponse.success(
                message=ROLE_SUCCESS["default_roles_setup_completed"],
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
            return APIResponse.error(
                message=ROLE_ERRORS["failed_to_setup_default_roles"],
                status_code=500
            )
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        try:
            summary = get_role_summary()
            
            return APIResponse.success(
                message=ROLE_SUCCESS["roles_summary_retrieved"],
                data=summary,
                status_code=200
            )
            
        except Exception as e:
            return APIResponse.error(
                message=ROLE_ERRORS["failed_to_retrieve_roles_summary"],
                status_code=500
            )