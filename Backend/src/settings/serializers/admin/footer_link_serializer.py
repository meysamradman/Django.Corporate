from rest_framework import serializers

from src.settings.models import FooterLink


class FooterLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = FooterLink
        fields = [
            'id',
            'public_id',
            'section',
            'title',
            'href',
            'order',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'public_id', 'created_at', 'updated_at']
