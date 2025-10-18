from rest_framework import serializers
from datetime import datetime
from src.media.models.media import ImageMedia
from src.user.models import UserProfile, AdminProfile, User, Province, City # Import location models
from src.user.utils.permission_helper import PermissionHelper
from .location_serializer import ProvinceCompactSerializer, CityCompactSerializer


class ProfilePictureSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = ImageMedia
        fields = ['id', 'public_id', 'title', 'file_url', 'alt_text', 'created_at', 'updated_at']

    def get_file_url(self, obj):
        # Use relative URL instead of absolute URL to prevent path duplication
        if obj.file:
            return obj.file.url
        return None


# --- UserProfile Serializers (for Regular Users) ---
class UserProfileSerializer(serializers.ModelSerializer):
    profile_picture = ProfilePictureSerializer(read_only=True)
    province = ProvinceCompactSerializer(read_only=True)
    city = CityCompactSerializer(read_only=True)
    created_at = serializers.SerializerMethodField()
    updated_at = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()
    public_id = serializers.UUIDField(read_only=True)

    class Meta:
        model = UserProfile
        fields = ['id', 'public_id', 'first_name', 'last_name', 'full_name', 'national_id', 'birth_date', 'address', 'province', 'city', 'phone', 'bio',
                 'profile_picture', 'created_at', 'updated_at',]
        read_only_fields = ['public_id', 'national_id']

    def get_full_name(self, obj):
        if obj.first_name and obj.last_name:
            return f"{obj.first_name} {obj.last_name}"
        return None

    def get_created_at(self, obj):
        return obj.created_at.strftime("%Y-%m-%d %H:%M:%S")

    def get_updated_at(self, obj):
        return obj.updated_at.strftime("%Y-%m-%d %H:%M:%S")

    def validate_birth_date(self, value):
        if value and value > datetime.now().date():
            raise serializers.ValidationError("Birth date cannot be in the future")
        return value

    def validate_national_id(self, value):
        if value and not value.isdigit():
            raise serializers.ValidationError("National ID must contain only numbers")
        if value and len(value) != 10:
            raise serializers.ValidationError("National ID must be 10 digits")
        return value

class UserProfileUpdateSerializer(serializers.ModelSerializer):
    profile_picture = serializers.PrimaryKeyRelatedField(
        queryset=ImageMedia.objects.filter(is_active=True),
        required=False, 
        allow_null=True,
        help_text="ID of an image from media library"
    )
    
    class Meta:
        model = UserProfile
        fields = ['first_name', 'last_name', 'birth_date', 'address', 'phone', 'province', 'city', 'bio', 'national_id', 'profile_picture']
        extra_kwargs = {
            'first_name': {'required': False},
            'last_name': {'required': False},
            'birth_date': {'required': False},
            'address': {'required': False},
            'phone': {'required': False},
            'province': {'required': False},
            'city': {'required': False},
            'bio': {'required': False},
            'national_id': {'required': False}
        }
        
    def validate_national_id(self, value):
        if value and not value.isdigit():
            raise serializers.ValidationError("National ID must contain only numbers")
        if value and len(value) != 10:
            raise serializers.ValidationError("National ID must be 10 digits")
        return value
        
    def validate_birth_date(self, value):
        if value and value > datetime.now().date():
            raise serializers.ValidationError("Birth date cannot be in the future")
        return value

# --- AdminProfile Serializers (for Admin Users) ---
class AdminProfileSerializer(serializers.ModelSerializer):
    profile_picture = ProfilePictureSerializer(read_only=True)
    province = ProvinceCompactSerializer(read_only=True)
    city = CityCompactSerializer(read_only=True)
    created_at = serializers.SerializerMethodField()
    updated_at = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()
    public_id = serializers.UUIDField(read_only=True)

    class Meta:
        model = AdminProfile
        fields = ['id', 'public_id', 'first_name', 'last_name', 'full_name', 'birth_date',
                 'national_id', 'address', 'phone', 'province', 'city', 'bio',
                 'profile_picture', 'created_at', 'updated_at',]
        read_only_fields = ['public_id',]

    def get_full_name(self, obj):
        if obj.first_name and obj.last_name:
            return f"{obj.first_name} {obj.last_name}"
        return None

    def get_created_at(self, obj):
        return obj.created_at.strftime("%Y-%m-%d %H:%M:%S")

    def get_updated_at(self, obj):
        return obj.updated_at.strftime("%Y-%m-%d %H:%M:%S")

    def validate_birth_date(self, value):
        if value and value > datetime.now().date():
            raise serializers.ValidationError("Birth date cannot be in the future")
        return value

