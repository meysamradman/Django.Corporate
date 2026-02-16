from rest_framework import serializers

from src.settings.models import FooterAbout


class FooterAboutSerializer(serializers.ModelSerializer):
    class Meta:
        model = FooterAbout
        fields = [
            'id',
            'public_id',
            'title',
            'text',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'public_id', 'created_at', 'updated_at']
