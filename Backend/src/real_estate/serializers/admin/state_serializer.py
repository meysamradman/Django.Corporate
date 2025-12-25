from rest_framework import serializers
from src.real_estate.models.state import PropertyState
from src.real_estate.messages.messages import STATE_ERRORS


class PropertyStateAdminListSerializer(serializers.ModelSerializer):
    property_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = PropertyState
        fields = [
            'id', 'public_id', 'title',
            'is_active', 'property_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'public_id', 'created_at', 'updated_at']


class PropertyStateAdminDetailSerializer(serializers.ModelSerializer):
    property_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = PropertyState
        fields = [
            'id', 'public_id', 'title',
            'is_active', 'property_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'public_id', 'created_at', 'updated_at']


class PropertyStateAdminCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyState
        fields = ['title', 'is_active']
    
    def validate_title(self, value):
        if PropertyState.objects.filter(title=value).exists():
            raise serializers.ValidationError(STATE_ERRORS.get("state_not_found", "This state already exists"))
        return value


class PropertyStateAdminUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyState
        fields = ['title', 'is_active']
    
    def validate_title(self, value):
        # Check if we're updating an existing instance
        if self.instance and hasattr(self.instance, 'id'):
            if PropertyState.objects.exclude(id=self.instance.id).filter(title=value).exists():
                raise serializers.ValidationError(STATE_ERRORS.get("state_not_found", "This state already exists"))
        else:
            # If no instance, check if title exists at all
            if PropertyState.objects.filter(title=value).exists():
                raise serializers.ValidationError(STATE_ERRORS.get("state_not_found", "This state already exists"))
        return value


class PropertyStateAdminSerializer(PropertyStateAdminDetailSerializer):
    pass

