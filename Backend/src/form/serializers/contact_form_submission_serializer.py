from rest_framework import serializers

from src.form.messages.messages import FORM_FIELD_ERRORS


class ContactFormSubmissionCreateSerializer(serializers.Serializer):
    
    form_data = serializers.DictField(
        required=True
    )
    platform = serializers.ChoiceField(
        choices=['website', 'mobile_app'],
        required=True
    )
    
    def validate_form_data(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError(FORM_FIELD_ERRORS['form_data_must_be_dict'])
        
        if not value:
            raise serializers.ValidationError(FORM_FIELD_ERRORS['form_data_empty'])
        
        return value
    
    def validate_platform(self, value):
        valid_platforms = ['website', 'mobile_app']
        if value not in valid_platforms:
            raise serializers.ValidationError(FORM_FIELD_ERRORS['invalid_platform'])
        return value

