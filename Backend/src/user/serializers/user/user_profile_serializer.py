from rest_framework import serializers
from datetime import datetime
from src.media.models.media import ImageMedia
from src.media.utils.validators import validate_image_file
from src.user.models import UserProfile
from src.core.models import Province, City
from src.user.serializers.location_serializer import ProvinceCompactSerializer, CityCompactSerializer
from src.user.utils.national_id_validator import validate_national_id_format, validate_national_id
from src.user.messages import AUTH_ERRORS
from src.user.utils.mobile_validator import validate_mobile_number
from src.user.utils.phone_validator import validate_phone_number_with_uniqueness
from src.core.utils.validation_helpers import extract_validation_message
from src.user.models import UserProfileSocialMedia

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
    class SocialMediaSerializer(serializers.ModelSerializer):
        icon_url = serializers.SerializerMethodField()

        class Meta:
            model = UserProfileSocialMedia
            fields = ['id', 'public_id', 'name', 'url', 'icon', 'icon_url', 'order']

        def get_icon_url(self, obj):
            if obj.icon and obj.icon.file:
                return obj.icon.file.url
            return None

    profile_picture = ProfilePictureSerializer(read_only=True)
    province = ProvinceCompactSerializer(read_only=True)
    city = CityCompactSerializer(read_only=True)
    created_at = serializers.SerializerMethodField()
    updated_at = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()
    public_id = serializers.UUIDField(read_only=True)
    social_media = SocialMediaSerializer(many=True, read_only=True)

    class Meta:
        model = UserProfile
        fields = ['id', 'public_id', 'first_name', 'last_name', 'full_name', 'birth_date', 'national_id', 'address', 'province', 'city', 'phone', 'bio',
                 'profile_picture', 'social_media', 'created_at', 'updated_at']
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
        try:
            user_id = self.context.get('user_id')
            return validate_phone_number_with_uniqueness(value, user_id, 'user')
        except Exception as e:
            raise serializers.ValidationError(
                extract_validation_message(e, AUTH_ERRORS.get("auth_validation_error"))
            )

    def validate_national_id(self, value):
        return validate_national_id_format(value)

class UserProfileUpdateSerializer(serializers.ModelSerializer):
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
        model = UserProfile
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
            user_id = self.context.get('user_id') or (self.instance.user_id if self.instance else None)
            return validate_phone_number_with_uniqueness(value, user_id, 'user')
        except Exception as e:
            raise serializers.ValidationError(
                extract_validation_message(e, AUTH_ERRORS.get("auth_validation_error"))
            )
    
    def validate_national_id(self, value):
        if value:
            user_id = self.context.get('user_id') or (self.instance.user_id if self.instance else None)
            
            if user_id and UserProfile.objects.filter(national_id=value).exclude(user_id=user_id).exists():
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
        except Exception as e:
            raise serializers.ValidationError(
                extract_validation_message(e, AUTH_ERRORS.get("auth_validation_error"))
            )
    
    def validate(self, data):
        if data.get('profile_picture') and data.get('profile_picture_file'):
            raise serializers.ValidationError({
                'profile_picture_file': AUTH_ERRORS.get("auth_validation_error")
            })
        
        return data