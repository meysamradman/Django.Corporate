from rest_framework import serializers
from src.real_estate.models.listing_type import ListingType

class ListingTypePublicSerializer(serializers.ModelSerializer):

    name = serializers.CharField(source='title', read_only=True)
    property_count = serializers.IntegerField(read_only=True)
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = ListingType
        fields = ['id', 'public_id', 'name', 'slug', 'short_description', 'usage_type', 'property_count', 'image_url', 'created_at', 'updated_at']
        read_only_fields = ['id', 'public_id', 'name', 'slug', 'short_description', 'usage_type', 'property_count', 'image_url', 'created_at', 'updated_at']

    def get_image_url(self, obj):
        try:
            if obj.image and hasattr(obj.image, 'file') and obj.image.file:
                return obj.image.file.url
        except Exception:
            pass
        return None

class ListingTypePublicListSerializer(ListingTypePublicSerializer):

    pass

class ListingTypePublicDetailSerializer(ListingTypePublicSerializer):

    pass
