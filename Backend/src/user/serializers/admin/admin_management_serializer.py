from rest_framework import serializers
from django.core.exceptions import ValidationError
from datetime import datetime
from django.db.models import Q
from src.user.models import User, AdminRole
from src.user.messages import AUTH_ERRORS, ROLE_ERRORS
from src.media.models import ImageMedia
from src.media.utils.validators import validate_image_file
from src.user.utils.email_validator import validate_email_address
from src.user.utils.mobile_validator import validate_mobile_number
from src.user.access_control import BASE_ADMIN_PERMISSIONS
from src.user.serializers.admin.admin_profile_serializer import AdminProfileSerializer
from src.user.serializers.user.user_profile_serializer import UserProfileSerializer
from src.user.serializers.admin.admin_profile_serializer import AdminProfileUpdateSerializer

BASE_ADMIN_PERMISSIONS_SIMPLE = list(BASE_ADMIN_PERMISSIONS.keys())


class AdminListSerializer(serializers.ModelSerializer):
    profile = serializers.SerializerMethodField()
    permissions = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()
    roles = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'public_id', 'full_name', 'mobile', 'email', 'is_active', 'is_staff', 'is_superuser', 
                 'created_at', 'updated_at', 'profile', 'permissions', 'roles']
    
    def get_profile(self, obj):
        if obj.user_type == 'admin' and hasattr(obj, 'admin_profile') and obj.admin_profile:
            return AdminProfileSerializer(obj.admin_profile, context=self.context).data
        elif obj.user_type == 'user' and hasattr(obj, 'user_profile') and obj.user_profile:
            return UserProfileSerializer(obj.user_profile, context=self.context).data
        return None
    
    def get_full_name(self, obj):
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
        if obj.is_superuser:
            return [{'name': 'super_admin', 'display_name': 'Super Admin'}]
        
        assigned_roles = []
        try:
            if hasattr(obj, '_prefetched_objects_cache') and 'admin_user_roles' in obj._prefetched_objects_cache:
                user_role_assignments = [
                    ur for ur in obj._prefetched_objects_cache['admin_user_roles']
                    if ur.is_active
                ]
                assigned_roles = [
                    {
                        'id': ur.role.id,
                        'name': ur.role.name,
                        'display_name': ur.role.display_name
                    } 
                    for ur in user_role_assignments
                ]
            elif hasattr(obj, 'admin_user_roles'):
                user_role_assignments = obj.admin_user_roles.filter(
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
        if user.user_type == 'user' and not user.is_staff and not user.is_superuser:
            return {
                'access_level': 'user',
                'roles': [],
                'permissions_count': 0
            }
        
        if user.is_superuser:
            return {
                'access_level': 'super_admin',
                'roles': ['super_admin'],
                'permissions_count': 'unlimited',
                'base_permissions': []
            }
        
        assigned_roles = []
        try:
            if hasattr(user, '_prefetched_objects_cache') and 'admin_user_roles' in user._prefetched_objects_cache:
                user_role_assignments = [
                    ur for ur in user._prefetched_objects_cache['admin_user_roles']
                    if ur.is_active
                ]
                assigned_roles = [ur.role.name for ur in user_role_assignments]
            elif hasattr(user, 'admin_user_roles'):
                user_role_assignments = user.admin_user_roles.filter(
                    is_active=True
                ).select_related('role')
                assigned_roles = [ur.role.name for ur in user_role_assignments]
        except:
            pass
        
        return {
            'access_level': 'admin',
            'roles': assigned_roles,
            'permissions_count': len(assigned_roles) * 10 if assigned_roles else 0,
            'has_permissions': len(assigned_roles) > 0,
            'base_permissions': BASE_ADMIN_PERMISSIONS_SIMPLE
        }


class AdminDetailSerializer(serializers.ModelSerializer):
    profile = serializers.SerializerMethodField()
    permissions = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'public_id', 'email', 'mobile', 'is_active', 'is_staff', 'is_superuser', 
                 'created_at', 'updated_at', 'profile', 'full_name', 'permissions']
    
    def get_profile(self, obj):
        if obj.user_type == 'admin' and hasattr(obj, 'admin_profile') and obj.admin_profile:
            return AdminProfileSerializer(obj.admin_profile, context=self.context).data
        elif obj.user_type == 'user' and hasattr(obj, 'user_profile') and obj.user_profile:
            return UserProfileSerializer(obj.user_profile, context=self.context).data
        return None
    
    def get_full_name(self, user):
        if user.user_type == 'admin' and hasattr(user, 'admin_profile') and user.admin_profile:
            profile = user.admin_profile
            if profile.first_name and profile.last_name:
                return f"{profile.first_name} {profile.last_name}"
            elif profile.first_name:
                return profile.first_name
            elif profile.last_name:
                return profile.last_name
        elif user.user_type == 'user' and hasattr(user, 'user_profile') and user.user_profile:
            profile = user.user_profile
            if profile.first_name and profile.last_name:
                return f"{profile.first_name} {profile.last_name}"
            elif profile.first_name:
                return profile.first_name
            elif profile.last_name:
                return profile.last_name
        return user.mobile or user.email or f"User {user.id}"
    
    def get_permissions(self, user):
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
        
        if user.is_superuser:
            return {
                'access_level': 'super_admin',
                'permissions': ['all'],
                'roles': ['super_admin'],
                'modules': ['all'],
                'actions': ['all'],
                'base_permissions': [],
                'permission_summary': {
                    'total_permissions': 'unlimited',
                    'access_type': 'full_system_access',
                    'restrictions': 'none'
                }
            }
        
        assigned_roles = []
        permissions_list = []
        modules = set()
        actions = set()
        
        try:
            if hasattr(user, 'admin_user_roles'):
                user_role_assignments = user.admin_user_roles.filter(
                    is_active=True
                ).select_related('role')
                
                for ur in user_role_assignments:
                    assigned_roles.append(ur.role.name)
                    
                    role_perms = ur.role.permissions
                    
                    if 'specific_permissions' in role_perms:
                        specific_perms = role_perms.get('specific_permissions', [])
                        if isinstance(specific_perms, list):
                            for perm in specific_perms:
                                if isinstance(perm, dict):
                                    module = perm.get('module')
                                    action = perm.get('action')
                                    if module and action:
                                        modules.add(module)
                                        actions.add(action)
                                        if module != 'all' and action != 'all':
                                            permissions_list.append(f"{module}.{action}")
                    else:
                        role_actions = role_perms.get('actions', [])
                        role_modules = role_perms.get('modules', [])
                        
                        modules.update(role_modules)
                        actions.update(role_actions)
                        
                        for module in role_modules:
                            for action in role_actions:
                                if module != 'all' and action != 'all':
                                    permissions_list.append(f"{module}.{action}")
        except Exception as e:
            pass
        
        return {
            'access_level': 'admin',
            'permissions': sorted(list(permissions_list)),
            'roles': assigned_roles,
            'modules': list(modules),
            'actions': list(actions),
            'base_permissions': BASE_ADMIN_PERMISSIONS,
            'permission_summary': {
                'total_permissions': len(permissions_list),
                'accessible_modules': len(modules),
                'available_actions': len(actions),
                'access_type': 'role_based_access'
            }
        }


