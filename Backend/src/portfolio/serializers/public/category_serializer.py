from rest_framework import serializers
from src.media.serializers import MediaPublicSerializer
from src.portfolio.models.category import PortfolioCategory
from drf_spectacular.utils import extend_schema_field

class PortfolioCategorySimplePublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = PortfolioCategory
        fields = [
            'public_id', 'name', 'slug', 'created_at',
        ]

class PortfolioCategoryPublicSerializer(serializers.ModelSerializer):
    parent = serializers.SerializerMethodField()
    children = serializers.SerializerMethodField()
    image = MediaPublicSerializer(read_only=True)
    portfolio_count = serializers.IntegerField(read_only=True)

    @extend_schema_field(serializers.DictField())
    def get_parent(self, obj):
        parent = obj.get_parent()
        if parent:
            return {'public_id': parent.public_id, 'name': parent.name, 'slug': parent.slug}
        return None

    @extend_schema_field(serializers.ListField(child=serializers.DictField()))
    def get_children(self, obj):
        children = obj.get_children()
        return [{'public_id': child.public_id, 'name': child.name, 'slug': child.slug} for child in children] if children.exists() else None

    class Meta:
        model = PortfolioCategory
        fields = [
            'public_id', 'name', 'slug', 'description', 'is_public', 'is_active', 
            'children', 'parent', 'image', 'portfolio_count', 'created_at',
        ]
