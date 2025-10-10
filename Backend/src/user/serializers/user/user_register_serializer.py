from rest_framework import serializers
from src.user.messages import AUTH_ERRORS
from src.user.utils.validate_identifier import validate_identifier
from ..base_register_serializer import BaseRegisterSerializer


class UserRegisterSerializer(BaseRegisterSerializer):
    """
    Serializer مخصوص ثبت نام یوزرهای عادی در وب‌سایت - بهینه شده
    """
    identifier = serializers.CharField(required=True)

    def validate_identifier(self, value):
        """Validate identifier (email or mobile)"""
        if not value:
            raise serializers.ValidationError(AUTH_ERRORS.get("auth_identifier_cannot_empty", "Identifier cannot be empty"))
        
        try:
            email, mobile = validate_identifier(value)
            if email:
                return email
            elif mobile:
                return mobile
            else:
                raise serializers.ValidationError(AUTH_ERRORS.get("auth_identifier_error", "Invalid identifier format"))
        except Exception as e:
            raise serializers.ValidationError(str(e))
