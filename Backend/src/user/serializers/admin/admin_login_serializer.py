from rest_framework import serializers
from src.user.messages import AUTH_ERRORS
from src.user.utils.mobile_validator import validate_mobile_number
from src.core.utils.validation_helpers import extract_validation_message

class AdminLoginSerializer(serializers.Serializer):
    mobile = serializers.CharField(required=True)
    password = serializers.CharField(required=False, allow_blank=True, allow_null=True, write_only=True)
    captcha_id = serializers.CharField(required=True)
    captcha_answer = serializers.CharField(required=True)
    otp_code = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def validate_mobile(self, value):
        if not value:
            raise serializers.ValidationError(AUTH_ERRORS.get("auth_invalid_mobile"))
        
        try:
            validated_mobile = validate_mobile_number(value)
            return validated_mobile
        except Exception as e:
            raise serializers.ValidationError(
                extract_validation_message(e, AUTH_ERRORS.get("auth_invalid_mobile"))
            )

    def validate(self, data):
        mobile = data.get('mobile')
        password = data.get('password')
        captcha_id = data.get('captcha_id')
        captcha_answer = data.get('captcha_answer')
        otp_code = data.get('otp_code')
        
        if not mobile:
            raise serializers.ValidationError({
                'mobile': AUTH_ERRORS.get("auth_invalid_mobile")
            })
        
        if not password and not otp_code:
            raise serializers.ValidationError({
                'non_field_errors': AUTH_ERRORS.get("auth_validation_error")
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