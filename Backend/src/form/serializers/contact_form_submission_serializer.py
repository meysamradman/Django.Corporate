from rest_framework import serializers


class ContactFormSubmissionCreateSerializer(serializers.Serializer):
    
    form_data = serializers.DictField(
        required=True
    )
    platform = serializers.ChoiceField(
        choices=['website', 'mobile_app'],
        required=True
    )
    
    def validate_form_data(self, value):
        from src.form.messages.messages import FORM_FIELD_ERRORS
        if not isinstance(value, dict):
            raise serializers.ValidationError(FORM_FIELD_ERRORS.get('form_data_must_be_dict', 'Form data must be a dictionary'))
        
        if not value:
            raise serializers.ValidationError(FORM_FIELD_ERRORS.get('form_data_empty', 'Form data cannot be empty'))
        
        return value
    
    def validate_platform(self, value):
        from src.form.messages.messages import FORM_FIELD_ERRORS
        valid_platforms = ['website', 'mobile_app']
        if value not in valid_platforms:
            raise serializers.ValidationError(FORM_FIELD_ERRORS.get('invalid_platform', f'Invalid platform. Must be one of {valid_platforms}'))
        return value

