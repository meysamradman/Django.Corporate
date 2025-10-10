from rest_framework import serializers
from src.user.utils.mobile_validator import validate_mobile_number
from src.user.messages import AUTH_ERRORS
from ..base_login_serializer import BaseLoginSerializer


class AdminLoginSerializer(BaseLoginSerializer):
    """
    Serializer مخصوص ورود ادمین - فقط موبایل (نه identifier)
    """
    # Fields specific to Admin login
    mobile = serializers.CharField(required=True)
    
    # Configuration برای Admin - override Base settings
    use_identifier = False
    require_captcha = True  # ادمین‌ها حتماً کپتچا دارند
    login_field_name = 'mobile'
    
    # Override captcha fields to be required
    captcha_id = serializers.CharField(required=True)
    captcha_answer = serializers.CharField(required=True)

    def validate_mobile(self, value):
        """Validate mobile number format"""
        if not value:
            raise serializers.ValidationError(AUTH_ERRORS.get("auth_mobile_required", "Mobile number is required"))
        
        try:
            return validate_mobile_number(value)
        except Exception as e:
            raise serializers.ValidationError(str(e))
