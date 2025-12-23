from rest_framework import serializers
from src.real_estate.models.agent import PropertyAgent
from src.real_estate.models.agency import RealEstateAgency
from src.real_estate.messages.messages import AGENT_ERRORS
from src.media.serializers.media_serializer import MediaAdminSerializer


class RealEstateAgencySimpleAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = RealEstateAgency
        fields = ['id', 'public_id', 'name', 'slug']


class PropertyAgentAdminListSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    agency = RealEstateAgencySimpleAdminSerializer(read_only=True)
    city_name = serializers.CharField(source='city.name', read_only=True)
    property_count = serializers.IntegerField(read_only=True)
    avatar_url = serializers.SerializerMethodField()
    
    class Meta:
        model = PropertyAgent
        fields = [
            'id', 'public_id', 'first_name', 'last_name', 'full_name',
            'phone', 'email', 'license_number', 'slug',
            'agency', 'city_name', 'property_count',
            'is_verified', 'rating', 'total_sales', 'total_reviews',
            'experience_years', 'avatar_url', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'public_id', 'created_at', 'updated_at']
    
    def get_avatar_url(self, obj):
        if obj.avatar and obj.avatar.file:
            return obj.avatar.file.url
        return None


class PropertyAgentAdminDetailSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    agency = RealEstateAgencySimpleAdminSerializer(read_only=True)
    city_name = serializers.CharField(source='city.name', read_only=True)
    property_count = serializers.IntegerField(read_only=True)
    avatar = MediaAdminSerializer(read_only=True)
    cover_image = MediaAdminSerializer(read_only=True)
    
    class Meta:
        model = PropertyAgent
        fields = [
            'id', 'public_id', 'user', 'first_name', 'last_name', 'full_name',
            'phone', 'email', 'whatsapp', 'telegram',
            'license_number', 'slug', 'agency', 'city', 'city_name',
            'address', 'latitude', 'longitude',
            'avatar', 'cover_image', 'property_count',
            'is_verified', 'rating', 'total_sales', 'total_reviews',
            'experience_years', 'specialization', 'bio',
            'is_active', 'created_at', 'updated_at',
            'meta_title', 'meta_description', 'og_title', 'og_description',
            'canonical_url', 'robots_meta'
        ]
        read_only_fields = ['id', 'public_id', 'created_at', 'updated_at']


class PropertyAgentAdminCreateSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = PropertyAgent
        fields = [
            'user_id', 'agency', 'first_name', 'last_name',
            'phone', 'email', 'whatsapp', 'telegram',
            'license_number', 'slug', 'city',
            'address', 'latitude', 'longitude',
            'avatar', 'cover_image',
            'is_verified', 'rating', 'total_sales', 'total_reviews',
            'experience_years', 'specialization', 'bio',
            'is_active',
            'meta_title', 'meta_description', 'og_title', 'og_description',
            'canonical_url', 'robots_meta'
        ]
    
    def validate_license_number(self, value):
        if PropertyAgent.objects.filter(license_number=value).exists():
            raise serializers.ValidationError(AGENT_ERRORS["license_number_exists"])
        return value


class PropertyAgentAdminUpdateSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(write_only=True, required=False)
    
    class Meta:
        model = PropertyAgent
        fields = [
            'user_id', 'agency', 'first_name', 'last_name',
            'phone', 'email', 'whatsapp', 'telegram',
            'license_number', 'slug', 'city',
            'address', 'latitude', 'longitude',
            'avatar', 'cover_image',
            'is_verified', 'rating', 'total_sales', 'total_reviews',
            'experience_years', 'specialization', 'bio',
            'is_active',
            'meta_title', 'meta_description', 'og_title', 'og_description',
            'canonical_url', 'robots_meta'
        ]
    
    def validate_license_number(self, value):
        if PropertyAgent.objects.exclude(id=self.instance.id).filter(license_number=value).exists():
            raise serializers.ValidationError(AGENT_ERRORS["license_number_exists"])
        return value


class PropertyAgentAdminSerializer(PropertyAgentAdminDetailSerializer):
    pass

