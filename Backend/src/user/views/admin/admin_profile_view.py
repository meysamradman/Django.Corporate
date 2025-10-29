from django.utils.decorators import method_decorator
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_exempt
from rest_framework.views import APIView
from rest_framework.response import Response
from src.user.serializers.admin.admin_profile_serializer import AdminCompleteProfileSerializer
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import IsAuthenticated
from src.user.auth.admin_session_auth import CSRFExemptSessionAuthentication
from src.core.responses import APIResponse
from src.user.messages import AUTH_SUCCESS, AUTH_ERRORS
from django.http import Http404
from django.core.exceptions import ValidationError
from src.user.models import User
from src.user.utils.permission_helper import PermissionHelper
from django.core.cache import cache

@method_decorator(csrf_exempt, name='dispatch')
class AdminProfileView(APIView):
    authentication_classes = [CSRFExemptSessionAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = AdminCompleteProfileSerializer

    def get(self, request):
        """ Optimized get method with Smart Response Strategy """
        try:
            user = request.user
            
            # Check if user has admin access
            if not (user.is_staff or user.is_superuser):
                return Response({
                    "metaData": {
                        "status": "error",
                        "message": "Admin access required",
                        "AppStatusCode": 403,
                        "timestamp": "2025-10-14T21:49:06.041Z"
                    },
                    "data": {}
                }, status=403)
            
            # Cache key based on user type
            cache_key = f"admin_profile_{user.id}_{'super' if user.is_superuser else 'regular'}"
            
            # Try to get from cache
            cached_data = cache.get(cache_key)
            if cached_data:
                # Remove csrf_token from response for security
                cached_data.pop('csrf_token', None)
                return Response({
                    "metaData": {
                        "status": "success",
                        "message": AUTH_SUCCESS["auth_retrieved_successfully"],
                        "AppStatusCode": 200,
                        "timestamp": "2025-10-14T21:49:06.041Z"
                    },
                    "data": cached_data
                })
            
            # Fetch the User instance with related profile and permissions prefetched
            user = User.objects.select_related(
                'user_profile',
                'admin_profile',
                'admin_profile__profile_picture'
            ).prefetch_related(
                'groups__permissions',
                'user_permissions'
            ).get(id=request.user.id)
            
            # Debug: Check if profile_picture exists
            if hasattr(user, 'admin_profile') and user.admin_profile:
                print(f"🔍 AdminProfile Debug - profile_picture: {user.admin_profile.profile_picture}")
                if user.admin_profile.profile_picture:
                    print(f"🔍 Profile Picture Debug - ID: {user.admin_profile.profile_picture.id}, URL: {user.admin_profile.profile_picture.file.url}")
                else:
                    print("🔍 Profile Picture Debug - No profile picture found")
            
            # Directly instantiate the serializer class
            serializer = self.serializer_class(user, context={'request': request})
            
            # Prepare response data
            response_data = serializer.data
            
            # Remove csrf_token from response for security
            response_data.pop('csrf_token', None)

            # Use centralized permission helper - eliminates code duplication
            permission_data = PermissionHelper.get_optimized_permissions(user)
            response_data.update(permission_data)
            
            # Add permission categories for detailed views if needed
            if not user.is_superuser:
                response_data['permission_categories'] = PermissionHelper.get_permission_categories(
                    permission_data['permissions']
                )
            
            # Cache for different durations based on user type
            if user.is_superuser:
                # Superuser data is static, cache longer
                cache.set(cache_key, response_data, 1800)  # 30 minutes
            else:
                # Regular admin permissions might change
                cache.set(cache_key, response_data, 300)   # 5 minutes
            
            return Response({
                "metaData": {
                    "status": "success",
                    "message": AUTH_SUCCESS["auth_retrieved_successfully"],
                    "AppStatusCode": 200,
                    "timestamp": "2025-10-14T21:49:06.041Z"
                },
                "data": response_data
            })
        except User.DoesNotExist:
            raise Http404(AUTH_ERRORS["auth_user_not_found"])
        except Exception as e:
            # Log the error
            return Response({
                "metaData": {
                    "status": "error",
                    "message": str(e),
                    "AppStatusCode": 500,
                    "timestamp": "2025-10-14T21:49:06.041Z"
                },
                "data": {}
            }, status=500)
    
    def _get_user_roles_with_permissions(self, user):
        """Get user's roles with their associated permissions."""
        roles = []
        
        # Try to get AdminUserRole first (our custom system)
        try:
            from src.user.models import AdminUserRole
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
        
        # Fallback to Django Groups
        for group in user.groups.all():
            # Get permissions for this group
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
        """Group permissions by category for better frontend organization."""
        categories = {}
        
        # Define common application groups and map them to user-friendly names
        app_groups = {
            'auth': 'User Management',
            'admin': 'Administration',
            'contenttypes': 'Content Types',
            'sessions': 'Sessions',
            'portfolio': 'Portfolio Management',
            'media': 'Media Management',
            'core': 'Core System',
            # Add more mappings as needed for your specific apps
        }
        
        for perm in permissions:
            app, codename = perm.split('.')
            
            # Get friendly category name or use app name
            category = app_groups.get(app, app.title())
            
            if category not in categories:
                categories[category] = []
                
            # Get permission display name from cache if possible
            cache_key = f"perm_name_{perm}"
            display_name = cache.get(cache_key)
            
            if not display_name:
                # Use codename with spaces (faster than DB query)
                display_name = " ".join(codename.split('_')).title()
                # Cache the result for 24 hours
                cache.set(cache_key, display_name, 86400)
            
            categories[category].append({
                'code': perm,
                'name': display_name
            })
            
        # Sort each category's permissions by name
        for category in categories:
            categories[category] = sorted(categories[category], key=lambda x: x['name'])
            
        return categories
    
    def _get_accessible_modules(self, permissions):
        """Extract accessible modules from permissions"""
        modules = set()
        
        for perm in permissions:
            if '.' in perm:
                app_label = perm.split('.')[0]
                modules.add(app_label)
        
        return list(modules)
    
    def _get_accessible_actions(self, permissions):
        """Extract accessible actions from permissions"""
        actions = set()
        
        for perm in permissions:
            if '.' in perm:
                action = perm.split('.')[1]
                # Map Django actions to readable names
                action_map = {
                    'add': 'create',
                    'change': 'update',
                    'delete': 'delete',
                    'view': 'read'
                }
                actions.add(action_map.get(action, action))
        
        return list(actions)
    
    def _get_permission_summary(self, permissions):
        """Get permission summary for regular admin"""
        modules = self._get_accessible_modules(permissions)
        actions = self._get_accessible_actions(permissions)
        
        return {
            'total_permissions': len(permissions),
            'accessible_modules': len(modules),
            'available_actions': len(actions),
            'access_type': 'role_based_access'
        }

    # Note: PUT method for updating admin profile is handled by AdminManagementView
    # Use: PUT /api/admin/management/<user_id>/ for updating admin users
    # Use: PUT /api/admin/management/<current_user_id>/ for updating own profile
    
    def put(self, request):
        """Update current admin's own profile - SECURE implementation"""
        user = request.user
        
        # Security check 1: Authentication
        if not user.is_authenticated:
            return Response({
                "metaData": {
                    "status": "error",
                    "message": "Authentication credentials were not provided.",
                    "AppStatusCode": 401,
                    "timestamp": "2025-10-14T21:49:06.041Z"
                },
                "data": {}
            }, status=401)
        
        # Security check 2: Admin access
        if not (user.is_staff and user.user_type == 'admin' and user.is_admin_active):
            return Response({
                "metaData": {
                    "status": "error",
                    "message": "Admin access required",
                    "AppStatusCode": 403,
                    "timestamp": "2025-10-14T21:49:06.041Z"
                },
                "data": {}
            }, status=403)
        
        # Security check 3: Only allow profile updates, not user model fields
        allowed_profile_fields = {
            'first_name', 'last_name', 'birth_date', 'profile_picture',
            'phone', 'address', 'province', 'city', 'bio', 'national_id'
        }
        received_data = request.data.copy()
        
        # Extract only profile data
        if 'profile' in received_data:
            profile_data = received_data['profile']
        else:
            # Handle flat structure
            profile_data = {k: v for k, v in received_data.items() if k in allowed_profile_fields}
        
        # Security check 4: Validate only allowed fields
        invalid_fields = set(profile_data.keys()) - allowed_profile_fields
        if invalid_fields:
            return Response({
                "metaData": {
                    "status": "error",
                    "message": f"Invalid fields: {', '.join(invalid_fields)}. Only profile fields are allowed.",
                    "AppStatusCode": 400,
                    "timestamp": "2025-10-14T21:49:06.041Z"
                },
                "data": {}
            }, status=400)
        
        try:
            # Import the specific profile serializer for admin
            from src.user.serializers.admin.admin_profile_serializer import AdminProfileUpdateSerializer
            
            # Get or create admin profile
            from src.user.models import AdminProfile
            admin_profile, created = AdminProfile.objects.get_or_create(
                admin_user=user,
                defaults={
                    'first_name': profile_data.get('first_name', ''),
                    'last_name': profile_data.get('last_name', ''),
                    'birth_date': profile_data.get('birth_date'),
                }
            )
            
            if not created:
                # Update existing profile with only the provided fields
                serializer = AdminProfileUpdateSerializer(
                    admin_profile, 
                    data=profile_data, 
                    partial=True,  # Allow partial updates
                    context={
                        'request': request, 
                        'user_id': user.id,
                        'admin_user_id': user.id  # Add admin_user_id for validation
                    }
                )
                
                if serializer.is_valid():
                    updated_profile = serializer.save()
                    
                    # Clear cache for this user
                    cache_key = f"admin_profile_{user.id}_{'super' if user.is_superuser else 'regular'}"
                    cache.delete(cache_key)
                    
                    # Debug: Check profile_picture before update
                    print(f"🔍 Before Update - profile_picture: {admin_profile.profile_picture}")
                    if admin_profile.profile_picture:
                        print(f"🔍 Before Update - Profile Picture ID: {admin_profile.profile_picture.id}")
                    
                    # Refresh user and related profile data from database
                    user.refresh_from_db()
                    if hasattr(user, 'admin_profile'):
                        user.admin_profile.refresh_from_db()
                        # Also refresh the profile picture specifically
                        if hasattr(user.admin_profile, 'profile_picture') and user.admin_profile.profile_picture:
                            user.admin_profile.profile_picture.refresh_from_db()
                    
                    # Re-fetch user with fresh data from database
                    user = User.objects.select_related(
                        'user_profile',
                        'admin_profile',
                        'admin_profile__profile_picture'
                    ).prefetch_related(
                        'groups__permissions',
                        'user_permissions'
                    ).get(id=user.id)
                    
                    # Debug: Check profile_picture after update
                    if hasattr(user, 'admin_profile') and user.admin_profile:
                        print(f"🔍 After Update - profile_picture: {user.admin_profile.profile_picture}")
                        if user.admin_profile.profile_picture:
                            print(f"🔍 After Update - Profile Picture ID: {user.admin_profile.profile_picture.id}, URL: {user.admin_profile.profile_picture.file.url}")
                        else:
                            print("🔍 After Update - No profile picture found")
                    
                    from src.user.serializers.admin.admin_profile_serializer import AdminCompleteProfileSerializer
                    response_serializer = AdminCompleteProfileSerializer(
                        user, 
                        context={'request': request}
                    )
                    
                    return Response({
                        "metaData": {
                            "status": "success",
                            "message": "Profile updated successfully",
                            "AppStatusCode": 200,
                            "timestamp": "2025-10-14T21:49:06.041Z"
                        },
                        "data": response_serializer.data
                    })
                else:
                    return Response({
                        "metaData": {
                            "status": "error",
                            "message": "Validation failed",
                            "AppStatusCode": 400,
                            "timestamp": "2025-10-14T21:49:06.041Z"
                        },
                        "data": {},
                        "errors": serializer.errors
                    }, status=400)
            else:
                # Profile was just created, return success
                user.refresh_from_db()
                
                # Re-fetch user with fresh data from database
                user = User.objects.select_related(
                    'user_profile',
                    'admin_profile',
                    'admin_profile__profile_picture'
                ).prefetch_related(
                    'groups__permissions',
                    'user_permissions'
                ).get(id=user.id)
                
                from src.user.serializers.admin.admin_profile_serializer import AdminCompleteProfileSerializer
                response_serializer = AdminCompleteProfileSerializer(
                    user, 
                    context={'request': request}
                )
                
                return Response({
                    "metaData": {
                        "status": "success",
                        "message": "Profile created successfully",
                        "AppStatusCode": 200,
                        "timestamp": "2025-10-14T21:49:06.041Z"
                    },
                    "data": response_serializer.data
                })
                
        except Exception as e:
            return Response({
                "metaData": {
                    "status": "error",
                    "message": "Failed to update profile",
                    "AppStatusCode": 500,
                    "timestamp": "2025-10-14T21:49:06.041Z"
                },
                "data": {}
            }, status=500)
        
        def delete(self, request, *args, **kwargs):
            """Delete current admin profile"""
            return Response({
                "metaData": {
                    "status": "error",
                    "message": "Method not allowed",
                    "AppStatusCode": 405,
                    "timestamp": "2025-10-14T21:49:06.041Z"
                },
                "data": {}
            }, status=405)
