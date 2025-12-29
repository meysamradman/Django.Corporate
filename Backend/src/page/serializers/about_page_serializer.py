from rest_framework import serializers
from src.page.models import AboutPage
from src.media.serializers.media_serializer import ImageMediaSerializer
from src.page.messages import ABOUT_PAGE_ERRORS


class AboutPageSerializer(serializers.ModelSerializer):
    featured_image_data = ImageMediaSerializer(
        source='featured_image',
        read_only=True
    )
    
    og_image_data = ImageMediaSerializer(
        source='og_image',
        read_only=True
    )
    computed_meta_title = serializers.SerializerMethodField()
    computed_meta_description = serializers.SerializerMethodField()
    computed_og_title = serializers.SerializerMethodField()
    computed_og_description = serializers.SerializerMethodField()
    computed_canonical_url = serializers.SerializerMethodField()
    
    class Meta:
        model = AboutPage
        fields = [
            'id',
            'public_id',
            'title',
            'slug',
            'content',
            'short_description',
            'meta_title',
            'meta_description',
            'og_title',
            'og_description',
            'og_image',
            'og_image_data',
            'canonical_url',
            'robots_meta',
            'structured_data',
            'hreflang_data',
            'featured_image',
            'featured_image_data',
            'is_active',
            'created_at',
            'updated_at',
            'computed_meta_title',
            'computed_meta_description',
            'computed_og_title',
            'computed_og_description',
            'computed_canonical_url',
        ]
        read_only_fields = [
            'id',
            'public_id',
            'slug',
            'created_at',
            'updated_at',
            'computed_meta_title',
            'computed_meta_description',
            'computed_og_title',
            'computed_og_description',
            'computed_canonical_url',
        ]
    
    def get_computed_meta_title(self, obj):
        return obj.get_meta_title()
    
    def get_computed_meta_description(self, obj):
        return obj.get_meta_description()
    
    def get_computed_og_title(self, obj):
        return obj.get_og_title()
    
    def get_computed_og_description(self, obj):
        return obj.get_og_description()
    
    def get_computed_canonical_url(self, obj):
        return obj.get_canonical_url()


class AboutPageUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = AboutPage
        fields = [
            'title',
            'slug',
            'content',
            'short_description',
            'meta_title',
            'meta_description',
            'og_title',
            'og_description',
            'og_image',
            'canonical_url',
            'robots_meta',
            'structured_data',
            'hreflang_data',
            'featured_image',
            'is_active',
        ]
    
    def validate_title(self, value):
        if value and len(value.strip()) < 3:
            raise serializers.ValidationError(ABOUT_PAGE_ERRORS["title_min_length"])
        return value.strip() if value else value
    
    def validate_slug(self, value):
        if value and len(value.strip()) < 3:
            raise serializers.ValidationError(ABOUT_PAGE_ERRORS.get("slug_min_length", "Slug must be at least 3 characters."))
        return value.strip() if value else value
    
    def validate_content(self, value):
        return value.strip() if value else value
    
    def validate_meta_title(self, value):
        if value and len(value) > 70:
            raise serializers.ValidationError(ABOUT_PAGE_ERRORS["meta_title_max_length"])
        return value
    
    def validate_meta_description(self, value):
        if value and len(value) > 300:
            raise serializers.ValidationError(ABOUT_PAGE_ERRORS["meta_description_max_length"])
        return value
