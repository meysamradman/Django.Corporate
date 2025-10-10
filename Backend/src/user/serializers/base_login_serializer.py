from rest_framework import serializers
from src.user.utils.otp_validator import validate_otp
from src.user.utils.validate_identifier import validate_identifier
from src.user.utils.mobile_validator import validate_mobile_number
from src.user.utils.password_validator import validate_login_password
from src.user.messages import AUTH_ERRORS


class BaseLoginSerializer(serializers.Serializer):
    """
    Base serializer برای ورود - انعطاف‌پذیر برای Admin و User
    """
    # Fields - این فیلدها در کلاس‌های فرزند override می‌شوند
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    otp = serializers.CharField(required=False, allow_blank=True)
    login_type = serializers.ChoiceField(choices=['password', 'otp'], default='password')
    captcha_id = serializers.CharField(required=False, allow_blank=True)
    captcha_answer = serializers.CharField(required=False, allow_blank=True)
    
    # Configuration - در کلاس‌های فرزند تنظیم می‌شود
    use_identifier = True  # برای User = True, برای Admin = False
    require_captcha = False  # برای Admin = True, برای User = False
    login_field_name = 'identifier'  # برای Admin = 'mobile'

    def validate_password(self, value):
        """Validate password for password login"""
        if self.initial_data.get('login_type') == 'password':
            if not value and self.require_password_for_password_login():
                raise serializers.ValidationError(AUTH_ERRORS.get("auth_password_required", "Password is required"))
            try:
                return validate_login_password(value) if value else value
            except Exception as e:
                raise serializers.ValidationError(str(e))
        return value

    def validate_otp(self, value):
        """Validate OTP for OTP login"""
        if self.initial_data.get('login_type') == 'otp':
            if not value and self.require_otp_for_otp_login():
                raise serializers.ValidationError(AUTH_ERRORS.get("auth_otp_required", "OTP is required"))
            try:
                validate_otp(value, None, None) if value else None
                return value
            except Exception as e:
                raise serializers.ValidationError(str(e))
        return value

    def validate_captcha_id(self, value):
        """Validate CAPTCHA ID format"""
        if self.require_captcha:
            if not value:
                raise serializers.ValidationError("CAPTCHA ID is required")
            if len(value) < 10:
                raise serializers.ValidationError("Invalid CAPTCHA ID format")
        elif value and len(value) < 10:
            raise serializers.ValidationError("Invalid CAPTCHA ID format")
        return value

    def validate_captcha_answer(self, value):
        """Validate CAPTCHA answer format"""
        if self.require_captcha:
            if not value:
                raise serializers.ValidationError("CAPTCHA answer is required")
            
            value = value.strip()
            if not value:
                raise serializers.ValidationError("CAPTCHA answer cannot be empty")
            
            # Ensure it's numeric (for digit CAPTCHA)
            if not value.isdigit():
                raise serializers.ValidationError("CAPTCHA answer must be numeric")
                
            return value
        elif value:
            value = value.strip()
            if value and not value.isdigit():
                raise serializers.ValidationError("CAPTCHA answer must be numeric")
            return value
        return value

    def validate(self, data):
        """Cross-field validation"""
        login_type = data.get('login_type', 'password')
        
        if login_type == 'password':
            if not data.get('password') and self.require_password_for_password_login():
                raise serializers.ValidationError({
                    'password': AUTH_ERRORS.get("auth_password_required", "Password is required")
                })
        elif login_type == 'otp':
            if not data.get('otp') and self.require_otp_for_otp_login():
                raise serializers.ValidationError({
                    'otp': AUTH_ERRORS.get("auth_otp_required", "OTP is required")
                })
        
        return data
    
    # Helper methods - در کلاس‌های فرزند override می‌شوند
    def require_password_for_password_login(self):
        """آیا پسورد برای ورود با پسورد اجباری است؟"""
        return True
    
    def require_otp_for_otp_login(self):
        """آیا OTP برای ورود با OTP اجباری است؟"""
        return True
