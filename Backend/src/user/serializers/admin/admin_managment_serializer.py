from rest_framework import serializers
from django.core.exceptions import ValidationError
from datetime import datetime
from src.user.models import User, AdminRole
from src.user.messages import AUTH_ERRORS
from src.media.models import ImageMedia
from src.user.serializers.user.user_profile_serializer import UserProfileSerializer
from src.user.serializers.admin.admin_profile_serializer import AdminProfileSerializer, AdminProfileUpdateSerializer
from src.user.utils.email_validator import validate_email_address
from src.user.utils.mobile_validator import validate_mobile_number
from django.db.models import Q

class AdminListSerializer(serializers.ModelSerializer):
    profile = serializers.SerializerMethodField()  # Dynamic profile field
    permissions = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()
    roles = serializers.SerializerMethodField()  # Add roles field
    
    class Meta:
        model = User
        fields = ['id', 'public_id', 'full_name', 'mobile', 'email', 'is_active', 'is_staff', 'is_superuser', 
                 'created_at', 'updated_at', 'profile', 'permissions', 'roles']
    
    def get_profile(self, obj):
        """Get profile based on user type - admin or regular user"""
        # ✅ ADMIN USER: Get admin_profile
        if obj.user_type == 'admin' and hasattr(obj, 'admin_profile') and obj.admin_profile:
            return AdminProfileSerializer(obj.admin_profile, context=self.context).data
        # ✅ REGULAR USER: Get user_profile  
        elif obj.user_type == 'user' and hasattr(obj, 'user_profile') and obj.user_profile:
            return UserProfileSerializer(obj.user_profile, context=self.context).data
        # ✅ NO PROFILE: Return None
        return None
    
    def get_full_name(self, obj):
        """Get full name efficiently from prefetched profile"""
        if hasattr(obj, 'admin_profile') and obj.admin_profile:
            profile = obj.admin_profile
            if profile.first_name and profile.last_name:
                return f"{profile.first_name} {profile.last_name}"
            elif profile.first_name:
                return profile.first_name
            elif profile.last_name:
                return profile.last_name
        return obj.mobile or obj.email or f"User {obj.id}"
    
    def get_roles(self, obj):
        """Get user roles for admin list"""
        # SUPERUSER: Return super_admin role
        if obj.is_superuser:
            return [{'name': 'super_admin', 'display_name': 'Super Admin'}]
        
        # REGULAR ADMIN: Get only assigned roles
        assigned_roles = []
        try:
            if hasattr(obj, 'adminuserrole_set'):
                user_role_assignments = obj.adminuserrole_set.filter(
                    is_active=True
                ).select_related('role')
                assigned_roles = [
                    {
                        'id': ur.role.id,
                        'name': ur.role.name,
                        'display_name': ur.role.display_name
                    } 
                    for ur in user_role_assignments
                ]
        except:
            pass
        
        return assigned_roles
    
    def get_permissions(self, user):
        """ Simplified permissions for admin list - much faster """
        # ✅ REGULAR USER: Simple response for website users
        if user.user_type == 'user' and not user.is_staff and not user.is_superuser:
            return {
                'access_level': 'user',
                'roles': [],
                'permissions_count': 0
            }
        
        # SUPERUSER: Simple response
        if user.is_superuser:
            return {
                'access_level': 'super_admin',
                'roles': ['super_admin'],
                'permissions_count': 'unlimited'
            }
        
        # REGULAR ADMIN: Get only assigned roles
        assigned_roles = []
        try:
            if hasattr(user, 'adminuserrole_set'):
                user_role_assignments = user.adminuserrole_set.filter(
                    is_active=True
                ).select_related('role')
                assigned_roles = [ur.role.name for ur in user_role_assignments]
        except:
            pass
        
        return {
            'access_level': 'admin',
            'roles': assigned_roles,
            'permissions_count': len(assigned_roles) * 10 if assigned_roles else 0,
            'has_permissions': len(assigned_roles) > 0
        }

