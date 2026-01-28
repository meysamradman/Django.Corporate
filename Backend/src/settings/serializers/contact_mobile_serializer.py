from rest_framework import serializers
from src.settings.models import ContactMobile

class ContactMobileSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMobile
        fields = [
            'id',
            'public_id',
            'mobile_number',
            'label',
            'order',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'public_id', 'created_at', 'updated_at']
