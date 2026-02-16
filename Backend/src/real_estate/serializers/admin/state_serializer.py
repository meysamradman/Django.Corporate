from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from django.utils.text import slugify
from src.real_estate.models.state import PropertyState
from src.real_estate.messages.messages import STATE_ERRORS
from src.media.serializers import MediaAdminSerializer

class PropertyStateAdminListSerializer(serializers.ModelSerializer):
    property_count = serializers.IntegerField(read_only=True)
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = PropertyState
        fields = [
            'id', 'public_id', 'title', 'slug', 'usage_type',
            'is_active', 'property_count', 'image_url', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'public_id', 'created_at', 'updated_at']

    def get_image_url(self, obj):
        try:
            if obj.image and hasattr(obj.image, 'file') and obj.image.file:
                return obj.image.file.url
        except Exception:
            pass
        return None

class PropertyStateAdminDetailSerializer(serializers.ModelSerializer):
    property_count = serializers.IntegerField(read_only=True)
    image = MediaAdminSerializer(read_only=True)
    
    class Meta:
        model = PropertyState
        fields = [
            'id', 'public_id', 'title', 'slug', 'usage_type',
            'is_active', 'property_count', 'image', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'public_id', 'created_at', 'updated_at']

class PropertyStateAdminCreateSerializer(serializers.ModelSerializer):
    image_id = serializers.IntegerField(
        required=False,
        allow_null=True,
        write_only=True,
        help_text="Media ID from central media app"
    )

    class Meta:
        model = PropertyState
        fields = ['title', 'slug', 'usage_type', 'is_active', 'image_id']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['title'].validators = [
            validator for validator in self.fields['title'].validators
            if not isinstance(validator, UniqueValidator)
        ]
        self.fields['slug'].validators = [
            validator for validator in self.fields['slug'].validators
            if not isinstance(validator, UniqueValidator)
        ]
    
    def validate_title(self, value):
        if PropertyState.objects.filter(title=value).exists():
            raise serializers.ValidationError(STATE_ERRORS["state_exists"])
        return value
    
    def validate_slug(self, value):
        if value and PropertyState.objects.filter(slug=value).exists():
            raise serializers.ValidationError(STATE_ERRORS["state_slug_exists"])
        return value
    
    def validate(self, data):
        if not data.get('slug') and data.get('title'):
            data['slug'] = slugify(data['title'], allow_unicode=True)
        return data

class PropertyStateAdminUpdateSerializer(serializers.ModelSerializer):
    image_id = serializers.IntegerField(
        required=False,
        allow_null=True,
        write_only=True,
        help_text="Media ID from central media app"
    )

    class Meta:
        model = PropertyState
        fields = ['title', 'slug', 'usage_type', 'is_active', 'image_id']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['title'].validators = [
            validator for validator in self.fields['title'].validators
            if not isinstance(validator, UniqueValidator)
        ]
        self.fields['slug'].validators = [
            validator for validator in self.fields['slug'].validators
            if not isinstance(validator, UniqueValidator)
        ]
    
    def validate_title(self, value):
        if self.instance and hasattr(self.instance, 'id'):
            if PropertyState.objects.exclude(id=self.instance.id).filter(title=value).exists():
                raise serializers.ValidationError(STATE_ERRORS["state_exists"])
        else:
            if PropertyState.objects.filter(title=value).exists():
                raise serializers.ValidationError(STATE_ERRORS["state_exists"])
        return value
    
    def validate_slug(self, value):
        if value and self.instance:
            if PropertyState.objects.exclude(id=self.instance.id).filter(slug=value).exists():
                raise serializers.ValidationError(STATE_ERRORS["state_slug_exists"])
        return value
    
    def validate(self, data):
        if not data.get('slug') and data.get('title'):
            data['slug'] = slugify(data['title'], allow_unicode=True)
        return data

class PropertyStateAdminSerializer(PropertyStateAdminDetailSerializer):
    pass

