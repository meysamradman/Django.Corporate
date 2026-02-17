from django.utils.decorators import method_decorator
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_exempt
from rest_framework.views import APIView
from src.user.serializers.admin.admin_profile_serializer import AdminCompleteProfileSerializer, AdminProfileUpdateSerializer
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import IsAuthenticated
from src.user.auth.admin_session_auth import CSRFExemptSessionAuthentication
from src.user.access_control import SimpleAdminPermission, PermissionHelper, PermissionValidator, AdminPermissionCache
from src.core.responses.response import APIResponse
from src.user.messages import AUTH_SUCCESS, AUTH_ERRORS
from django.http import Http404
from django.core.exceptions import ValidationError
from src.user.models import User, AdminProfile, AdminUserRole
from src.user.utils.cache import UserCacheKeys
from src.user.utils.cache_ttl import (
    USER_PERMISSION_DISPLAY_NAME_TTL,
    USER_ADMIN_PROFILE_CACHE_TTL,
    USER_SUPERADMIN_PROFILE_CACHE_TTL,
)
from django.core.cache import cache

@method_decorator(csrf_exempt, name='dispatch')
class AdminProfileView(APIView):
    authentication_classes = [CSRFExemptSessionAuthentication]
    permission_classes = [SimpleAdminPermission]
    serializer_class = AdminCompleteProfileSerializer

    def get(self, request):
        try:
            user = request.user
            
            if not (user.is_staff or user.is_superuser):
                return APIResponse.error(message=AUTH_ERRORS["auth_not_authorized"], status_code=403)
            
            cache_key = UserCacheKeys.admin_profile(user.id, 'super' if user.is_superuser else 'regular')
            force_refresh = (
                request.query_params.get('refresh') == '1'
                or request.headers.get('X-Bypass-Cache') == '1'
            )
            
            if not force_refresh:
                cached_data = cache.get(cache_key)
                if cached_data:
                    cached_data = dict(cached_data)
                    cached_data.pop('csrf_token', None)
                    return APIResponse.success(message=AUTH_SUCCESS["auth_retrieved_successfully"], data=cached_data)
            
            user = User.objects.select_related(
                'user_profile',
                'admin_profile',
                'admin_profile__profile_picture'
            ).prefetch_related(
                'groups__permissions',
                'user_permissions',
                'admin_user_roles__role'
            ).get(id=request.user.id)
            
            serializer = self.serializer_class(user, context={'request': request})
            response_data = serializer.data
            response_data.pop('csrf_token', None)

            permission_data = PermissionHelper.get_optimized_permissions(user)
            response_data.update(permission_data)
            
            if not user.is_superuser:
                response_data['permission_categories'] = PermissionHelper.get_permission_categories(
                    permission_data['permissions']
                )
            
            cache_ttl = USER_SUPERADMIN_PROFILE_CACHE_TTL if user.is_superuser else USER_ADMIN_PROFILE_CACHE_TTL
            cache.set(cache_key, response_data, cache_ttl)
            
            return APIResponse.success(message=AUTH_SUCCESS["auth_retrieved_successfully"], data=response_data)
        except User.DoesNotExist:
            raise Http404(AUTH_ERRORS["auth_user_not_found"])
        except Exception as e:
            return APIResponse.error(message=AUTH_ERRORS["error_occurred"], status_code=500)
    
    def _get_user_roles_with_permissions(self, user):
        roles = []
        
        try:
            admin_roles = AdminUserRole.objects.filter(
                user=user, 
                is_active=True
            ).select_related('role')
            
            if admin_roles.exists():
                for admin_user_role in admin_roles:
                    role = admin_user_role.role
                    roles.append({
                        'id': role.id,
                        'name': role.name,
                        'display_name': role.display_name,
                        'level': role.level,
                        'permissions': role.permissions
                    })
                return roles
        except ImportError:
            pass
        
        for group in user.groups.all():
            perms = group.permissions.values_list('content_type__app_label', 'codename', 'name')
            
            perm_list = []
            for p in perms:
                perm_list.append({
                    'code': f"{p[0]}.{p[1]}",
                    'name': p[2]
                })
            
            roles.append({
                'id': group.id,
                'name': group.name,
                'permissions': perm_list
            })
            
        return roles
    
    def _get_permission_categories(self, permissions):
        categories = {}
        
        app_groups = {
            'auth': 'User Management',
            'admin': 'Administration',
            'contenttypes': 'Content Types',
            'sessions': 'Sessions',
            'portfolio': 'Portfolio Management',
            'media': 'Media Management',
            'core': 'Core System',
        }
        
        for perm in permissions:
            app, codename = perm.split('.')
            category = app_groups.get(app, app.title())
            
            if category not in categories:
                categories[category] = []
                
            cache_key = UserCacheKeys.permission_display_name(perm)
            display_name = cache.get(cache_key)
            
            if not display_name:
                display_name = " ".join(codename.split('_')).title()
                cache.set(cache_key, display_name, USER_PERMISSION_DISPLAY_NAME_TTL)
            
            categories[category].append({
                'code': perm,
                'name': display_name
            })
            
        for category in categories:
            categories[category] = sorted(categories[category], key=lambda x: x['name'])
            
        return categories
    
    def _get_accessible_modules(self, permissions):
        modules = set()
        
        for perm in permissions:
            if '.' in perm:
                app_label = perm.split('.')[0]
                modules.add(app_label)
        
        return list(modules)
    
    def _get_accessible_actions(self, permissions):
        actions = set()
        
        for perm in permissions:
            if '.' in perm:
                action = perm.split('.')[1]
                action_map = {
                    'add': 'create',
                    'change': 'update',
                    'delete': 'delete',
                    'view': 'read'
                }
                actions.add(action_map.get(action, action))
        
        return list(actions)
    
    def _get_permission_summary(self, permissions):
        modules = self._get_accessible_modules(permissions)
        actions = self._get_accessible_actions(permissions)
        
        return {
            'total_permissions': len(permissions),
            'accessible_modules': len(modules),
            'available_actions': len(actions),
            'access_type': 'role_based_access'
        }
    
    def put(self, request):
        user = request.user
        
        if not user.is_authenticated:
            return APIResponse.error(message=AUTH_ERRORS["auth_not_authorized"], status_code=401)
        
        if not (user.is_staff and user.user_type == 'admin' and user.is_admin_active):
            return APIResponse.error(message=AUTH_ERRORS["auth_not_authorized"], status_code=403)
        
        allowed_profile_fields = {
            'first_name', 'last_name', 'birth_date', 'profile_picture',
            'phone', 'address', 'province', 'city', 'bio', 'national_id'
        }
        received_data = request.data.copy()
        
        if 'profile' in received_data:
            profile_data = received_data['profile']
        else:
            profile_data = {k: v for k, v in received_data.items() if k in allowed_profile_fields}
        
        invalid_fields = set(profile_data.keys()) - allowed_profile_fields
        if invalid_fields:
            return APIResponse.error(message=AUTH_ERRORS["auth_validation_error"], status_code=400)
        
        try:
            admin_profile, created = AdminProfile.objects.get_or_create(
                admin_user=user,
                defaults={
                    'first_name': profile_data.get('first_name', ''),
                    'last_name': profile_data.get('last_name', ''),
                    'birth_date': profile_data.get('birth_date'),
                }
            )

            serializer = AdminProfileUpdateSerializer(
                admin_profile,
                data=profile_data,
                partial=True,
                context={
                    'request': request,
                    'user_id': user.id,
                    'admin_user_id': user.id
                }
            )

            if serializer.is_valid():
                serializer.save()

                AdminPermissionCache.clear_user_cache(user.id)
                PermissionValidator.clear_user_cache(user.id)
                PermissionHelper.clear_user_cache(user.id)

                user.refresh_from_db()
                if hasattr(user, 'admin_profile'):
                    user.admin_profile.refresh_from_db()
                    if hasattr(user.admin_profile, 'profile_picture') and user.admin_profile.profile_picture:
                        user.admin_profile.profile_picture.refresh_from_db()

                user = User.objects.select_related(
                    'user_profile',
                    'admin_profile',
                    'admin_profile__profile_picture'
                ).prefetch_related(
                    'groups__permissions',
                    'user_permissions'
                ).get(id=user.id)

                response_serializer = AdminCompleteProfileSerializer(
                    user,
                    context={'request': request}
                )

                return APIResponse.success(
                    message=AUTH_SUCCESS["user_updated_successfully"] if not created else AUTH_SUCCESS["auth_created_successfully"],
                    data=response_serializer.data
                )

            return APIResponse.error(message=AUTH_ERRORS["auth_validation_error"], errors=serializer.errors, status_code=400)
                
        except Exception as e:
            return APIResponse.error(message=AUTH_ERRORS["error_occurred"], status_code=500)
        
    def delete(self, request, *args, **kwargs):
        return APIResponse.error(message=AUTH_ERRORS["auth_not_authorized"], status_code=405)
