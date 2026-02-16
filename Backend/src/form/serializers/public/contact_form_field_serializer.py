from rest_framework import serializers

from src.form.models import ContactFormField


class PublicContactFormFieldSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactFormField
        fields = [
            'field_key',
            'field_type',
            'label',
            'placeholder',
            'required',
            'options',
            'validation_rules',
            'order',
        ]