class AdminUpdateSerializer(serializers.Serializer):
    email = serializers.EmailField(required=False, allow_blank=True, allow_null=True)
    mobile = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True, allow_null=True)
    is_active = serializers.BooleanField(required=False)
    is_staff = serializers.BooleanField(required=False)
    is_superuser = serializers.BooleanField(required=False)
    
    role_id = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    profile = serializers.DictField(required=False)
    
    profile_picture = serializers.ImageField(required=False, allow_null=True, write_only=True)

    def validate_profile_picture(self, value):
        if value is None:
            return value
        
        try:
            validate_image_file(value)
            return value
        except Exception as e:
            raise serializers.ValidationError(str(e))

    def validate_profile_picture_id(self, value):
        if value is None:
            return value
        
        try:
            image_media = ImageMedia.objects.get(id=value, is_active=True)
            return value
        except ImageMedia.DoesNotExist:
            raise serializers.ValidationError(AUTH_ERRORS["auth_media_id_invalid"])
    
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
                validated_mobile = validate_mobile_number(value)
                if User.objects.filter(~Q(id=user_id), mobile=validated_mobile).exists():
                    raise serializers.ValidationError(AUTH_ERRORS["auth_mobile_exists"])
                return validated_mobile
            except ValidationError:
                raise serializers.ValidationError(AUTH_ERRORS["auth_invalid_mobile"])
        return value

    def validate_role_id(self, value):
        if value is None or value == "" or value == "none":
            return None
        
        try:
            role_id = int(value)
            AdminRole.objects.get(id=role_id, is_active=True)
            return role_id
        except (ValueError, TypeError):
            raise serializers.ValidationError(ROLE_ERRORS["role_invalid_ids"])
        except AdminRole.DoesNotExist:
            raise serializers.ValidationError(ROLE_ERRORS["role_not_found"])

    def validate(self, data):
        admin_user = self.context.get('admin_user')
        if data.get('is_superuser') is True and not admin_user.is_superuser:
            raise serializers.ValidationError({'is_superuser': AUTH_ERRORS["auth_only_superuser_set"]})

        return data
    
    def to_internal_value(self, data):
        user_id = self.context.get('user_id')
        
        if user_id:
            try:
                user = User.objects.get(id=user_id)
                
                if hasattr(user, 'admin_profile') and user.admin_profile:
                    data['profile'] = data.get('profile', {})
                    profile_data = data['profile']
                    
                    if 'profile_picture' in data:
                        profile_data['profile_picture'] = data['profile_picture']
                    
                    context_with_user_id = self.context.copy()
                    context_with_user_id['admin_user_id'] = user_id
                    temp_serializer = AdminProfileUpdateSerializer(
                        instance=user.admin_profile,
                        data=profile_data,
                        partial=True,
                        context=context_with_user_id
                    )
                    if temp_serializer.is_valid():
                        profile_data_for_super = {}
                        for key, value in temp_serializer.validated_data.items():
                            if hasattr(value, 'id'):
                                profile_data_for_super[key] = value.id
                            else:
                                profile_data_for_super[key] = value
                        data['profile'] = profile_data_for_super
                    else:
                        raise serializers.ValidationError({'profile': temp_serializer.errors})
            except User.DoesNotExist:
                pass
        
        profile_data = data.pop('profile', None)
        
        try:
            result = super().to_internal_value(data)
            
            if profile_data:
                result['profile'] = profile_data
            
            return result
        except Exception as e:
            raise e


class AdminFilterSerializer(serializers.Serializer):
    user_type = serializers.ChoiceField(
        choices=['all', 'admin', 'user'],
        default='all',
        required=False
    )
    is_superuser = serializers.BooleanField(required=False, allow_null=True)
    search = serializers.CharField(required=False, allow_blank=True)


class BulkDeleteSerializer(serializers.Serializer):
    ids = serializers.ListField(
        child=serializers.IntegerField(),
        allow_empty=False,
        min_length=1,
        help_text="List of numeric user IDs to delete"
    )
    user_type = serializers.CharField(required=False)

    def validate_ids(self, value):
        if not value:
            raise serializers.ValidationError(AUTH_ERRORS["id_list_empty"])
        if not all(isinstance(item, int) for item in value):
            raise serializers.ValidationError(AUTH_ERRORS["ids_must_be_integers"])
        return value