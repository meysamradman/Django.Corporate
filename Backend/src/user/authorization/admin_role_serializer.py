from rest_framework import serializers
from src.user.models import AdminRole, AdminUserRole, User
from django.core.exceptions import ValidationError
from src.user.messages import AUTH_ERRORS, ROLE_ERRORS
from src.user.messages.permission import PERMISSION_ERRORS
from src.user.permissions.config import AVAILABLE_MODULES, AVAILABLE_ACTIONS
from src.user.permissions.registry import PermissionRegistry


class AdminRoleSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = AdminRole
        fields = [
            'id', 'public_id', 'name', 'display_name', 'description',
            'permissions', 'level', 'is_system_role', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'public_id', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        validated_data['is_system_role'] = False
        role = super().create(validated_data)
        return role
    
    def validate_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError(AUTH_ERRORS.get("auth_validation_error"))
        cleaned_name = value.strip()
        if cleaned_name.isascii():
            return cleaned_name.lower().replace(' ', '_')
        else:
            return cleaned_name
    
    def validate(self, attrs):
        if 'name' in attrs and ('display_name' not in attrs or not attrs.get('display_name')):
            name = attrs['name']
            if not name.isascii():
                attrs['display_name'] = name
            else:
                display_name = name.replace('_', ' ').replace('-', ' ').title()
                attrs['display_name'] = display_name
        return super().validate(attrs)
    
    def validate_permissions(self, value):
        if value is None:
            return {}
        if not isinstance(value, dict):
            raise serializers.ValidationError(ROLE_ERRORS["permissions_must_be_json"])
        if not value:
            return {}
        if 'specific_permissions' in value:
            specific_perms = value['specific_permissions']
            if not isinstance(specific_perms, list):
                raise serializers.ValidationError(ROLE_ERRORS["specific_permissions_must_be_list"])
            allowed_modules = {'all', *AVAILABLE_MODULES.keys()}
            allowed_actions = {'create', 'read', 'update', 'delete', 'export', 'manage', 'all', 'import'}
            for perm in specific_perms:
                if not isinstance(perm, dict):
                    raise serializers.ValidationError(ROLE_ERRORS["permission_must_be_dict"])
                if 'permission_key' in perm and perm['permission_key']:
                    if not PermissionRegistry.exists(perm['permission_key']):
                        raise serializers.ValidationError(PERMISSION_ERRORS['invalid_permission_key'].format(permission_key=perm['permission_key']))
                    continue
                if 'module' not in perm or 'action' not in perm:
                    raise serializers.ValidationError(ROLE_ERRORS["permission_missing_fields"])
                if perm['module'] not in allowed_modules:
                    raise serializers.ValidationError(PERMISSION_ERRORS['invalid_module'].format(module=perm['module']))
                if perm['action'] not in allowed_actions:
                    raise serializers.ValidationError(PERMISSION_ERRORS['invalid_action'].format(action=perm['action']))
            return value
        allowed_keys = {'modules', 'actions', 'restrictions', 'special'}
        if not any(key in value for key in allowed_keys):
            return {}
        
        if 'modules' in value:
            modules = value['modules']
            if not isinstance(modules, list):
                raise serializers.ValidationError(ROLE_ERRORS["modules_must_be_list"])
            
            allowed_modules = {'all', *AVAILABLE_MODULES.keys()}
            invalid_modules = set(modules) - allowed_modules
            if invalid_modules:
                raise serializers.ValidationError(
                    "Invalid modules: {}. Allowed: {}".format(
                        ', '.join(invalid_modules), 
                        ', '.join(allowed_modules)
                    )
                )
        
        if 'actions' in value:
            actions = value['actions']
            if not isinstance(actions, list):
                raise serializers.ValidationError(ROLE_ERRORS["actions_must_be_list"])
            
            allowed_actions = {'create', 'read', 'update', 'delete', 'export', 'all'}
            invalid_actions = set(actions) - allowed_actions
            if invalid_actions:
                raise serializers.ValidationError(
                    "Invalid actions: {}. Allowed: {}".format(
                        ', '.join(invalid_actions),
                        ', '.join(allowed_actions)
                    )
                )
        
        return value
    
    def validate_level(self, value):
        if value < 1 or value > 10:
            raise serializers.ValidationError(ROLE_ERRORS["level_invalid_range"])
        return value


class AdminRoleAssignmentSerializer(serializers.ModelSerializer):
    role_name = serializers.CharField(source='role.name', read_only=True)
    role_display_name = serializers.CharField(source='role.display_name', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_mobile = serializers.CharField(source='user.mobile', read_only=True)
    assigned_by_name = serializers.CharField(source='assigned_by.email', read_only=True)
    role = AdminRoleSerializer(read_only=True)
    
    class Meta:
        model = AdminUserRole
        fields = [
            'id', 'public_id', 'user', 'role', 'assigned_by', 'assigned_at',
            'expires_at', 'permissions_cache', 'last_cache_update', 'is_active',
            'role_name', 'role_display_name', 'user_email', 'user_mobile', 'assigned_by_name'
        ]
        read_only_fields = [
            'id', 'public_id', 'assigned_at', 'permissions_cache', 
            'last_cache_update', 'role_name', 'role_display_name',
            'user_email', 'user_mobile', 'assigned_by_name', 'role'
        ]
    
    def validate_user(self, value):
        if not value.is_staff or not value.is_admin_active:
            raise serializers.ValidationError(
                ROLE_ERRORS.get("role_only_admin_can_be_assigned")
            )
        return value
    
    def validate(self, attrs):
        user = attrs.get('user')
        role = attrs.get('role')
        
        if user and role:
            existing = AdminUserRole.objects.filter(
                user=user, role=role, is_active=True
            ).exists()
            
            if existing:
                raise serializers.ValidationError(
                    ROLE_ERRORS.get("role_already_assigned")
                )
        
        return attrs


class AdminRoleListSerializer(serializers.ModelSerializer):
    users_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = AdminRole
        fields = [
            'id', 'public_id', 'name', 'display_name', 'description',
            'level', 'is_system_role', 'is_active', 'users_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'public_id', 'created_at', 'updated_at']


class AdminRolePermissionsSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = AdminRole
        fields = ['permissions']
    
    def validate_permissions(self, value):
        if value is None:
            return {}
        if not isinstance(value, dict):
            raise serializers.ValidationError(ROLE_ERRORS["permissions_must_be_json"])
        if not value:
            return {}
        serializer = AdminRoleSerializer()
        return serializer.validate_permissions(value)


class UserRoleAssignmentSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    role_ids = serializers.ListField(
        child=serializers.IntegerField(),
        allow_empty=False
    )
    expires_at = serializers.DateTimeField(required=False, allow_null=True)
    
    def validate_user_id(self, value):
        try:
            user = User.objects.get(id=value)
            if not user.is_staff or not user.is_admin_active:
                raise serializers.ValidationError(
                    ROLE_ERRORS.get("role_only_admin_can_be_assigned")
                )
            return value
        except User.DoesNotExist:
            raise serializers.ValidationError(ROLE_ERRORS.get("user_not_found"))
    
    def validate_role_ids(self, value):
        existing_roles = AdminRole.objects.filter(
            id__in=value, is_active=True
        ).values_list('id', flat=True)
        missing_roles = set(value) - set(existing_roles)
        if missing_roles:
            raise serializers.ValidationError(
                ROLE_ERRORS.get("role_invalid_ids")
            )
        return value