class AdminDetailSerializer(serializers.ModelSerializer):
    profile = serializers.SerializerMethodField()  # Dynamic profile field
    permissions = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'public_id', 'email', 'mobile', 'is_active', 'is_staff', 'is_superuser', 
                 'created_at', 'updated_at', 'profile', 'full_name', 'permissions']
    
    def get_profile(self, obj):
        """Get profile based on user type - admin or regular user"""
        # ✅ ADMIN USER: Get admin_profile
        if obj.user_type == 'admin' and hasattr(obj, 'admin_profile') and obj.admin_profile:
            return AdminProfileSerializer(obj.admin_profile, context=self.context).data
        # ✅ REGULAR USER: Get user_profile  
        elif obj.user_type == 'user' and hasattr(obj, 'user_profile') and obj.user_profile:
            return UserProfileSerializer(obj.user_profile, context=self.context).data
        # ✅ NO PROFILE: Return None
        return None
    
    def get_full_name(self, user):
        """Get full name efficiently from prefetched profile - works for both admin and regular users"""
        # ✅ ADMIN USER: Get name from admin_profile
        if user.user_type == 'admin' and hasattr(user, 'admin_profile') and user.admin_profile:
            profile = user.admin_profile
            if profile.first_name and profile.last_name:
                return f"{profile.first_name} {profile.last_name}"
            elif profile.first_name:
                return profile.first_name
            elif profile.last_name:
                return profile.last_name
        # ✅ REGULAR USER: Get name from user_profile
        elif user.user_type == 'user' and hasattr(user, 'user_profile') and user.user_profile:
            profile = user.user_profile
            if profile.first_name and profile.last_name:
                return f"{profile.first_name} {profile.last_name}"
            elif profile.first_name:
                return profile.first_name
            elif profile.last_name:
                return profile.last_name
        # ✅ FALLBACK: Use mobile or email
        return user.mobile or user.email or f"User {user.id}"
    
    def get_permissions(self, user):
        """ Complete permissions for admin detail - full data """
        # ✅ REGULAR USER: Return user-level permissions
        if user.user_type == 'user' and not user.is_staff and not user.is_superuser:
            return {
                'access_level': 'user',
                'permissions': [],
                'roles': [],
                'modules': [],
                'actions': [],
                'permission_summary': {
                    'total_permissions': 0,
                    'accessible_modules': 0,
                    'available_actions': 0,
                    'access_type': 'website_user'
                }
            }
        
        # SUPERUSER: Full response
        if user.is_superuser:
            return {
                'access_level': 'super_admin',
                'permissions': ['all'],
                'roles': ['super_admin'],
                'modules': ['all'],
                'actions': ['all'],
                'permission_summary': {
                    'total_permissions': 'unlimited',
                    'access_type': 'full_system_access',
                    'restrictions': 'none'
                }
            }
        
        # REGULAR ADMIN: Get only assigned roles and their permissions
        assigned_roles = []
        permissions_list = []
        modules = set()
        actions = set()
        
        try:
            if hasattr(user, 'adminuserrole_set'):
                user_role_assignments = user.adminuserrole_set.filter(
                    is_active=True
                ).select_related('role')
                
                for ur in user_role_assignments:
                    assigned_roles.append(ur.role.name)
                    
                    # Get role permissions
                    role_permissions = ur.role.permissions.get('actions', [])
                    role_modules = ur.role.permissions.get('modules', [])
                    
                    # Add to collections
                    modules.update(role_modules)
                    actions.update(role_permissions)
                    
                    # Create permission strings
                    for module in role_modules:
                        for action in role_permissions:
                            if module != 'all' and action != 'all':
                                permissions_list.append(f"{module}.{action}")
        except Exception as e:
            pass
        
        return {
            'access_level': 'admin',
            'permissions': sorted(permissions_list),
            'roles': assigned_roles,
            'modules': list(modules),
            'actions': list(actions),
            'permission_summary': {
                'total_permissions': len(permissions_list),
                'accessible_modules': len(modules),
                'available_actions': len(actions),
                'access_type': 'role_based_access'
            }
        }

