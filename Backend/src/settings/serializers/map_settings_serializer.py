from rest_framework import serializers
from ..models.map_settings import MapSettings

class MapSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = MapSettings
        fields = [
            'id', 'public_id', 'provider',
            'google_maps_api_key', 'neshan_api_key', 'cedarmaps_api_key',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'public_id', 'created_at', 'updated_at']
