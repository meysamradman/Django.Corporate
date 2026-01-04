from rest_framework import serializers
from datetime import datetime
from django.contrib.auth.models import Permission
from src.media.models.media import ImageMedia
from src.media.utils.validators import validate_image_file
from src.user.models import AdminProfile, User
from src.core.models import Province, City
from src.user.serializers.location_serializer import ProvinceCompactSerializer, CityCompactSerializer
from src.user.utils.national_id_validator import validate_national_id_format, validate_national_id
from src.user.messages import AUTH_ERRORS
from src.user.utils.mobile_validator import validate_mobile_number
from src.user.utils.phone_validator import validate_phone_number_with_uniqueness
from src.user.access_control import get_role_config, is_super_admin_role, PermissionHelper
from src.real_estate.serializers.admin.agent_serializer import PropertyAgentAdminDetailSerializer


class ProfilePictureSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = ImageMedia
        fields = ['id', 'public_id', 'title', 'file_url', 'alt_text', 'created_at', 'updated_at']

    def get_file_url(self, obj):
        if obj and obj.file:
            return obj.file.url
        return None
    
    def to_representation(self, instance):
        if instance is None:
            return None
        return super().to_representation(instance)


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
                 'profile_picture', 'created_at', 'updated_at']
        read_only_fields = ['public_id']

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
            raise serializers.ValidationError(AUTH_ERRORS.get("auth_validation_error"))
        return value


class AdminProfileUpdateSerializer(serializers.ModelSerializer):
    profile_picture = serializers.PrimaryKeyRelatedField(
        queryset=ImageMedia.objects.filter(is_active=True),
        required=False, 
        allow_null=True,
        help_text="ID of an image stored in the media library."
    )
    profile_picture_file = serializers.ImageField(
        required=False, 
        allow_null=True, 
        write_only=True,
        help_text="Upload an image file directly (alternative to profile_picture ID)."
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
            'national_id': {'required': False, 'validators': []},
            'address': {'required': False},
            'phone': {'required': False, 'validators': []},
            'province': {'required': False},
            'city': {'required': False},
            'bio': {'required': False},
        }
        
    def validate_phone(self, value):
        try:
            admin_user_id = self.context.get('admin_user_id') or (self.instance.admin_user_id if self.instance else None)
            return validate_phone_number_with_uniqueness(value, admin_user_id, 'admin')
        except Exception as e:
            raise serializers.ValidationError(str(e))
    
    def validate_national_id(self, value):
        if value:
            admin_user_id = self.context.get('admin_user_id') or (self.instance.admin_user_id if self.instance else None)
            
            if admin_user_id and AdminProfile.objects.filter(national_id=value).exclude(admin_user_id=admin_user_id).exists():
                raise serializers.ValidationError(AUTH_ERRORS["national_id_exists"])
        return value
    
    def validate_birth_date(self, value):
        if value and value > datetime.now().date():
            raise serializers.ValidationError(AUTH_ERRORS.get("auth_validation_error"))
        return value

    def validate_profile_picture_file(self, value):
        if value is None:
            return value
        
        try:
            validate_image_file(value)
            return value
        except ImportError:
            if not value.name.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp')):
                raise serializers.ValidationError(AUTH_ERRORS["auth_file_must_be_image"])
            return value
        except Exception as e:
            raise serializers.ValidationError(str(e))
    
    def validate(self, data):
        if data.get('profile_picture') and data.get('profile_picture_file'):
            raise serializers.ValidationError({
                'profile_picture_file': AUTH_ERRORS.get("auth_validation_error")
            })
        
        return data
    
    def save(self, **kwargs):
        instance = super().save(**kwargs)
        
        if 'profile_picture_file' in self.validated_data:
            profile_picture_file = self.validated_data['profile_picture_file']
            if profile_picture_file:
                new_image = ImageMedia.objects.create(
                    file=profile_picture_file,
                    title=f"Profile Picture for {instance.admin_user.email or instance.admin_user.mobile}",
                    alt_text=f"Profile picture for {instance.admin_user.email or instance.admin_user.mobile}"
                )
                instance.profile_picture = new_image
                instance.save(update_fields=['profile_picture'])
        
        return instance
    
    def to_internal_value(self, data):
        if isinstance(data, dict) and 'profile_picture' in data and data.get('profile_picture'):
            profile_picture_value = data['profile_picture']
            
            if isinstance(profile_picture_value, str) and profile_picture_value.isdigit():
                data = data.copy()
                data['profile_picture'] = int(profile_picture_value)
            elif isinstance(profile_picture_value, str) and profile_picture_value.lower() in ['null', 'none', '']:
                data = data.copy()
                data['profile_picture'] = None
        
        return super().to_internal_value(data)


class AdminCompleteProfileSerializer(serializers.ModelSerializer):
    profile = serializers.SerializerMethodField()
    permissions = serializers.SerializerMethodField()
    roles = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()
    is_super = serializers.SerializerMethodField()
    has_agent_profile = serializers.SerializerMethodField()
    agent_profile = serializers.SerializerMethodField()
    user_role_type = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'public_id', 'email', 'mobile',
            'is_active', 'is_staff', 'is_superuser',
            'created_at', 'updated_at',
            'profile',
            'permissions',
            'roles',
            'full_name',
            'is_super',
            'has_agent_profile',
            'agent_profile',
            'user_role_type'
        ]
        read_only_fields = fields

    def get_profile(self, user):
        try:
            if hasattr(user, 'admin_profile') and user.admin_profile:
                return AdminProfileSerializer(user.admin_profile, context=self.context).data
        except AttributeError:
            pass
        return {}

    def get_is_super(self, user):
        return user.is_superuser
    
    def get_has_agent_profile(self, user):
        try:
            return hasattr(user, 'real_estate_agent_profile') and user.real_estate_agent_profile is not None
        except Exception:
            return False
            
    def get_agent_profile(self, user):
        try:
            if hasattr(user, 'real_estate_agent_profile') and user.real_estate_agent_profile is not None:
                return PropertyAgentAdminDetailSerializer(user.real_estate_agent_profile, context=self.context).data
        except Exception:
            pass
        return None
        
    def get_user_role_type(self, user):
        if user.is_superuser:
            return 'admin'
        try:
            if hasattr(user, 'real_estate_agent_profile') and user.real_estate_agent_profile is not None:
                return 'consultant'
        except Exception:
            pass
        return 'admin'
    
    def get_roles(self, user):
        if user.is_superuser:
            super_admin_config = get_role_config('super_admin')
            return [{
                'id': 'super_admin',
                'name': 'super_admin',
                'display_name': super_admin_config.display_name if super_admin_config else 'Super Admin',
                'level': 1,
                'is_system_role': True
            }]
        
        roles = []
        try:
            if hasattr(user, 'admin_user_roles'):
                user_role_assignments = user.admin_user_roles.filter(
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
             all_perms = set()
             for app_label, codename in Permission.objects.values_list('content_type__app_label', 'codename'):
                  all_perms.add(f"{app_label}.{codename}")
             return sorted(list(all_perms))
             
        all_user_permissions = direct_perms.union(group_perms)
        return sorted(list(all_user_permissions))
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        
        if instance.user_type == 'admin' or instance.is_staff or instance.is_superuser:
            permission_data = PermissionHelper.get_optimized_permissions(instance)
            data.update(permission_data)
        
        return data