from rest_framework import serializers
from src.panel.models import PanelSettings
from src.media.serializers.media_serializer import MediaAdminSerializer


class PanelSettingsSerializer(serializers.ModelSerializer):
    logo_detail = MediaAdminSerializer(source='logo', read_only=True)
    favicon_detail = MediaAdminSerializer(source='favicon', read_only=True)

    class Meta:
        model = PanelSettings
        fields = [
            'id', 'public_id', 'panel_title',
            'logo', 'favicon', 'logo_detail', 'favicon_detail',
            'created_at', 'updated_at', 'is_active'
        ]


