from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from src.real_estate.models.feature import PropertyFeature
from src.real_estate.messages.messages import FEATURE_ERRORS
from src.media.serializers import MediaAdminSerializer

class PropertyFeatureAdminListSerializer(serializers.ModelSerializer):
    property_count = serializers.IntegerField(read_only=True)
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = PropertyFeature
        fields = [
            'id', 'public_id', 'title', 'group', 'image_url',
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
    
    class Meta:
        model = PropertyFeature
        fields = [
            'id', 'public_id', 'title', 'group', 'image',
            'is_active', 'property_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'public_id', 'created_at', 'updated_at']

class PropertyFeatureAdminCreateSerializer(serializers.ModelSerializer):
    image_id = serializers.IntegerField(
        required=False,
        allow_null=True,
        write_only=True,
        help_text="Media ID from central media app"
    )
    
    class Meta:
        model = PropertyFeature
        fields = ['title', 'group', 'image_id', 'is_active']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['title'].validators = [
            validator for validator in self.fields['title'].validators
            if not isinstance(validator, UniqueValidator)
        ]
    
    def validate_title(self, value):
        if PropertyFeature.objects.filter(title=value).exists():
            raise serializers.ValidationError(FEATURE_ERRORS["feature_exists"])
        return value

class PropertyFeatureAdminUpdateSerializer(serializers.ModelSerializer):
    image_id = serializers.IntegerField(
        required=False,
        allow_null=True,
        write_only=True,
        help_text="Media ID from central media app"
    )
    
    class Meta:
        model = PropertyFeature
        fields = ['title', 'group', 'image_id', 'is_active']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['title'].validators = [
            validator for validator in self.fields['title'].validators
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

class PropertyFeatureAdminSerializer(PropertyFeatureAdminDetailSerializer):
    pass

