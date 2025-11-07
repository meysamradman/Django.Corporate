from rest_framework import serializers

from src.settings.models import ContactPhone


class ContactPhoneSerializer(serializers.ModelSerializer):
    """Serializer for contact phones"""
    
    class Meta:
        model = ContactPhone
        fields = [
            'id',
            'public_id',
            'phone_number',
            'label',
            'order',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'public_id', 'created_at', 'updated_at']
