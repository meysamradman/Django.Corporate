# Third-party (DRF)
from rest_framework import serializers

# Project models
from src.page.models import TermsPage

# Project serializers
from src.media.serializers.media_serializer import ImageMediaSerializer


class TermsPageSerializer(serializers.ModelSerializer):
    """Serializer برای نمایش کامل اطلاعات صفحه قوانین و مقررات"""
    
    featured_image_data = ImageMediaSerializer(
        source='featured_image',
        read_only=True
    )
    
    og_image_data = ImageMediaSerializer(
        source='og_image',
        read_only=True
    )
    
    # SEO computed fields
    computed_meta_title = serializers.SerializerMethodField()
    computed_meta_description = serializers.SerializerMethodField()
    computed_og_title = serializers.SerializerMethodField()
    computed_og_description = serializers.SerializerMethodField()
    computed_canonical_url = serializers.SerializerMethodField()
    
    class Meta:
        model = TermsPage
        fields = [
            'id',
            'public_id',
            'title',
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
            # Computed fields
            'computed_meta_title',
            'computed_meta_description',
            'computed_og_title',
            'computed_og_description',
            'computed_canonical_url',
        ]
        read_only_fields = [
            'id',
            'public_id',
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


class TermsPageUpdateSerializer(serializers.ModelSerializer):
    """Serializer برای به‌روزرسانی صفحه قوانین و مقررات"""
    
    class Meta:
        model = TermsPage
        fields = [
            'title',
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
        """اعتبارسنجی عنوان"""
        if value and len(value.strip()) < 3:
            raise serializers.ValidationError("عنوان باید حداقل 3 کاراکتر باشد")
        return value.strip() if value else value
    
    def validate_content(self, value):
        """اعتبارسنجی محتوا"""
        return value.strip() if value else value
    
    def validate_meta_title(self, value):
        """اعتبارسنجی meta title"""
        if value and len(value) > 70:
            raise serializers.ValidationError("Meta title باید حداکثر 70 کاراکتر باشد")
        return value
    
    def validate_meta_description(self, value):
        """اعتبارسنجی meta description"""
        if value and len(value) > 300:
            raise serializers.ValidationError("Meta description باید حداکثر 300 کاراکتر باشد")
        return value

