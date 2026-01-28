from rest_framework import serializers
from src.panel.models import PanelSettings
from src.media.serializers.media_serializer import MediaAdminSerializer
from src.media.models.media import ImageMedia

class PanelSettingsSerializer(serializers.ModelSerializer):
    logo_detail = MediaAdminSerializer(source='logo', read_only=True)
    favicon_detail = MediaAdminSerializer(source='favicon', read_only=True)
    logo_url = serializers.SerializerMethodField()
    favicon_url = serializers.SerializerMethodField()
    logo = serializers.PrimaryKeyRelatedField(queryset=ImageMedia.objects.all(), required=False, allow_null=True)
    favicon = serializers.PrimaryKeyRelatedField(queryset=ImageMedia.objects.all(), required=False, allow_null=True)

    class Meta:
        model = PanelSettings
        fields = [
            'id', 'public_id', 'panel_title',
            'logo', 'favicon', 'logo_detail', 'favicon_detail',
            'logo_url', 'favicon_url',
            'created_at', 'updated_at', 'is_active'
        ]

    def get_logo_url(self, obj):
        if obj.logo and hasattr(obj.logo, 'file') and obj.logo.file:
            return obj.logo.file.url
        return None

    def get_favicon_url(self, obj):
        if obj.favicon and hasattr(obj.favicon, 'file') and obj.favicon.file:
            return obj.favicon.file.url
        return None