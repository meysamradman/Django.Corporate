from rest_framework import serializers


class ContactFormSubmissionCreateSerializer(serializers.Serializer):
    """Serializer برای دریافت داده‌های فرم از frontend"""
    
    form_data = serializers.DictField(
        required=True,
        help_text="داده‌های فرم به صورت JSON"
    )
    platform = serializers.ChoiceField(
        choices=['website', 'mobile_app'],
        required=True,
        help_text="پلتفرم ارسال فرم"
    )
    
    def validate_form_data(self, value):
        """اعتبارسنجی form_data"""
        if not isinstance(value, dict):
            raise serializers.ValidationError("form_data باید یک دیکشنری باشد")
        
        if not value:
            raise serializers.ValidationError("form_data نمی‌تواند خالی باشد")
        
        return value
    
    def validate_platform(self, value):
        """اعتبارسنجی platform"""
        valid_platforms = ['website', 'mobile_app']
        if value not in valid_platforms:
            raise serializers.ValidationError(f"پلتفرم نامعتبر. باید یکی از {valid_platforms} باشد")
        return value

