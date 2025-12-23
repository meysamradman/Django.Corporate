from rest_framework import serializers
from src.real_estate.models.type import PropertyType
from src.real_estate.messages.messages import TYPE_ERRORS


class PropertyTypeAdminListSerializer(serializers.ModelSerializer):
    property_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = PropertyType
        fields = [
            'id', 'public_id', 'title', 'display_order',
            'is_active', 'property_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'public_id', 'created_at', 'updated_at']


class PropertyTypeAdminDetailSerializer(serializers.ModelSerializer):
    property_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = PropertyType
        fields = [
            'id', 'public_id', 'title', 'display_order',
            'is_active', 'property_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'public_id', 'created_at', 'updated_at']


class PropertyTypeAdminCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyType
        fields = ['title', 'display_order', 'is_active']
    
    def validate_title(self, value):
        if PropertyType.objects.filter(title=value).exists():
            raise serializers.ValidationError(TYPE_ERRORS.get("type_not_found", "This type already exists"))
        return value


class PropertyTypeAdminUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyType
        fields = ['title', 'display_order', 'is_active']
    
    def validate_title(self, value):
        if PropertyType.objects.exclude(id=self.instance.id).filter(title=value).exists():
            raise serializers.ValidationError(TYPE_ERRORS.get("type_not_found", "This type already exists"))
        return value


class PropertyTypeAdminSerializer(PropertyTypeAdminDetailSerializer):
    pass

