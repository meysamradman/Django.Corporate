from rest_framework import serializers
from django.core.exceptions import ValidationError as DjangoValidationError
from src.user.utils.mobile_validator import validate_mobile_number
from src.user.utils.email_validator import validate_email_address
from src.user.utils.validate_identifier import validate_identifier
from src.user.utils.password_validator import validate_register_password
from src.media.models import ImageMedia
from src.media.utils.validators import validate_image_file
from src.user.messages import AUTH_ERRORS
from src.user.utils.national_id_validator import validate_national_id_format


class UserRegisterSerializer(serializers.Serializer):
    identifier = serializers.CharField(required=True)
    password = serializers.CharField(write_only=True, required=True, min_length=6)
    
    first_name = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=50)
    last_name = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=50)
    birth_date = serializers.DateField(required=False, allow_null=True)
    national_id = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=20)
    address = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    bio = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    
    profile_picture_id = serializers.IntegerField(required=False, allow_null=True)
    profile_picture = serializers.ImageField(required=False, allow_null=True, write_only=True)

    def validate_identifier(self, value):
        if not value:
            raise serializers.ValidationError(AUTH_ERRORS["auth_identifier_cannot_empty"])
        
        try:
            email, mobile = validate_identifier(value)
            if email:
                return email
            elif mobile:
                return mobile
            else:
                raise serializers.ValidationError(AUTH_ERRORS["auth_identifier_error"])
        except Exception as e:
            raise serializers.ValidationError(AUTH_ERRORS["auth_validation_error"])

    def validate_password(self, value):
        try:
            return validate_register_password(value)
        except Exception as e:
            raise serializers.ValidationError(str(e))

    def validate_profile_picture_id(self, value):
        if value is None:
            return value
        
        try:
            media = ImageMedia.objects.get(id=value, media_type='image')
            return value
        except ImageMedia.DoesNotExist:
            raise serializers.ValidationError(AUTH_ERRORS["auth_validation_error"])
        except Exception as e:
            raise serializers.ValidationError(AUTH_ERRORS["auth_validation_error"])

    def validate_profile_picture(self, value):
        if value is None:
            return value
        
        try:
            validate_image_file(value)
            return value
        except DjangoValidationError as e:
            raise serializers.ValidationError(str(e))
        except Exception as e:
            raise serializers.ValidationError(AUTH_ERRORS["auth_validation_error"])

    def validate_national_id(self, value):
        return validate_national_id_format(value)

    def validate(self, data):
        if data.get('profile_picture_id') and data.get('profile_picture'):
            raise serializers.ValidationError({
                'profile_picture': AUTH_ERRORS["auth_validation_error"]
            })
        
        return data