from rest_framework import serializers
from src.user.models import AdminRole, AdminUserRole, User
from django.core.exceptions import ValidationError
from src.user.messages import AUTH_ERRORS, ROLE_ERRORS
from src.user.permissions.config import AVAILABLE_MODULES, AVAILABLE_ACTIONS


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
        
        role = super().create(validated_data)
        return role
    
    def validate_name(self, value):
        """Validate role name - support Persian/Arabic text"""
        if not value or not value.strip():
            raise serializers.ValidationError(AUTH_ERRORS.get("auth_validation_error"))
        
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
        # ✅ FIX: Handle None or empty values
        if value is None:
            return {}
        
        if not isinstance(value, dict):
            raise serializers.ValidationError("Permissions must be a valid JSON object")
        
        # ✅ FIX: If empty dict, return it (no permissions - valid for custom roles)
        if not value:
            return {}
        
        # ✅ NEW: Support 'specific_permissions' format to avoid cartesian product
        # Format: {'specific_permissions': [{'module': 'admin', 'action': 'view'}, ...]}
        if 'specific_permissions' in value:
            specific_perms = value['specific_permissions']
            
            if not isinstance(specific_perms, list):
                raise serializers.ValidationError("specific_permissions must be a list")
            
            # Validate each permission
            allowed_modules = {'all', *AVAILABLE_MODULES.keys()}
            allowed_actions = {'create', 'read', 'update', 'delete', 'export', 'manage', 'all', 'import'}
            
            for perm in specific_perms:
                if not isinstance(perm, dict):
                    raise serializers.ValidationError("Each permission must be a dict with 'module' and 'action'")
                
                # ✅ FIX: Support permission_key for statistics permissions (all have module='statistics', action='read')
                # If permission_key is provided, use it directly (for statistics.users.read, statistics.admins.read, etc.)
                if 'permission_key' in perm and perm['permission_key']:
                    from src.user.permissions.registry import PermissionRegistry
                    if not PermissionRegistry.exists(perm['permission_key']):
                        raise serializers.ValidationError(f"Invalid permission_key: {perm['permission_key']}")
                    # Skip module/action validation if permission_key is valid
                    continue
                
                if 'module' not in perm or 'action' not in perm:
                    raise serializers.ValidationError("Each permission must have 'module' and 'action' fields")
                
                if perm['module'] not in allowed_modules:
                    raise serializers.ValidationError(f"Invalid module: {perm['module']}")
                
                if perm['action'] not in allowed_actions:
                    raise serializers.ValidationError(f"Invalid action: {perm['action']}")
            
            return value
        
        # Old validation for backward compatibility
        # Validate required keys (at least one should be present if not empty)
        allowed_keys = {'modules', 'actions', 'restrictions', 'special'}
        if not any(key in value for key in allowed_keys):
            # ✅ FIX: If no valid keys, return empty dict instead of error
            return {}
        
        # Validate modules
        if 'modules' in value:
            modules = value['modules']
            if not isinstance(modules, list):
                raise serializers.ValidationError("modules must be a list")
            
            allowed_modules = {'all', *AVAILABLE_MODULES.keys()}
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
    # Include role details with permissions
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
        """Validate that user is an admin user"""
        if not value.is_staff or not value.is_admin_active:
            raise serializers.ValidationError(
                ROLE_ERRORS.get("role_only_admin_can_be_assigned")
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
                    ROLE_ERRORS.get("role_already_assigned")
                )
        
        return attrs


class AdminRoleListSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for role lists
    ✅ OPTIMIZED: Uses annotated users_count from queryset (no N+1 query problem)
    """
    users_count = serializers.IntegerField(read_only=True)  # ✅ Read from annotation
    
    class Meta:
        model = AdminRole
        fields = [
            'id', 'public_id', 'name', 'display_name', 'description',
            'level', 'is_system_role', 'is_active', 'users_count',
            'created_at', 'updated_at'  # Include timestamp fields for auditing
        ]
        read_only_fields = ['id', 'public_id', 'created_at', 'updated_at']


class AdminRolePermissionsSerializer(serializers.ModelSerializer):
    """
    Serializer for role permissions only
    """
    
    class Meta:
        model = AdminRole
        fields = ['permissions']
    
    def validate_permissions(self, value):
        """Use the same validation as AdminRoleSerializer"""
        # ✅ FIX: Use the same validation logic
        if value is None:
            return {}
        
        if not isinstance(value, dict):
            raise serializers.ValidationError("Permissions must be a valid JSON object")
        
        if not value:
            return {}
        
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
                    ROLE_ERRORS.get("role_only_admin_can_be_assigned")
                )
            return value
        except User.DoesNotExist:
            raise serializers.ValidationError(ROLE_ERRORS.get("user_not_found"))
    
    def validate_role_ids(self, value):
        """Validate all roles exist and are active"""
        existing_roles = AdminRole.objects.filter(
            id__in=value, is_active=True
        ).values_list('id', flat=True)
        
        missing_roles = set(value) - set(existing_roles)
        if missing_roles:
            raise serializers.ValidationError(
                ROLE_ERRORS.get("role_invalid_ids")
            )
        
        return value
