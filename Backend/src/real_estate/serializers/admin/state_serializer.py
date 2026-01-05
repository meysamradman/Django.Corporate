from rest_framework import serializers
from django.utils.text import slugify
from src.real_estate.models.state import PropertyState
from src.real_estate.messages.messages import STATE_ERRORS


class PropertyStateAdminListSerializer(serializers.ModelSerializer):
    property_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = PropertyState
        fields = [
            'id', 'public_id', 'title', 'slug', 'usage_type',
            'is_active', 'property_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'public_id', 'created_at', 'updated_at']


class PropertyStateAdminDetailSerializer(serializers.ModelSerializer):
    property_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = PropertyState
        fields = [
            'id', 'public_id', 'title', 'slug', 'usage_type',
            'is_active', 'property_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'public_id', 'created_at', 'updated_at']


class PropertyStateAdminCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyState
        fields = ['title', 'slug', 'usage_type', 'is_active']
    
    def validate_title(self, value):
        if PropertyState.objects.filter(title=value).exists():
            raise serializers.ValidationError(STATE_ERRORS.get("state_not_found", "This state already exists"))
        return value
    
    def validate_slug(self, value):
        if value and PropertyState.objects.filter(slug=value).exists():
            raise serializers.ValidationError(STATE_ERRORS.get("state_slug_exists", "This slug already exists"))
        return value
    
    def validate(self, data):
        # Auto-generate slug from title if not provided
        if not data.get('slug') and data.get('title'):
            data['slug'] = slugify(data['title'], allow_unicode=True)
        return data


class PropertyStateAdminUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyState
        fields = ['title', 'slug', 'usage_type', 'is_active']
    
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
    
    def validate_slug(self, value):
        if value and self.instance:
            if PropertyState.objects.exclude(id=self.instance.id).filter(slug=value).exists():
                raise serializers.ValidationError(STATE_ERRORS.get("state_slug_exists", "This slug already exists"))
        return value
    
    def validate(self, data):
        # Auto-generate slug from title if not provided
        if not data.get('slug') and data.get('title'):
            data['slug'] = slugify(data['title'], allow_unicode=True)
        return data


class PropertyStateAdminSerializer(PropertyStateAdminDetailSerializer):
    pass

