from rest_framework import serializers

from src.real_estate.models.feature import PropertyFeature
from src.real_estate.models.label import PropertyLabel
from src.real_estate.models.tag import PropertyTag
from src.real_estate.models.type import PropertyType

class PropertyTypePublicSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='title', read_only=True)
    property_count = serializers.IntegerField(read_only=True)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = PropertyType
        fields = [
            'id', 'public_id', 'name', 'slug', 'description',
            'property_count', 'image_url', 'created_at', 'updated_at',
        ]
        read_only_fields = fields

    def get_image_url(self, obj):
        image = getattr(obj, 'image', None)
        image_file = getattr(image, 'file', None) if image else None
        return image_file.url if image_file else None

class PropertyLabelPublicSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='title', read_only=True)
    property_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = PropertyLabel
        fields = [
            'id', 'public_id', 'name', 'slug',
            'property_count', 'created_at', 'updated_at',
        ]
        read_only_fields = fields

class PropertyTagPublicSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='title', read_only=True)
    property_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = PropertyTag
        fields = [
            'id', 'public_id', 'name', 'slug',
            'property_count', 'created_at', 'updated_at',
        ]
        read_only_fields = fields

class PropertyFeaturePublicSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='title', read_only=True)
    property_count = serializers.IntegerField(read_only=True)
    image_url = serializers.SerializerMethodField()
    parent_id = serializers.IntegerField(source='parent.id', read_only=True)
    parent_public_id = serializers.UUIDField(source='parent.public_id', read_only=True)
    parent_name = serializers.CharField(source='parent.title', read_only=True)
    parent_slug = serializers.CharField(source='parent.slug', read_only=True)

    class Meta:
        model = PropertyFeature
        fields = [
            'id', 'public_id', 'name', 'slug', 'group',
            'parent_id', 'parent_public_id', 'parent_name', 'parent_slug',
            'property_count', 'image_url', 'created_at', 'updated_at',
        ]
        read_only_fields = fields

    def get_image_url(self, obj):
        image = getattr(obj, 'image', None)
        image_file = getattr(image, 'file', None) if image else None
        return image_file.url if image_file else None
