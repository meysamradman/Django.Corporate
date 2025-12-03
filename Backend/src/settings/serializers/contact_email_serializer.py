from rest_framework import serializers
from src.settings.models import ContactEmail


class ContactEmailSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactEmail
        fields = [
            'id',
            'public_id',
            'email',
            'label',
            'order',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'public_id', 'created_at', 'updated_at']
