from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from django.utils.text import slugify
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
        fields = ['title', 'slug', 'is_active']

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
        if PropertyLabel.objects.filter(title=value).exists():
            raise serializers.ValidationError(LABEL_ERRORS["label_exists"])
        return value

    def validate_slug(self, value):
        value = (value or '').strip()
        if value and PropertyLabel.objects.filter(slug=value).exists():
            raise serializers.ValidationError(LABEL_ERRORS["label_slug_exists"])
        return value

    def validate(self, data):
        if not data.get('slug') and data.get('title'):
            data['slug'] = slugify(data['title'], allow_unicode=True)
        if data.get('slug') is not None:
            data['slug'] = (data.get('slug') or '').strip()
        return data

class PropertyLabelAdminUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyLabel
        fields = ['title', 'slug', 'is_active']

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
            if PropertyLabel.objects.exclude(id=self.instance.id).filter(title=value).exists():
                raise serializers.ValidationError(LABEL_ERRORS["label_exists"])
        else:
            if PropertyLabel.objects.filter(title=value).exists():
                raise serializers.ValidationError(LABEL_ERRORS["label_exists"])
        return value

    def validate_slug(self, value):
        value = (value or '').strip()
        if not value:
            return value
        if self.instance and hasattr(self.instance, 'id'):
            if PropertyLabel.objects.exclude(id=self.instance.id).filter(slug=value).exists():
                raise serializers.ValidationError(LABEL_ERRORS["label_slug_exists"])
        else:
            if PropertyLabel.objects.filter(slug=value).exists():
                raise serializers.ValidationError(LABEL_ERRORS["label_slug_exists"])
        return value
        
    def validate(self, data):
        if not data.get('slug') and data.get('title'):
            data['slug'] = slugify(data.get('title'), allow_unicode=True)
        if data.get('slug') is not None:
            data['slug'] = (data.get('slug') or '').strip()
        return data

class PropertyLabelAdminSerializer(PropertyLabelAdminDetailSerializer):
    pass

