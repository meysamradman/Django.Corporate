from rest_framework import serializers
from src.real_estate.models.tag import PropertyTag
from src.real_estate.messages.messages import TAG_ERRORS

class PropertyTagAdminListSerializer(serializers.ModelSerializer):
    property_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = PropertyTag
        fields = [
            'id', 'public_id', 'title', 'slug', 'description',
            'is_active', 'is_public', 'property_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'public_id', 'created_at', 'updated_at']

class PropertyTagAdminDetailSerializer(serializers.ModelSerializer):
    property_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = PropertyTag
        fields = [
            'id', 'public_id', 'title', 'slug', 'description',
            'is_active', 'is_public', 'property_count',
            'meta_title', 'meta_description', 'og_title', 'og_description',
            'canonical_url', 'robots_meta',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'public_id', 'created_at', 'updated_at']

class PropertyTagAdminCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyTag
        fields = [
            'title', 'slug', 'description', 'is_active', 'is_public',
            'meta_title', 'meta_description', 'og_title', 'og_description',
            'canonical_url', 'robots_meta'
        ]
    
    def validate_slug(self, value):
        if value and PropertyTag.objects.filter(slug=value).exists():
            raise serializers.ValidationError(TAG_ERRORS.get("tag_not_found", "This slug already exists"))
        return value
    
    def validate_title(self, value):
        if PropertyTag.objects.filter(title=value).exists():
            raise serializers.ValidationError(TAG_ERRORS.get("tag_not_found", "This tag already exists"))
        return value

class PropertyTagAdminUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyTag
        fields = [
            'title', 'slug', 'description', 'is_active', 'is_public',
            'meta_title', 'meta_description', 'og_title', 'og_description',
            'canonical_url', 'robots_meta'
        ]
    
    def validate_slug(self, value):
        if value:
            if self.instance and hasattr(self.instance, 'id'):
                if PropertyTag.objects.exclude(id=self.instance.id).filter(slug=value).exists():
                    raise serializers.ValidationError(TAG_ERRORS.get("tag_not_found", "This slug already exists"))
            else:
                if PropertyTag.objects.filter(slug=value).exists():
                    raise serializers.ValidationError(TAG_ERRORS.get("tag_not_found", "This slug already exists"))
        return value

    def validate_title(self, value):
        if self.instance and hasattr(self.instance, 'id'):
            if PropertyTag.objects.exclude(id=self.instance.id).filter(title=value).exists():
                raise serializers.ValidationError(TAG_ERRORS.get("tag_not_found", "This tag already exists"))
        else:
            if PropertyTag.objects.filter(title=value).exists():
                raise serializers.ValidationError(TAG_ERRORS.get("tag_not_found", "This tag already exists"))
        return value

class PropertyTagAdminSerializer(PropertyTagAdminDetailSerializer):
    pass

