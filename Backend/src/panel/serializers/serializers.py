from rest_framework import serializers
from src.panel.models import PanelSettings
from src.media.serializers.media_serializer import MediaAdminSerializer
from src.media.models.media import Media


class PanelSettingsSerializer(serializers.ModelSerializer):
    logo_detail = MediaAdminSerializer(source='logo', read_only=True)
    favicon_detail = MediaAdminSerializer(source='favicon', read_only=True)
    logo_url = serializers.SerializerMethodField()
    favicon_url = serializers.SerializerMethodField()
    # Make logo and favicon fields writable for media selection
    logo = serializers.PrimaryKeyRelatedField(queryset=Media.objects.all(), required=False, allow_null=True)
    favicon = serializers.PrimaryKeyRelatedField(queryset=Media.objects.all(), required=False, allow_null=True)

    class Meta:
        model = PanelSettings
        fields = [
            'id', 'public_id', 'panel_title',
            'logo', 'favicon', 'logo_detail', 'favicon_detail',
            'logo_url', 'favicon_url',
            'created_at', 'updated_at', 'is_active'
        ]

    def get_logo_url(self, obj):
        if obj.logo and obj.logo.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.logo.file.url)
        return None

    def get_favicon_url(self, obj):
        if obj.favicon and obj.favicon.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.favicon.file.url)
        return None

    def update(self, instance, validated_data):
        # Handle logo removal
        if self.context['request'].data.get('remove_logo') == 'true':
            instance.logo = None
            
        # Handle favicon removal
        if self.context['request'].data.get('remove_favicon') == 'true':
            instance.favicon = None
        
        # Update other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
            
        instance.save()
        return instance