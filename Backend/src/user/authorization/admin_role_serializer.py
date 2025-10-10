from rest_framework import serializers
from src.user.models import AdminRole, AdminUserRole, User
from django.core.exceptions import ValidationError


class AdminRoleSerializer(serializers.ModelSerializer):
    """
    Serializer for AdminRole model - new advanced role system
    """
    
    class Meta:
        model = AdminRole
        fields = [
            'id', 'public_id', 'name', 'display_name', 'description',
            'permissions', 'level', 'is_system_role', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'public_id', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        """Override create to set is_system_role=False for user-created roles"""
        # User-created roles should NOT be system roles
        validated_data['is_system_role'] = False
        return super().create(validated_data)
    
    def validate_name(self, value):
        """Validate role name - support Persian/Arabic text"""
        if not value or not value.strip():
            raise serializers.ValidationError("Role name is required")
        
        # Keep original text for Persian/Arabic support
        cleaned_name = value.strip()
        
        # Only convert to snake_case if it's English text
        if cleaned_name.isascii():
            return cleaned_name.lower().replace(' ', '_')
        else:
            # For Persian/Arabic text, keep as-is but trimmed
            return cleaned_name
    
    def validate(self, attrs):
        """Auto-generate display_name if not provided"""
        # If display_name is not provided, generate it from name
        if 'name' in attrs and ('display_name' not in attrs or not attrs.get('display_name')):
            name = attrs['name']
            
            # For Persian/Arabic text, use name as display_name
            if not name.isascii():
                attrs['display_name'] = name
            else:
                # Convert snake_case or kebab-case to Title Case for English
                display_name = name.replace('_', ' ').replace('-', ' ').title()
                attrs['display_name'] = display_name
            
        return super().validate(attrs)
    
    def validate_permissions(self, value):
        """Validate permissions JSON structure"""
        if not isinstance(value, dict):
            raise serializers.ValidationError("Permissions must be a valid JSON object")
        
        # If empty dict, allow it (no permissions)
        if not value:
            return value
        
        # Validate required keys
        allowed_keys = {'modules', 'actions', 'restrictions', 'special'}
        if not any(key in value for key in allowed_keys):
            raise serializers.ValidationError(
                "Permissions must contain at least one of: modules, actions, restrictions, special"
            )
        
        # Validate modules
        if 'modules' in value:
            modules = value['modules']
            if not isinstance(modules, list):
                raise serializers.ValidationError("modules must be a list")
            
            allowed_modules = {'all', 'users', 'media', 'portfolio', 'blog', 'categories', 'analytics'}
            invalid_modules = set(modules) - allowed_modules
            if invalid_modules:
                raise serializers.ValidationError(
                    "Invalid modules: {}. Allowed: {}".format(
                        ', '.join(invalid_modules), 
                        ', '.join(allowed_modules)
                    )
                )
        
        # Validate actions
        if 'actions' in value:
            actions = value['actions']
            if not isinstance(actions, list):
                raise serializers.ValidationError("actions must be a list")
            
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
        """Validate role level"""
        if value < 1 or value > 10:
            raise serializers.ValidationError("Level must be between 1 (highest) and 10 (lowest)")
        return value


class AdminRoleAssignmentSerializer(serializers.ModelSerializer):
    """
    Serializer for AdminUserRole assignments
    """
    role_name = serializers.CharField(source='role.name', read_only=True)
    role_display_name = serializers.CharField(source='role.display_name', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_mobile = serializers.CharField(source='user.mobile', read_only=True)
    assigned_by_name = serializers.CharField(source='assigned_by.email', read_only=True)
    
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
            'user_email', 'user_mobile', 'assigned_by_name'
        ]
    
    def validate_user(self, value):
        """Validate that user is an admin user"""
        if not value.is_staff or not value.is_admin_active:
            raise serializers.ValidationError(
                "Only admin users can be assigned admin roles"
            )
        return value
    
    def validate(self, attrs):
        """Validate the role assignment"""
        user = attrs.get('user')
        role = attrs.get('role')
        
        if user and role:
            # Check if assignment already exists
            existing = AdminUserRole.objects.filter(
                user=user, role=role, is_active=True
            ).exists()
            
            if existing:
                raise serializers.ValidationError(
                    "User already has this role assigned"
                )
        
        return attrs


class AdminRoleListSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for role lists
    """
    users_count = serializers.SerializerMethodField()
    
    class Meta:
        model = AdminRole
        fields = [
            'id', 'public_id', 'name', 'display_name', 'description',
            'level', 'is_system_role', 'is_active', 'users_count'
        ]
    
    def get_users_count(self, obj):
        """Get count of users with this role"""
        return obj.adminuserrole_set.filter(is_active=True).count()


class AdminRolePermissionsSerializer(serializers.ModelSerializer):
    """
    Serializer for role permissions only
    """
    
    class Meta:
        model = AdminRole
        fields = ['permissions']
    
    def validate_permissions(self, value):
        """Use the same validation as AdminRoleSerializer"""
        serializer = AdminRoleSerializer()
        return serializer.validate_permissions(value)


class UserRoleAssignmentSerializer(serializers.Serializer):
    """
    Serializer for assigning roles to users
    """
    user_id = serializers.IntegerField()
    role_ids = serializers.ListField(
        child=serializers.IntegerField(),
        allow_empty=False
    )
    expires_at = serializers.DateTimeField(required=False, allow_null=True)
    
    def validate_user_id(self, value):
        """Validate user exists and is admin"""
        try:
            user = User.objects.get(id=value)
            if not user.is_staff or not user.is_admin_active:
                raise serializers.ValidationError(
                    "Only admin users can be assigned admin roles"
                )
            return value
        except User.DoesNotExist:
            raise serializers.ValidationError("User not found")
    
    def validate_role_ids(self, value):
        """Validate all roles exist and are active"""
        existing_roles = AdminRole.objects.filter(
            id__in=value, is_active=True
        ).values_list('id', flat=True)
        
        missing_roles = set(value) - set(existing_roles)
        if missing_roles:
            raise serializers.ValidationError(
                "Invalid role IDs: {}".format(', '.join(map(str, missing_roles)))
            )
        
        return value
