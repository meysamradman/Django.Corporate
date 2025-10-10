from rest_framework import serializers
from src.media.serializers.media_serializer import MediaAdminSerializer, MediaPublicSerializer
from src.portfolio.models.media import PortfolioMedia


class PortfolioMediaSerializer(serializers.ModelSerializer):
    media_detail = MediaAdminSerializer(read_only=True, source='media')

    class Meta:
        model = PortfolioMedia
        fields = [
            'id', 'public_id', 'media_detail', 'is_main_image', 'order',
            'created_at', 'updated_at',
        ]