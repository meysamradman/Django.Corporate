from rest_framework import serializers
from src.user.messages import AUTH_ERRORS
from src.user.utils.mobile_validator import validate_mobile_number
from src.user.utils.otp_validator import validate_otp
from src.core.utils.validation_helpers import extract_validation_message

class SendOTPSerializer(serializers.Serializer):
    identifier = serializers.CharField(required=True)

    def validate_identifier(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(AUTH_ERRORS["auth_identifier_empty"])

        if "@" in value:
            raise serializers.ValidationError(AUTH_ERRORS["auth_invalid_mobile"])

        return validate_mobile_number(value)

class VerifyOTPSerializer(serializers.Serializer):
    identifier = serializers.CharField(required=True)
    otp = serializers.CharField(required=True)

    def validate_identifier(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(AUTH_ERRORS["auth_identifier_empty"])

        if "@" in value:
            raise serializers.ValidationError(AUTH_ERRORS["auth_invalid_mobile"])

        return validate_mobile_number(value)

    def validate_otp(self, value):
        try:
            validate_otp(value, None, None)
            return value
        except serializers.ValidationError as e:
            raise serializers.ValidationError(
                extract_validation_message(e, AUTH_ERRORS.get("auth_validation_error"))
            )