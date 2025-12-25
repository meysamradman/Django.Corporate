from rest_framework import serializers
from src.real_estate.models.feature import PropertyFeature
from src.real_estate.messages.messages import FEATURE_ERRORS


class PropertyFeatureAdminListSerializer(serializers.ModelSerializer):
    property_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = PropertyFeature
        fields = [
            'id', 'public_id', 'title', 'category',
            'is_active', 'property_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'public_id', 'created_at', 'updated_at']


class PropertyFeatureAdminDetailSerializer(serializers.ModelSerializer):
    property_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = PropertyFeature
        fields = [
            'id', 'public_id', 'title', 'category',
            'is_active', 'property_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'public_id', 'created_at', 'updated_at']


class PropertyFeatureAdminCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyFeature
        fields = ['title', 'category', 'is_active']
    
    def validate_title(self, value):
        if PropertyFeature.objects.filter(title=value).exists():
            raise serializers.ValidationError(FEATURE_ERRORS.get("feature_not_found", "This feature already exists"))
        return value


class PropertyFeatureAdminUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyFeature
        fields = ['title', 'category', 'is_active']
    
    def validate_title(self, value):
        # Check if we're updating an existing instance
        if self.instance and hasattr(self.instance, 'id'):
            if PropertyFeature.objects.exclude(id=self.instance.id).filter(title=value).exists():
                raise serializers.ValidationError(FEATURE_ERRORS.get("feature_not_found", "This feature already exists"))
        else:
            # If no instance, check if title exists at all
            if PropertyFeature.objects.filter(title=value).exists():
                raise serializers.ValidationError(FEATURE_ERRORS.get("feature_not_found", "This feature already exists"))
        return value


class PropertyFeatureAdminSerializer(PropertyFeatureAdminDetailSerializer):
    pass

