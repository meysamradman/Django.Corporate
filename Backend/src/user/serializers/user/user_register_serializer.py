from rest_framework import serializers
from src.user.utils.mobile_validator import validate_mobile_number
from src.user.utils.email_validator import validate_email_address
from src.user.messages import AUTH_ERRORS
from src.user.utils.national_id_validator import validate_national_id_format


class UserRegisterSerializer(serializers.Serializer):
    """
    سریالایزر مخصوص ثبت‌نام کاربر معمولی
    """
    identifier = serializers.CharField(required=True)
    password = serializers.CharField(write_only=True, required=True, min_length=6)
    
    # فیلدهای پروفایل
    first_name = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=50)
    last_name = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=50)
    birth_date = serializers.DateField(required=False, allow_null=True)
    national_id = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=20)
    address = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    bio = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    
    # تصویر پروفایل
    profile_picture_id = serializers.IntegerField(required=False, allow_null=True)
    profile_picture = serializers.ImageField(required=False, allow_null=True, write_only=True)

    def validate_identifier(self, value):
        """اعتبارسنجی شناسه (ایمیل یا موبایل)"""
        if not value:
            raise serializers.ValidationError(AUTH_ERRORS.get("auth_identifier_cannot_empty"))
        
        try:
            from src.user.utils.validate_identifier import validate_identifier
            email, mobile = validate_identifier(value)
            if email:
                return email
            elif mobile:
                return mobile
            else:
                raise serializers.ValidationError(AUTH_ERRORS.get("auth_identifier_error"))
        except Exception as e:
            raise serializers.ValidationError(AUTH_ERRORS.get("auth_validation_error"))

    def validate_password(self, value):
        """اعتبارسنجی قدرت رمز عبور"""
        try:
            from src.user.utils.password_validator import validate_register_password
            return validate_register_password(value)
        except Exception as e:
            raise serializers.ValidationError(str(e))

    def validate_profile_picture_id(self, value):
        """اعتبارسنجی ID تصویر پروفایل"""
        if value is None:
            return value
        
        try:
            from src.media.models import Media
            media = Media.objects.get(id=value, media_type='image')
            return value
        except Media.DoesNotExist:
            raise serializers.ValidationError(AUTH_ERRORS.get("auth_validation_error"))
        except Exception as e:
            raise serializers.ValidationError(AUTH_ERRORS.get("auth_validation_error"))

    def validate_profile_picture(self, value):
        """اعتبارسنجی فایل تصویر پروفایل آپلود شده"""
        if value is None:
            return value
        
        try:
            from src.media.services.media_service import MediaService
            if value.size > 5 * 1024 * 1024:
                raise serializers.ValidationError(AUTH_ERRORS.get("auth_file_size_exceed"))
            
            allowed_types = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
            if value.content_type not in allowed_types:
                raise serializers.ValidationError(AUTH_ERRORS.get("auth_file_must_be_image"))
            
            return value
        except Exception as e:
            raise serializers.ValidationError(AUTH_ERRORS.get("auth_validation_error"))

    def validate_national_id(self, value):
        """اعتبارسنجی کد ملی"""
        return validate_national_id_format(value)

    def validate(self, data):
        """اعتبارسنجی بین فیلدی"""
        if data.get('profile_picture_id') and data.get('profile_picture'):
            raise serializers.ValidationError({
                'profile_picture': AUTH_ERRORS.get("auth_validation_error")
            })
        
        return data