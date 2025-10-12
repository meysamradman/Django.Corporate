from rest_framework import serializers
from datetime import datetime
from src.user.utils.mobile_validator import validate_mobile_number
from src.user.utils.email_validator import validate_email_address
from src.user.models import User, AdminRole
from src.media.models import ImageMedia
from src.user.messages import AUTH_ERRORS
from ..base_register_serializer import BaseRegisterSerializer


class AdminRegisterSerializer(BaseRegisterSerializer):
    """
    Serializer مخصوص ثبت نام ادمین در پنل ادمین - بهینه شده
    Note: is_staff=True is automatically set for all admins
    is_superuser can be set only by existing superusers
    """
    mobile = serializers.CharField(required=True)
    email = serializers.EmailField(required=False, allow_blank=True, allow_null=True)
    
    # ✅ Allow is_superuser selection for admin creation (with validation)
    is_superuser = serializers.BooleanField(default=False, required=False)
    
    # ✅ Add user_type field to distinguish between admin and regular user creation
    user_type = serializers.ChoiceField(
        choices=[('admin', 'Admin'), ('user', 'Regular User')], 
        default='admin', 
        required=False
    )
    
    # Profile fields - nested structure
    profile = serializers.DictField(required=False, allow_empty=True)
    
    # Flattened profile fields for backward compatibility
    first_name = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=50)
    last_name = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=50)
    birth_date = serializers.DateField(required=False, allow_null=True)
    national_id = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=20)
    address = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    department = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=100)
    position = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=100)
    bio = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    notes = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    
    # Media field for profile picture - support both ID and file upload
    profile_picture_id = serializers.IntegerField(required=False, allow_null=True)
    profile_picture = serializers.ImageField(required=False, allow_null=True, write_only=True)
    
    # Role field
    role_id = serializers.IntegerField(required=False, allow_null=True)

    def validate_mobile(self, value):
        """Validate mobile number format and uniqueness"""
        if not value:
            raise serializers.ValidationError(AUTH_ERRORS.get("auth_mobile_required", "Mobile number is required"))
        
        try:
            validated_mobile = validate_mobile_number(value)
            
            # Check uniqueness
            if User.objects.filter(mobile=validated_mobile).exists():
                raise serializers.ValidationError(AUTH_ERRORS.get("auth_mobile_exists", "This mobile number already exists"))
            
            return validated_mobile
        except Exception as e:
            raise serializers.ValidationError(str(e))
    
    def validate_email(self, value):
        """Validate email format and uniqueness"""
        if value == "":
            return None
        if value:
            try:
                validated_email = validate_email_address(value)
                
                # Check uniqueness
                if User.objects.filter(email=validated_email).exists():
                    raise serializers.ValidationError(AUTH_ERRORS.get("auth_email_exists", "This email already exists"))
                
                return validated_email
            except Exception as e:
                raise serializers.ValidationError(str(e))
        return value
    
    def validate_birth_date(self, value):
        """Validate birth date"""
        if value and value > datetime.now().date():
            raise serializers.ValidationError("Birth date cannot be in the future")
        return value
    
    def validate_national_id(self, value):
        """Validate national ID"""
        if value and not value.isdigit():
            raise serializers.ValidationError("National ID must contain only numbers")
        if value and len(value) != 10:
            raise serializers.ValidationError("National ID must be 10 digits")
        return value
    
    def validate_profile_picture_id(self, value):
        """Validate profile picture exists and is an image"""
        if value is None:
            return value
        
        try:
            media = ImageMedia.objects.get(id=value, is_active=True)
            return value
        except ImageMedia.DoesNotExist:
            raise serializers.ValidationError("Invalid media ID or media is not an active image")
    
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
    
    def validate_role_id(self, value):
        """Validate role exists"""
        if value is None:
            return value
        
        try:
            AdminRole.objects.get(id=value, is_active=True)
            return value
        except AdminRole.DoesNotExist:
            raise serializers.ValidationError("Invalid role ID or role is not active")
    
    def validate(self, data):
        """Cross-field validation with proper superuser permissions check"""
        admin_user = self.context.get('admin_user')
        
        # ✅ Check if current admin can create superuser
        if data.get('is_superuser') is True and not admin_user.is_superuser:
            raise serializers.ValidationError({
                'is_superuser': AUTH_ERRORS.get("auth_only_superuser_create", "Only superuser can create superuser")
            })
        
        # Ensure at least mobile or email is provided
        if not data.get('mobile') and not data.get('email'):
            raise serializers.ValidationError({
                'non_field_errors': AUTH_ERRORS.get("auth_email_or_mobile_required", "Either email or mobile is required")
            })
        
        # Handle nested profile data
        profile_data = data.get('profile', {})
        if profile_data:
            # Extract profile fields from nested structure
            for field in ['first_name', 'last_name', 'birth_date', 'department', 'position', 'bio', 'notes']:
                if field in profile_data and field not in data:
                    data[field] = profile_data[field]
            
            # Handle profile_picture from nested structure (ID)
            if 'profile_picture' in profile_data and 'profile_picture_id' not in data:
                data['profile_picture_id'] = profile_data['profile_picture']
        
        # Validate profile picture consistency (can't have both ID and file)
        if data.get('profile_picture_id') and data.get('profile_picture'):
            raise serializers.ValidationError({
                'profile_picture': 'نمی‌توان همزمان ID تصویر و فایل جدید ارسال کرد. یکی را انتخاب کنید.'
            })
        
        return data


class UserRegisterByAdminSerializer(BaseRegisterSerializer):
    """
    Serializer مخصوص ثبت نام یوزر عادی توسط ادمین در پنل ادمین - بهینه شده
    """
    identifier = serializers.CharField(required=True)

    def validate_identifier(self, value):
        """Validate identifier (email or mobile)"""
        if not value:
            raise serializers.ValidationError(AUTH_ERRORS.get("auth_identifier_cannot_empty", "Identifier cannot be empty"))
        
        try:
            from src.user.utils.validate_identifier import validate_identifier
            email, mobile = validate_identifier(value)
            if email:
                return email
            elif mobile:
                return mobile
            else:
                raise serializers.ValidationError(AUTH_ERRORS.get("auth_identifier_error", "Invalid identifier format"))
        except Exception as e:
            raise serializers.ValidationError(str(e))

    def validate(self, data):
        """Admin context validation"""
        admin_user = self.context.get('admin_user')
        if not admin_user or not admin_user.has_admin_access():
            raise serializers.ValidationError({
                'non_field_errors': AUTH_ERRORS.get("auth_not_authorized", "Not authorized to create users")
            })
        
        return super().validate(data)