class AdminUpdateSerializer(serializers.Serializer):
    # User fields
    email = serializers.EmailField(required=False, allow_blank=True, allow_null=True)
    mobile = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True, allow_null=True)
    is_active = serializers.BooleanField(required=False)
    is_staff = serializers.BooleanField(required=False)
    is_superuser = serializers.BooleanField(required=False)
    
    # Add role_id field to accept the role from the frontend
    role_id = serializers.CharField(required=False, allow_blank=True, allow_null=True) # Accept ID as string or empty string

    # پذیرش آبجکت profile که از فرانت‌اند می‌آید
    profile = AdminProfileUpdateSerializer(required=False) # Changed to AdminProfileUpdateSerializer
    
    # Support for direct profile picture upload (alternative to using media library)
    profile_picture = serializers.ImageField(required=False, allow_null=True, write_only=True)

    # Flattened Profile fields (matching frontend)
    # Removed flattened profile fields as AdminProfileUpdateSerializer handles them

    def validate_profile_picture(self, value):
        """Validate uploaded profile picture file using media service"""
        if value is None:
            return value
        
        # Use central media validation
        from src.media.utils.validators import validate_image_file
        
        try:
            validate_image_file(value)
            return value
        except Exception as e:
            raise serializers.ValidationError(str(e))

    def validate_profile_picture_id(self, value):
        """Validate profile picture ID"""
        if value is None:
            return value
        
        try:
            image_media = ImageMedia.objects.get(id=value, is_active=True)
            return value
        except ImageMedia.DoesNotExist:
            raise serializers.ValidationError("Invalid media ID or media is not an active image")
    
    def validate_email(self, value):
        if value == "": 
            return None
        if value:
            user_id = self.context.get('user_id')
            try:
                validate_email_address(value)
                if User.objects.filter(~Q(id=user_id), email=value).exists():
                    raise serializers.ValidationError(AUTH_ERRORS["auth_email_exists"])
            except ValidationError:
                raise serializers.ValidationError(AUTH_ERRORS["auth_invalid_email"])
        return value
    
    def validate_mobile(self, value):
        if value == "":
            return None
        if value:
            user_id = self.context.get('user_id')
            try:
                validate_mobile_number(value)
                if User.objects.filter(~Q(id=user_id), mobile=value).exists():
                    raise serializers.ValidationError(AUTH_ERRORS["auth_mobile_exists"])
            except ValidationError:
                raise serializers.ValidationError(AUTH_ERRORS["auth_invalid_mobile"])
        return value

    def validate_role_id(self, value):
        """Validate role ID"""
        if value is None or value == "" or value == "none":
            return None
        
        try:
            role_id = int(value)
            # Check if role exists and is active
            AdminRole.objects.get(id=role_id, is_active=True)
            return role_id
        except (ValueError, TypeError):
            raise serializers.ValidationError("Invalid role ID format")
        except AdminRole.DoesNotExist:
            raise serializers.ValidationError("Role not found or inactive")

    def validate(self, data):
        print(f">>>>> STEP 3: Validating data in AdminUpdateSerializer.validate()")
        print(f">>>>> Data received in validate: {data}")
        print(f">>>>> Data keys: {data.keys()}")
        
        admin_user = self.context.get('admin_user')
        if data.get('is_superuser') is True and not admin_user.is_superuser:
            raise serializers.ValidationError({'is_superuser': AUTH_ERRORS["auth_only_superuser_set"]})

        # Extract profile data if it exists
        # Removed manual profile data mapping as AdminProfileUpdateSerializer handles it

        print(f">>>>> STEP 4: After validation in AdminUpdateSerializer - returning data")
        return data
    
    def to_internal_value(self, data):
        """Override to set proper instance for nested profile serializer"""
        # Get the user being updated
        user_id = self.context.get('user_id')
        print(f">>>>> AdminUpdateSerializer.to_internal_value - user_id: {user_id}")
        print(f">>>>> AdminUpdateSerializer.to_internal_value - data: {data}")
        print(f">>>>> AdminUpdateSerializer.to_internal_value - email in data: {'email' in data}")
        if 'email' in data:
            print(f">>>>> AdminUpdateSerializer.to_internal_value - email value: {data['email']}")
        
        if user_id:
            try:
                user = User.objects.get(id=user_id)
                print(f">>>>> User found: {user.id}, has admin_profile: {hasattr(user, 'admin_profile')}")
                
                if hasattr(user, 'admin_profile') and user.admin_profile:
                    # Set the instance for the nested profile serializer
                    data['profile'] = data.get('profile', {})
                    # Pass the admin_profile instance to the nested serializer
                    if 'profile' in data:
                        profile_data = data['profile']
                        print(f">>>>> Profile data before validation: {profile_data}")
                        print(f">>>>> Admin profile ID: {user.admin_profile.id}")
                        print(f">>>>> Admin profile national_id: {user.admin_profile.national_id}")
                        
                        # Create a temporary serializer to validate with proper instance
                        # Make sure admin_user_id is in the context for national_id validation
                        context_with_user_id = self.context.copy()
                        context_with_user_id['admin_user_id'] = user_id
                        temp_serializer = AdminProfileUpdateSerializer(
                            instance=user.admin_profile,
                            data=profile_data,
                            partial=True,
                            context=context_with_user_id
                        )
                        if temp_serializer.is_valid():
                            print(f">>>>> Validation SUCCESS! Validated data: {temp_serializer.validated_data}")
                            # Convert objects to IDs for super().to_internal_value()
                            profile_data_for_super = {}
                            for key, value in temp_serializer.validated_data.items():
                                if hasattr(value, 'id'):  # If it's a model instance
                                    profile_data_for_super[key] = value.id
                                    print(f">>>>> Converting {key} object to ID: {value.id}")
                                else:
                                    profile_data_for_super[key] = value
                            data['profile'] = profile_data_for_super
                            print(f">>>>> Profile data successfully added to data (objects converted to IDs)")
                        else:
                            print(f">>>>> Validation FAILED! Errors: {temp_serializer.errors}")
                            print(f">>>>> Raising ValidationError with profile errors")
                            raise serializers.ValidationError({'profile': temp_serializer.errors})
            except User.DoesNotExist:
                print(f">>>>> User not found with id: {user_id}")
                pass
        
        print(f">>>>> STEP 5: About to call super().to_internal_value(data)")
        print(f">>>>> STEP 5: Data being passed to super: {data}")
        
        # Remove profile from data before calling super() to avoid double validation
        profile_data = data.pop('profile', None)
        print(f">>>>> STEP 5: Removed profile from data to avoid double validation")
        print(f">>>>> STEP 5: Data after removing profile: {data}")
        
        try:
            result = super().to_internal_value(data)
            print(f">>>>> STEP 5: super().to_internal_value() completed successfully")
            print(f">>>>> STEP 5: Result from super: {result}")
            
            # Add profile data back to result
            if profile_data:
                result['profile'] = profile_data
                print(f">>>>> STEP 5: Added profile data back to result")
            
            return result
        except Exception as e:
            print(f">>>>> STEP 5: ERROR in super().to_internal_value(): {e}")
            print(f">>>>> STEP 5: Error type: {type(e)}")
            raise e

class AdminFilterSerializer(serializers.Serializer):
    user_type = serializers.ChoiceField(
        choices=['all', 'admin', 'user'],
        default='all',
        required=False
    )
    is_superuser = serializers.BooleanField(required=False, allow_null=True)
    search = serializers.CharField(required=False, allow_blank=True)

# AdminCreateSerializer removed - use AdminRegisterSerializer instead

class BulkDeleteSerializer(serializers.Serializer):
    ids = serializers.ListField(
        child=serializers.IntegerField(),
        allow_empty=False,
        min_length=1,
        help_text="List of numeric User IDs to delete."
    )
    user_type = serializers.CharField(required=False)

    def validate_ids(self, value):
        if not value:
            raise serializers.ValidationError("List of IDs cannot be empty.")
        if not all(isinstance(item, int) for item in value):
            raise serializers.ValidationError("All items in the list must be integers.")
        return value