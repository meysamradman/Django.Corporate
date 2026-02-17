from rest_framework import serializers
from django.core.exceptions import ValidationError as DjangoValidationError

from src.user.messages import AUTH_ERRORS
from src.user.utils.mobile_validator import validate_mobile_number
from src.user.utils.password_validator import validate_register_password
from src.user.utils.otp_validator import validate_otp
from src.core.utils.validation_helpers import extract_validation_message

class AdminPasswordResetRequestSerializer(serializers.Serializer):
    mobile = serializers.CharField(required=True)
    captcha_id = serializers.CharField(required=False, allow_blank=True)
    captcha_answer = serializers.CharField(required=False, allow_blank=True)

    def validate_mobile(self, value):
        value = value.strip() if isinstance(value, str) else value
        try:
            return validate_mobile_number(value)
        except Exception as e:
            raise serializers.ValidationError(
                extract_validation_message(e, AUTH_ERRORS.get("auth_invalid_mobile"))
            )

class AdminPasswordResetVerifySerializer(serializers.Serializer):
    mobile = serializers.CharField(required=True)
    otp_code = serializers.CharField(required=True)

    def validate_mobile(self, value):
        value = value.strip() if isinstance(value, str) else value
        try:
            return validate_mobile_number(value)
        except Exception as e:
            raise serializers.ValidationError(
                extract_validation_message(e, AUTH_ERRORS.get("auth_invalid_mobile"))
            )

    def validate_otp_code(self, value):
        try:
            validate_otp(value, None, None)
            return value
        except DjangoValidationError as e:
            raise serializers.ValidationError(
                extract_validation_message(e, AUTH_ERRORS.get("otp_invalid"))
            )

class AdminPasswordResetConfirmSerializer(serializers.Serializer):
    mobile = serializers.CharField(required=True)
    reset_token = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, write_only=True)
    confirm_password = serializers.CharField(required=True, write_only=True)

    def validate_mobile(self, value):
        value = value.strip() if isinstance(value, str) else value
        try:
            return validate_mobile_number(value)
        except Exception as e:
            raise serializers.ValidationError(
                extract_validation_message(e, AUTH_ERRORS.get("auth_invalid_mobile"))
            )

    def validate_new_password(self, value):
        try:
            return validate_register_password(value)
        except Exception as e:
            raise serializers.ValidationError(
                extract_validation_message(e, AUTH_ERRORS.get("auth_weak_password"))
            )

    def validate(self, attrs):
        if attrs.get('new_password') != attrs.get('confirm_password'):
            raise serializers.ValidationError({
                'confirm_password': AUTH_ERRORS.get("auth_validation_error")
            })
        return attrs
