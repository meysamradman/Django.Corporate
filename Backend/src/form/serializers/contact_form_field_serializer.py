import re

from rest_framework import serializers

from src.form.models import ContactFormField
from src.form.messages.messages import FORM_FIELD_ERRORS


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
        if value and len(value.strip()) < 2:
            raise serializers.ValidationError(FORM_FIELD_ERRORS['field_key_min_length'])
        
        if not re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', value):
            raise serializers.ValidationError(FORM_FIELD_ERRORS['field_key_invalid_format'])
        
        return value.strip()
    
    def validate_platforms(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError(FORM_FIELD_ERRORS['platforms_must_be_list'])
        
        valid_platforms = ['website', 'mobile_app']
        for platform in value:
            if platform not in valid_platforms:
                raise serializers.ValidationError(FORM_FIELD_ERRORS['invalid_platform'])
        
        if not value:
            raise serializers.ValidationError(FORM_FIELD_ERRORS['at_least_one_platform'])
        
        return value
    
    def validate_options(self, value):
        if not value:
            return value
        
        if not isinstance(value, list):
            raise serializers.ValidationError(FORM_FIELD_ERRORS['options_must_be_list'])
        
        field_type = self.initial_data.get('field_type') or (self.instance.field_type if self.instance else None)
        if field_type in ['select', 'radio']:
            if not value:
                raise serializers.ValidationError(FORM_FIELD_ERRORS['options_required'].format(field_type=field_type))
            
            for option in value:
                if not isinstance(option, dict):
                    raise serializers.ValidationError(FORM_FIELD_ERRORS['option_must_be_dict'])
                if 'value' not in option or 'label' not in option:
                    raise serializers.ValidationError(FORM_FIELD_ERRORS['option_missing_fields'])
                if not option.get('value') or not option.get('label'):
                    raise serializers.ValidationError(FORM_FIELD_ERRORS['option_empty_fields'])
        
        return value


class ContactFormFieldCreateSerializer(ContactFormFieldSerializer):
    
    class Meta(ContactFormFieldSerializer.Meta):
        pass


class ContactFormFieldUpdateSerializer(ContactFormFieldSerializer):
    
    field_key = serializers.CharField(read_only=True)
    
    class Meta(ContactFormFieldSerializer.Meta):
        pass

