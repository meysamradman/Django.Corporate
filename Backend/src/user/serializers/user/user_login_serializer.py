from rest_framework import serializers
from src.user.utils.validate_identifier import validate_identifier
from src.user.messages import AUTH_ERRORS
from ..base_login_serializer import BaseLoginSerializer


class UserLoginSerializer(BaseLoginSerializer):
    """
    Serializer مخصوص ورود یوزرهای عادی - با identifier (ایمیل یا موبایل)
    """
    # Fields specific to User login
    identifier = serializers.CharField(required=True)
    
    # Configuration برای User
    use_identifier = True
    require_captcha = False  # یوزرهای عادی کپتچا نداری
    login_field_name = 'identifier'
    
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
