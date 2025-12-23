from rest_framework import serializers
from src.real_estate.models.agency import RealEstateAgency
from src.real_estate.messages.messages import AGENCY_ERRORS
from src.media.serializers.media_serializer import MediaAdminSerializer


class RealEstateAgencyAdminListSerializer(serializers.ModelSerializer):
    city_name = serializers.CharField(source='city.name', read_only=True)
    manager_name = serializers.SerializerMethodField()
    property_count = serializers.IntegerField(read_only=True)
    agent_count = serializers.IntegerField(read_only=True)
    logo_url = serializers.SerializerMethodField()
    
    class Meta:
        model = RealEstateAgency
        fields = [
            'id', 'public_id', 'name', 'slug', 'license_number',
            'phone', 'email', 'website',
            'city_name', 'manager_name',
            'property_count', 'agent_count',
            'is_verified', 'rating', 'total_reviews',
            'logo_url', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'public_id', 'created_at', 'updated_at']
    
    def get_manager_name(self, obj):
        if obj.manager:
            return obj.manager.get_full_name() or obj.manager.email
        return None
    
    def get_logo_url(self, obj):
        if obj.logo and obj.logo.file:
            return obj.logo.file.url
        return None


class RealEstateAgencyAdminDetailSerializer(serializers.ModelSerializer):
    city_name = serializers.CharField(source='city.name', read_only=True)
    manager_name = serializers.SerializerMethodField()
    property_count = serializers.IntegerField(read_only=True)
    agent_count = serializers.IntegerField(read_only=True)
    logo = MediaAdminSerializer(read_only=True)
    cover_image = MediaAdminSerializer(read_only=True)
    
    class Meta:
        model = RealEstateAgency
        fields = [
            'id', 'public_id', 'name', 'slug', 'license_number',
            'phone', 'email', 'website',
            'city', 'city_name', 'address', 'latitude', 'longitude',
            'manager', 'manager_name',
            'logo', 'cover_image',
            'property_count', 'agent_count',
            'is_verified', 'rating', 'total_reviews',
            'description', 'is_active',
            'created_at', 'updated_at',
            'meta_title', 'meta_description', 'og_title', 'og_description',
            'canonical_url', 'robots_meta'
        ]
        read_only_fields = ['id', 'public_id', 'created_at', 'updated_at']
    
    def get_manager_name(self, obj):
        if obj.manager:
            return obj.manager.get_full_name() or obj.manager.email
        return None


class RealEstateAgencyAdminCreateSerializer(serializers.ModelSerializer):
    manager_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    
    class Meta:
        model = RealEstateAgency
        fields = [
            'name', 'slug', 'license_number',
            'phone', 'email', 'website',
            'city', 'address', 'latitude', 'longitude',
            'manager_id', 'logo', 'cover_image',
            'is_verified', 'rating', 'total_reviews',
            'description', 'is_active',
            'meta_title', 'meta_description', 'og_title', 'og_description',
            'canonical_url', 'robots_meta'
        ]
    
    def validate_license_number(self, value):
        if RealEstateAgency.objects.filter(license_number=value).exists():
            raise serializers.ValidationError(AGENCY_ERRORS["license_number_exists"])
        return value


class RealEstateAgencyAdminUpdateSerializer(serializers.ModelSerializer):
    manager_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    
    class Meta:
        model = RealEstateAgency
        fields = [
            'name', 'slug', 'license_number',
            'phone', 'email', 'website',
            'city', 'address', 'latitude', 'longitude',
            'manager_id', 'logo', 'cover_image',
            'is_verified', 'rating', 'total_reviews',
            'description', 'is_active',
            'meta_title', 'meta_description', 'og_title', 'og_description',
            'canonical_url', 'robots_meta'
        ]
    
    def validate_license_number(self, value):
        if RealEstateAgency.objects.exclude(id=self.instance.id).filter(license_number=value).exists():
            raise serializers.ValidationError(AGENCY_ERRORS["license_number_exists"])
        return value


class RealEstateAgencyAdminSerializer(RealEstateAgencyAdminDetailSerializer):
    pass

