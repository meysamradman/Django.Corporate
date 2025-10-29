from rest_framework import serializers
from src.user.messages import AUTH_ERRORS
from src.user.utils.validate_identifier import validate_identifier


class UserLoginSerializer(serializers.Serializer):
    """
    سریالایزر برای ورود کاربر معمولی
    """
    identifier = serializers.CharField(required=True)
    password = serializers.CharField(required=False, write_only=True, allow_blank=True)
    otp = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    captcha_id = serializers.CharField(required=True)
    captcha_answer = serializers.CharField(required=True)
    login_type = serializers.ChoiceField(
        choices=[('password', 'رمز عبور'), ('otp', 'کد یکبار مصرف')], 
        default='password'
    )

    def validate_identifier(self, value):
        """اعتبارسنجی شناسه (ایمیل یا موبایل)"""
        if not value:
            raise serializers.ValidationError(AUTH_ERRORS.get("auth_identifier_cannot_empty"))
        
        try:
            email, mobile = validate_identifier(value)
            if email or mobile:
                return value
            else:
                raise serializers.ValidationError(AUTH_ERRORS.get("auth_identifier_error"))
        except Exception as e:
            raise serializers.ValidationError(str(e))

    def validate(self, data):
        """اعتبارسنجی داده‌ها"""
        login_type = data.get('login_type')
        identifier = data.get('identifier')
        captcha_id = data.get('captcha_id')
        captcha_answer = data.get('captcha_answer')
        
        if login_type == 'password':
            password = data.get('password')
            if not password:
                raise serializers.ValidationError({
                    'password': AUTH_ERRORS.get("auth_password_required")
                })
        elif login_type == 'otp':
            otp = data.get('otp')
            if not otp:
                raise serializers.ValidationError({
                    'otp': AUTH_ERRORS.get("auth_otp_required")
                })
        
        if not identifier:
            raise serializers.ValidationError({
                'identifier': AUTH_ERRORS.get("auth_identifier_required")
            })
            
        if not captcha_id:
            raise serializers.ValidationError({
                'captcha_id': AUTH_ERRORS.get("auth_captcha_id_required")
            })
            
        if not captcha_answer:
            raise serializers.ValidationError({
                'captcha_answer': AUTH_ERRORS.get("auth_captcha_answer_required")
            })
        
        return data