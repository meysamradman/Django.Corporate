from rest_framework import serializers
from src.settings.models import MapSettings

class MapSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = MapSettings
        fields = [
            'id', 'public_id', 'provider', 'configs',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'public_id', 'created_at', 'updated_at']
