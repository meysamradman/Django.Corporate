from rest_framework import serializers
from src.user.messages import AUTH_ERRORS
from src.user.utils.mobile_validator import validate_mobile_number


class AdminLoginSerializer(serializers.Serializer):
    mobile = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)
    captcha_id = serializers.CharField(required=True)
    captcha_answer = serializers.CharField(required=True)
    otp_code = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def validate_mobile(self, value):
        if not value:
            raise serializers.ValidationError(AUTH_ERRORS.get("auth_mobile_required"))
        
        try:
            validated_mobile = validate_mobile_number(value)
            return validated_mobile
        except Exception as e:
            raise serializers.ValidationError(str(e))

    def validate(self, data):
        mobile = data.get('mobile')
        password = data.get('password')
        captcha_id = data.get('captcha_id')
        captcha_answer = data.get('captcha_answer')
        
        if not mobile:
            raise serializers.ValidationError({
                'mobile': AUTH_ERRORS.get("auth_mobile_required")
            })
        
        if not password:
            raise serializers.ValidationError({
                'password': AUTH_ERRORS.get("auth_password_required")
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