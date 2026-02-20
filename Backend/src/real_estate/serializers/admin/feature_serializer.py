from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from django.utils.text import slugify
from src.real_estate.models.feature import PropertyFeature
from src.real_estate.messages.messages import FEATURE_ERRORS
from src.media.serializers import MediaAdminSerializer

class PropertyFeatureAdminListSerializer(serializers.ModelSerializer):
    property_count = serializers.IntegerField(read_only=True)
    image_url = serializers.SerializerMethodField()
    parent_id = serializers.IntegerField(source='parent.id', read_only=True)
    parent_title = serializers.CharField(source='parent.title', read_only=True)
    
    class Meta:
        model = PropertyFeature
        fields = [
            'id', 'public_id', 'title', 'slug', 'group', 'parent_id', 'parent_title', 'image_url',
            'is_active', 'property_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'public_id', 'created_at', 'updated_at']
    
    def get_image_url(self, obj):
        try:
            if obj.image and hasattr(obj.image, 'file') and obj.image.file:
                return obj.image.file.url
        except:
            pass
        return None

class PropertyFeatureAdminDetailSerializer(serializers.ModelSerializer):
    property_count = serializers.IntegerField(read_only=True)
    image = MediaAdminSerializer(read_only=True)
    parent_id = serializers.IntegerField(source='parent.id', read_only=True)
    parent_title = serializers.CharField(source='parent.title', read_only=True)
    
    class Meta:
        model = PropertyFeature
        fields = [
            'id', 'public_id', 'title', 'slug', 'group', 'parent_id', 'parent_title', 'image',
            'is_active', 'property_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'public_id', 'created_at', 'updated_at']

class PropertyFeatureAdminCreateSerializer(serializers.ModelSerializer):
    parent_id = serializers.PrimaryKeyRelatedField(
        source='parent',
        queryset=PropertyFeature.objects.filter(is_active=True),
        required=False,
        allow_null=True,
        write_only=True,
        help_text="Optional parent feature (only two levels allowed)"
    )
    image_id = serializers.IntegerField(
        required=False,
        allow_null=True,
        write_only=True,
        help_text="Media ID from central media app"
    )
    
    class Meta:
        model = PropertyFeature
        fields = ['title', 'slug', 'group', 'parent_id', 'image_id', 'is_active']

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
        if PropertyFeature.objects.filter(title=value).exists():
            raise serializers.ValidationError(FEATURE_ERRORS["feature_exists"])
        return value

    def validate_slug(self, value):
        value = (value or '').strip()
        if value and PropertyFeature.objects.filter(slug=value).exists():
            raise serializers.ValidationError(FEATURE_ERRORS["feature_slug_exists"])
        return value

    def validate(self, attrs):
        parent = attrs.get('parent')
        if parent and parent.parent_id is not None:
            raise serializers.ValidationError({'parent_id': FEATURE_ERRORS["feature_parent_two_levels_only"]})

        if not attrs.get('slug') and attrs.get('title'):
            attrs['slug'] = slugify(attrs['title'], allow_unicode=True)

        if attrs.get('slug') is not None:
            attrs['slug'] = (attrs.get('slug') or '').strip()

        return attrs

class PropertyFeatureAdminUpdateSerializer(serializers.ModelSerializer):
    parent_id = serializers.PrimaryKeyRelatedField(
        source='parent',
        queryset=PropertyFeature.objects.filter(is_active=True),
        required=False,
        allow_null=True,
        write_only=True,
        help_text="Optional parent feature (only two levels allowed)"
    )
    image_id = serializers.IntegerField(
        required=False,
        allow_null=True,
        write_only=True,
        help_text="Media ID from central media app"
    )
    
    class Meta:
        model = PropertyFeature
        fields = ['title', 'slug', 'group', 'parent_id', 'image_id', 'is_active']

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
            if PropertyFeature.objects.exclude(id=self.instance.id).filter(title=value).exists():
                raise serializers.ValidationError(FEATURE_ERRORS["feature_exists"])
        else:
            if PropertyFeature.objects.filter(title=value).exists():
                raise serializers.ValidationError(FEATURE_ERRORS["feature_exists"])
        return value

    def validate_slug(self, value):
        value = (value or '').strip()
        if not value:
            return value
        if self.instance and hasattr(self.instance, 'id'):
            if PropertyFeature.objects.exclude(id=self.instance.id).filter(slug=value).exists():
                raise serializers.ValidationError(FEATURE_ERRORS["feature_slug_exists"])
        else:
            if PropertyFeature.objects.filter(slug=value).exists():
                raise serializers.ValidationError(FEATURE_ERRORS["feature_slug_exists"])
        return value

    def validate(self, attrs):
        parent = attrs.get('parent', self.instance.parent if self.instance else None)
        if self.instance and parent and parent.id == self.instance.id:
            raise serializers.ValidationError({'parent_id': FEATURE_ERRORS["feature_parent_self"]})

        if parent and parent.parent_id is not None:
            raise serializers.ValidationError({'parent_id': FEATURE_ERRORS["feature_parent_two_levels_only"]})

        if not attrs.get('slug') and attrs.get('title'):
            attrs['slug'] = slugify(attrs['title'], allow_unicode=True)

        if attrs.get('slug') is not None:
            attrs['slug'] = (attrs.get('slug') or '').strip()

        return attrs

class PropertyFeatureAdminSerializer(PropertyFeatureAdminDetailSerializer):
    pass

