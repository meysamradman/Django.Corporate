from rest_framework import serializers
from src.real_estate.models.state import PropertyState


class PropertyStatePublicSerializer(serializers.ModelSerializer):
    """
    Public serializer for PropertyState
    Returns minimal data for website display
    """
    
    name = serializers.CharField(source='title', read_only=True)
    property_count = serializers.IntegerField(read_only=True)
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = PropertyState
        fields = ['id', 'public_id', 'name', 'slug', 'usage_type', 'property_count', 'image_url', 'created_at', 'updated_at']
        read_only_fields = ['id', 'public_id', 'name', 'slug', 'usage_type', 'property_count', 'image_url', 'created_at', 'updated_at']

    def get_image_url(self, obj):
        try:
            if obj.image and hasattr(obj.image, 'file') and obj.image.file:
                return obj.image.file.url
        except Exception:
            pass
        return None


class PropertyStatePublicListSerializer(PropertyStatePublicSerializer):
    """List serializer for PropertyState - same as detail for now"""
    pass


class PropertyStatePublicDetailSerializer(PropertyStatePublicSerializer):
    """Detail serializer for PropertyState with extra info"""

    pass
