from rest_framework import serializers
from src.real_estate.models.label import PropertyLabel
from src.real_estate.messages.messages import LABEL_ERRORS


class PropertyLabelAdminListSerializer(serializers.ModelSerializer):
    property_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = PropertyLabel
        fields = [
            'id', 'public_id', 'title',
            'is_active', 'property_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'public_id', 'created_at', 'updated_at']


class PropertyLabelAdminDetailSerializer(serializers.ModelSerializer):
    property_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = PropertyLabel
        fields = [
            'id', 'public_id', 'title',
            'is_active', 'property_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'public_id', 'created_at', 'updated_at']


class PropertyLabelAdminCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyLabel
        fields = ['title', 'is_active']
    
    def validate_title(self, value):
        if PropertyLabel.objects.filter(title=value).exists():
            raise serializers.ValidationError(LABEL_ERRORS.get("label_not_found", "This label already exists"))
        return value


class PropertyLabelAdminUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyLabel
        fields = ['title', 'is_active']
    
    def validate_title(self, value):
        # Check if we're updating an existing instance
        if self.instance and hasattr(self.instance, 'id'):
            if PropertyLabel.objects.exclude(id=self.instance.id).filter(title=value).exists():
                raise serializers.ValidationError(LABEL_ERRORS.get("label_not_found", "This label already exists"))
        else:
            # If no instance, check if title exists at all
            if PropertyLabel.objects.filter(title=value).exists():
                raise serializers.ValidationError(LABEL_ERRORS.get("label_not_found", "This label already exists"))
        return value


class PropertyLabelAdminSerializer(PropertyLabelAdminDetailSerializer):
    pass

