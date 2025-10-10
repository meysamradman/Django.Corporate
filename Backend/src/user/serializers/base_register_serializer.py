from rest_framework import serializers
from src.user.utils.password_validator import validate_register_password
from src.user.messages import AUTH_ERRORS


class BaseRegisterSerializer(serializers.Serializer):
    """
    Base serializer ساده برای ثبت نام کاربر - فقط فیلدهای مشترک
    """
    password = serializers.CharField(write_only=True, required=True, min_length=6)
    is_active = serializers.BooleanField(default=True)

    def validate_password(self, value):
        """Validate password strength"""
        try:
            return validate_register_password(value)
        except Exception as e:
            raise serializers.ValidationError(str(e))
