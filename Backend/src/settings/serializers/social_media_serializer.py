from rest_framework import serializers
from src.settings.models import SocialMedia
from src.media.serializers.media_serializer import ImageMediaSerializer

class SocialMediaSerializer(serializers.ModelSerializer):
    icon_data = ImageMediaSerializer(source='icon', read_only=True)
    
    class Meta:
        model = SocialMedia
        fields = [
            'id',
            'public_id',
            'name',
            'url',
            'icon',
            'icon_data',
            'order',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'public_id', 'created_at', 'updated_at']
