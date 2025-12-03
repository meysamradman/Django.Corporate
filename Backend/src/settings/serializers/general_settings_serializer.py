from rest_framework import serializers
from src.settings.models import GeneralSettings
from src.media.serializers.media_serializer import ImageMediaSerializer


class GeneralSettingsSerializer(serializers.ModelSerializer):
    enamad_image_data = ImageMediaSerializer(source='enamad_image', read_only=True)
    logo_image_data = ImageMediaSerializer(source='logo_image', read_only=True)
    favicon_image_data = ImageMediaSerializer(source='favicon_image', read_only=True)
    
    class Meta:
        model = GeneralSettings
        fields = [
            'id',
            'public_id',
            'site_name',
            'enamad_image',
            'enamad_image_data',
            'logo_image',
            'logo_image_data',
            'favicon_image',
            'favicon_image_data',
            'copyright_text',
            'copyright_link',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'public_id', 'created_at', 'updated_at']
