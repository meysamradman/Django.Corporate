import re

from rest_framework import serializers

from src.form.models import ContactFormField


class ContactFormFieldSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = ContactFormField
        fields = [
            'id',
            'public_id',
            'field_key',
            'field_type',
            'label',
            'placeholder',
            'required',
            'platforms',
            'options',
            'validation_rules',
            'order',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'public_id',
            'created_at',
            'updated_at',
        ]
    
    def validate_field_key(self, value):
        from src.form.messages.messages import FORM_FIELD_ERRORS
        if value and len(value.strip()) < 2:
            raise serializers.ValidationError(FORM_FIELD_ERRORS.get('field_key_min_length', 'Field key must be at least 2 characters'))
        
        if not re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', value):
            raise serializers.ValidationError(FORM_FIELD_ERRORS.get('field_key_invalid_format', 'Field key must start with a letter or underscore and contain only letters, numbers and underscores'))
        
        return value.strip()
    
    def validate_platforms(self, value):
        from src.form.messages.messages import FORM_FIELD_ERRORS
        if not isinstance(value, list):
            raise serializers.ValidationError(FORM_FIELD_ERRORS.get('platforms_must_be_list', 'Platforms must be a list'))
        
        valid_platforms = ['website', 'mobile_app']
        for platform in value:
            if platform not in valid_platforms:
                raise serializers.ValidationError(FORM_FIELD_ERRORS.get('invalid_platform', f'Invalid platform: {platform}'))
        
        if not value:
            raise serializers.ValidationError(FORM_FIELD_ERRORS.get('at_least_one_platform', 'At least one platform must be selected'))
        
        return value
    
    def validate_options(self, value):
        from src.form.messages.messages import FORM_FIELD_ERRORS
        if not value:
            return value
        
        if not isinstance(value, list):
            raise serializers.ValidationError(FORM_FIELD_ERRORS.get('options_must_be_list', 'Options must be a list'))
        
        field_type = self.initial_data.get('field_type') or (self.instance.field_type if self.instance else None)
        if field_type in ['select', 'radio']:
            if not value:
                raise serializers.ValidationError(FORM_FIELD_ERRORS.get('options_required', f'{field_type} fields must have at least one option'))
            
            for option in value:
                if not isinstance(option, dict):
                    raise serializers.ValidationError(FORM_FIELD_ERRORS.get('option_must_be_dict', 'Each option must be a dictionary'))
                if 'value' not in option or 'label' not in option:
                    raise serializers.ValidationError(FORM_FIELD_ERRORS.get('option_missing_fields', 'Each option must have value and label'))
                if not option.get('value') or not option.get('label'):
                    raise serializers.ValidationError(FORM_FIELD_ERRORS.get('option_empty_fields', 'Value and label cannot be empty'))
        
        return value


class ContactFormFieldCreateSerializer(ContactFormFieldSerializer):
    
    class Meta(ContactFormFieldSerializer.Meta):
        pass


class ContactFormFieldUpdateSerializer(ContactFormFieldSerializer):
    
    field_key = serializers.CharField(read_only=True)
    
    class Meta(ContactFormFieldSerializer.Meta):
        pass

