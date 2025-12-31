from rest_framework import serializers
from src.real_estate.models.agency import RealEstateAgency
from src.real_estate.messages.messages import AGENCY_ERRORS
from src.media.serializers.media_serializer import MediaAdminSerializer


class RealEstateAgencyAdminListSerializer(serializers.ModelSerializer):
    province_name = serializers.CharField(source='province.name', read_only=True)
    city_name = serializers.CharField(source='city.name', read_only=True)
    property_count = serializers.IntegerField(read_only=True)
    agent_count = serializers.IntegerField(read_only=True)
    profile_picture_url = serializers.SerializerMethodField()
    
    class Meta:
        model = RealEstateAgency
        fields = [
            'id', 'public_id', 'name', 'slug', 'license_number', 'license_expire_date',
            'phone', 'email', 'website',
            'province_name', 'city_name',
            'property_count', 'agent_count',
            'rating', 'total_reviews',
            'profile_picture_url', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'public_id', 'created_at', 'updated_at']
    
    def get_profile_picture_url(self, obj):
        if obj.profile_picture and obj.profile_picture.file:
            return obj.profile_picture.file.url
        return None


class RealEstateAgencyAdminDetailSerializer(serializers.ModelSerializer):
    province_name = serializers.CharField(source='province.name', read_only=True)
    city_name = serializers.CharField(source='city.name', read_only=True)
    property_count = serializers.IntegerField(read_only=True)
    agent_count = serializers.IntegerField(read_only=True)
    profile_picture = MediaAdminSerializer(read_only=True)
    
    class Meta:
        model = RealEstateAgency
        fields = [
            'id', 'public_id', 'name', 'slug', 'license_number', 'license_expire_date',
            'phone', 'email', 'website',
            'province', 'province_name', 'city', 'city_name', 'address',
            'profile_picture',
            'property_count', 'agent_count',
            'rating', 'total_reviews',
            'description', 'is_active',
            'created_at', 'updated_at',
            'meta_title', 'meta_description', 'og_title', 'og_description',
            'canonical_url', 'robots_meta'
        ]
        read_only_fields = ['id', 'public_id', 'created_at', 'updated_at']


class RealEstateAgencyAdminCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = RealEstateAgency
        fields = [
            'name', 'slug', 'license_number', 'license_expire_date',
            'phone', 'email', 'website',
            'province', 'city', 'address',
            'profile_picture',
            'rating', 'total_reviews',
            'description', 'is_active',
            'meta_title', 'meta_description', 'og_title', 'og_description',
            'canonical_url', 'robots_meta'
        ]
    
    def validate_slug(self, value):
        """Validate that slug is unique"""
        if not value:
            raise serializers.ValidationError("نامک (Slug) الزامی است.")
        if RealEstateAgency.objects.filter(slug=value).exists():
            raise serializers.ValidationError("این نامک قبلاً استفاده شده است.")
        return value
    
    def validate_license_number(self, value):
        if RealEstateAgency.objects.filter(license_number=value).exists():
            raise serializers.ValidationError(AGENCY_ERRORS["license_number_exists"])
        return value


class RealEstateAgencyAdminUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = RealEstateAgency
        fields = [
            'name', 'slug', 'license_number', 'license_expire_date',
            'phone', 'email', 'website',
            'province', 'city', 'address',
            'profile_picture',
            'rating', 'total_reviews',
            'description', 'is_active',
            'meta_title', 'meta_description', 'og_title', 'og_description',
            'canonical_url', 'robots_meta'
        ]
    
    def validate_slug(self, value):
        """Validate that slug is unique (excluding current instance)"""
        if not value:
            raise serializers.ValidationError("نامک (Slug) الزامی است.")
        if RealEstateAgency.objects.exclude(id=self.instance.id).filter(slug=value).exists():
            raise serializers.ValidationError("این نامک قبلاً استفاده شده است.")
        return value
    
    def validate_license_number(self, value):
        if RealEstateAgency.objects.exclude(id=self.instance.id).filter(license_number=value).exists():
            raise serializers.ValidationError(AGENCY_ERRORS["license_number_exists"])
        return value


class RealEstateAgencyAdminSerializer(RealEstateAgencyAdminDetailSerializer):
    pass

