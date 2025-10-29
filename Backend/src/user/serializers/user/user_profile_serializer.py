from rest_framework import serializers
from datetime import datetime
from src.media.models.media import ImageMedia
from src.user.models import UserProfile, Province, City
from src.user.serializers.location_serializer import ProvinceCompactSerializer, CityCompactSerializer
from src.user.utils.national_id_validator import validate_national_id_format, validate_national_id
from src.user.messages import AUTH_ERRORS
from src.user.utils.mobile_validator import validate_mobile_number
from src.user.utils.phone_validator import validate_phone_number_with_uniqueness


class ProfilePictureSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = ImageMedia
        fields = ['id', 'public_id', 'title', 'file_url', 'alt_text', 'created_at', 'updated_at']

    def get_file_url(self, obj):
        if obj and obj.file:
            return obj.file.url
        return None


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
        fields = ['id', 'public_id', 'first_name', 'last_name', 'full_name', 'birth_date', 'national_id', 'address', 'province', 'city', 'phone', 'bio',
                 'profile_picture', 'created_at', 'updated_at']
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
            raise serializers.ValidationError(AUTH_ERRORS.get("auth_validation_error"))
        return value

    def validate_phone(self, value):
        """Validate phone number format and uniqueness using centralized validator"""
        try:
            user_id = self.context.get('user_id')
            return validate_phone_number_with_uniqueness(value, user_id, 'user')
        except Exception as e:
            raise serializers.ValidationError(str(e))

    def validate_national_id(self, value):
        return validate_national_id_format(value)


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    profile_picture = serializers.PrimaryKeyRelatedField(
        queryset=ImageMedia.objects.filter(is_active=True),
        required=False, 
        allow_null=True,
        help_text="ID یک تصویر از کتابخانه مدیا"
    )
    profile_picture_file = serializers.ImageField(
        required=False, 
        allow_null=True, 
        write_only=True,
        help_text="آپلود مستقیم فایل تصویر (جایگزین profile_picture ID)"
    )
    
    class Meta:
        model = UserProfile
        fields = [
            'first_name', 'last_name', 'birth_date', 'national_id', 'address', 'phone', 'province', 'city', 'profile_picture',
            'bio', 'profile_picture_file'
        ]
        extra_kwargs = {
            'first_name': {'required': False},
            'last_name': {'required': False},
            'birth_date': {'required': False},
            'national_id': {'required': False, 'validators': []},  # Disable built-in validators
            'address': {'required': False},
            'phone': {'required': False, 'validators': []},  # Disable built-in validators
            'province': {'required': False},
            'city': {'required': False},
            'bio': {'required': False},
        }
    
    def validate_phone(self, value):
        """Validate phone number format and uniqueness using centralized validator"""
        try:
            # Get user_id from context or from instance
            user_id = self.context.get('user_id') or (self.instance.user_id if self.instance else None)
            print(f"🔍 UserProfileUpdateSerializer phone validation - user_id: {user_id}, value: {value}")
            return validate_phone_number_with_uniqueness(value, user_id, 'user')
        except Exception as e:
            print(f"❌ UserProfileUpdateSerializer phone validation error: {str(e)}")
            raise serializers.ValidationError(str(e))
    
    def validate_national_id(self, value):
        """Validate national_id uniqueness"""
        if value:
            user_id = self.context.get('user_id') or (self.instance.user_id if self.instance else None)
            print(f"🔍 UserProfileUpdateSerializer national_id validation - user_id: {user_id}, value: {value}")
            
            if user_id and UserProfile.objects.filter(national_id=value).exclude(user_id=user_id).exists():
                print(f"❌ National ID already exists: {value}")
                raise serializers.ValidationError("این کد ملی قبلاً استفاده شده است")
            
            print(f"✅ National ID uniqueness check passed: {value}")
        return value
        
    def validate_birth_date(self, value):
        if value and value > datetime.now().date():
            raise serializers.ValidationError(AUTH_ERRORS.get("auth_validation_error"))
        return value
    
    def validate_profile_picture_file(self, value):
        """اعتبارسنجی فایل تصویر پروفایل آپلود شده با استفاده از سرویس مدیا"""
        if value is None:
            return value
        
        from src.media.utils.validators import validate_image_file
        
        try:
            validate_image_file(value)
            return value
        except Exception as e:
            raise serializers.ValidationError(str(e))
    
    def validate(self, data):
        """اعتبارسنجی بین فیلدی"""
        if data.get('profile_picture') and data.get('profile_picture_file'):
            raise serializers.ValidationError({
                'profile_picture_file': AUTH_ERRORS.get("auth_validation_error")
            })
        
        return data