class AdminProfileUpdateSerializer(serializers.ModelSerializer):
    profile_picture = serializers.PrimaryKeyRelatedField(
        queryset=ImageMedia.objects.filter(is_active=True),
        required=False, 
        allow_null=True,
        help_text="ID of an image from media library"
    )
    # Support for direct file upload as alternative
    profile_picture_file = serializers.ImageField(
        required=False, 
        allow_null=True, 
        write_only=True,
        help_text="Direct image file upload (alternative to profile_picture ID)"
    )
    
    class Meta:
        model = AdminProfile
        fields = [
            'first_name', 'last_name', 'birth_date', 'national_id', 'address', 'phone', 'province', 'city', 'profile_picture',
            'bio', 'profile_picture_file'
        ]
        extra_kwargs = {
            'first_name': {'required': False},
            'last_name': {'required': False},
            'birth_date': {'required': False},
            'national_id': {'required': False},
            'address': {'required': False},
            'phone': {'required': False},
            'province': {'required': False},
            'city': {'required': False},
            'bio': {'required': False},
        }
        
    def validate_birth_date(self, value):
        if value and value > datetime.now().date():
            raise serializers.ValidationError("Birth date cannot be in the future")
        return value
    
    def validate_national_id(self, value):
        if value and not value.isdigit():
            raise serializers.ValidationError("National ID must contain only numbers")
        if value and len(value) != 10:
            raise serializers.ValidationError("National ID must be 10 digits")
        return value
    
    def validate_profile_picture_file(self, value):
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
    
    def validate(self, data):
        """Cross-field validation"""
        # Can't have both profile_picture ID and file upload
        if data.get('profile_picture') and data.get('profile_picture_file'):
            raise serializers.ValidationError({
                'profile_picture_file': 'نمی‌توان همزمان ID تصویر و فایل جدید ارسال کرد. یکی را انتخاب کنید.'
            })
        
        return data

# --- New Serializer for Admin Profile View ---
class AdminCompleteProfileSerializer(serializers.ModelSerializer):
    """ Serializer for the AdminProfileView to include user details, profile, and permissions. """
    # Use AdminProfileSerializer for admin user profile
    profile = serializers.SerializerMethodField() # Changed to SerializerMethodField
    permissions = serializers.SerializerMethodField()
    roles = serializers.SerializerMethodField()  # Add roles field for dashboard
    full_name = serializers.SerializerMethodField()  # Add full_name field for dashboard
    is_super = serializers.SerializerMethodField()  # Add is_super field to match frontend

    class Meta:
        model = User # Serializes the User model
        fields = [
            'id', 'public_id', 'email', 'mobile',
            'is_active', 'is_staff', 'is_superuser',
            'created_at', 'updated_at',
            'profile', # Nested profile data
            'permissions', # Added permissions field
            'roles', # Add roles field for dashboard
            'full_name', # Add full_name field for dashboard
            'is_super' # Add is_super field to match frontend
        ]
        read_only_fields = fields # Make all fields read-only for this specific view

    def get_profile(self, user):
        """Returns admin profile data using select_related optimization"""
        # This assumes admin_profile is already prefetched with select_related
        try:
            if user.admin_profile:
                return AdminProfileSerializer(user.admin_profile, context=self.context).data
        except AttributeError:
            # admin_profile doesn't exist - no database query needed
            pass
        return {} # Return empty dict if no profile

    def get_is_super(self, user):
        """Return is_superuser value to match frontend interface"""
        return user.is_superuser
    
    def get_roles(self, user):
        """Get roles for the user - for superuser return super_admin role"""
        # Import centralized role management
        from src.user.authorization.roles_config import get_role_config, is_super_admin_role
        
        if user.is_superuser:
            super_admin_config = get_role_config('super_admin')
            return [{
                'id': 'super_admin',
                'name': 'super_admin',
                'display_name': super_admin_config.display_name if super_admin_config else 'سوپر ادمین',
                'level': 1,
                'is_system_role': True
            }]
        
        # For regular admins, get their assigned roles
        roles = []
        try:
            if hasattr(user, 'adminuserrole_set'):
                user_role_assignments = user.adminuserrole_set.filter(
                    is_active=True
                ).select_related('role')
                
                for user_role in user_role_assignments:
                    role = user_role.role
                    role_config = get_role_config(role.name)
                    roles.append({
                        'id': role.id,
                        'name': role.name,
                        'display_name': role_config.display_name if role_config else role.display_name,
                        'level': role.level,
                        'is_system_role': role.is_system_role
                    })
        except Exception:
            pass
        
        return roles
    
    def get_full_name(self, user):
        """Get full name from profile or fallback to identifier"""
        if user.user_type == 'admin' and hasattr(user, 'admin_profile') and user.admin_profile:
            profile = user.admin_profile
            if profile.first_name and profile.last_name:
                return f"{profile.first_name} {profile.last_name}"
            elif profile.first_name:
                return profile.first_name
            elif profile.last_name:
                return profile.last_name
        
        return user.mobile or user.email or f"User {user.id}"

    def get_permissions(self, user):
        """ Efficiently retrieves all permission codenames for the user. """
        if not user.is_authenticated or not user.is_active:
            return []
        
        direct_perms = set()
        for app_label, codename in user.user_permissions.values_list('content_type__app_label', 'codename'):
             direct_perms.add(f"{app_label}.{codename}")
             
        group_perms = set()
        for group in user.groups.all(): 
            for app_label, codename in group.permissions.values_list('content_type__app_label', 'codename'):
                group_perms.add(f"{app_label}.{codename}")
        
        if user.is_superuser:
             from django.contrib.auth.models import Permission
             all_perms = set()
             for app_label, codename in Permission.objects.values_list('content_type__app_label', 'codename'):
                  all_perms.add(f"{app_label}.{codename}")
             return sorted(list(all_perms))
             
        all_user_permissions = direct_perms.union(group_perms)
        return sorted(list(all_user_permissions))
    
    def to_representation(self, instance):
        """Smart response based on user type - Optimized for performance"""
        data = super().to_representation(instance)
        
        # Use centralized permission helper - eliminates code duplication
        permission_data = PermissionHelper.get_optimized_permissions(instance)
        data.update(permission_data)
        
        return data
