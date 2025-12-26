from rest_framework import serializers
from src.real_estate.models.agent import PropertyAgent
from src.real_estate.models.agency import RealEstateAgency
from src.real_estate.models.location import City, Province
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
    province = serializers.SerializerMethodField()
    province_name = serializers.SerializerMethodField()
    property_count = serializers.IntegerField(read_only=True)
    avatar = MediaAdminSerializer(read_only=True)
    cover_image = MediaAdminSerializer(read_only=True)
    
    class Meta:
        model = PropertyAgent
        fields = [
            'id', 'public_id', 'user', 'first_name', 'last_name', 'full_name',
            'phone', 'email', 'whatsapp', 'telegram',
            'license_number', 'slug', 'agency', 'city', 'city_name',
            'province', 'province_name',
            'address', 'latitude', 'longitude',
            'avatar', 'cover_image', 'property_count',
            'is_verified', 'rating', 'total_sales', 'total_reviews',
            'experience_years', 'specialization', 'bio',
            'is_active', 'created_at', 'updated_at',
            'meta_title', 'meta_description', 'og_title', 'og_description',
            'canonical_url', 'robots_meta'
        ]
        read_only_fields = ['id', 'public_id', 'created_at', 'updated_at']

    def get_province(self, obj):
        try:
            return obj.city.province.id if obj.city and obj.city.province else None
        except Exception:
            return None

    def get_province_name(self, obj):
        try:
            return obj.city.province.name if obj.city and obj.city.province else None
        except Exception:
            return None


class PropertyAgentAdminCreateSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(write_only=True)
    province = serializers.PrimaryKeyRelatedField(
        queryset=Province.objects.all(),
        required=False,
        allow_null=True,
        help_text="Province (optional; selected from dropdown)"
    )
    
    class Meta:
        model = PropertyAgent
        fields = [
            'user_id', 'agency', 'first_name', 'last_name',
            'phone', 'email', 'whatsapp', 'telegram',
            'license_number', 'slug', 'city',
            'province',
            'address', 'latitude', 'longitude',
            'avatar', 'cover_image',
            'is_verified', 'rating', 'total_sales', 'total_reviews',
            'experience_years', 'specialization', 'bio',
            'is_active',
            'meta_title', 'meta_description', 'og_title', 'og_description',
            'canonical_url', 'robots_meta'
        ]
    
    def validate_user_id(self, value):
        """Validate that user is an admin user"""
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        try:
            user = User.objects.get(id=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("کاربر یافت نشد.")
        
        user_type = getattr(user, 'user_type', None)
        is_staff = getattr(user, 'is_staff', False)
        is_admin_active = getattr(user, 'is_admin_active', False)
        
        if user_type != 'admin' or not is_staff or not is_admin_active:
            raise serializers.ValidationError(AGENT_ERRORS["user_must_be_admin"])
        
        return value
    
    def validate_license_number(self, value):
        if PropertyAgent.objects.filter(license_number=value).exists():
            raise serializers.ValidationError(AGENT_ERRORS["license_number_exists"])
        return value

    def validate(self, attrs):
        # If both province and city provided, ensure city belongs to province.
        province = attrs.get('province')
        city = attrs.get('city')
        if province and city:
            if getattr(city, 'province_id', None) != province.id:
                raise serializers.ValidationError({
                    'city': 'شهر انتخاب‌شده متعلق به استان انتخاب‌شده نیست.'
                })
        return attrs


class PropertyAgentAdminUpdateSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(write_only=True, required=False)
    province = serializers.PrimaryKeyRelatedField(
        queryset=Province.objects.all(),
        required=False,
        allow_null=True,
        help_text="Province (optional)"
    )
    
    class Meta:
        model = PropertyAgent
        fields = [
            'user_id', 'agency', 'first_name', 'last_name',
            'phone', 'email', 'whatsapp', 'telegram',
            'license_number', 'slug', 'city',
            'province',
            'address', 'latitude', 'longitude',
            'avatar', 'cover_image',
            'is_verified', 'rating', 'total_sales', 'total_reviews',
            'experience_years', 'specialization', 'bio',
            'is_active',
            'meta_title', 'meta_description', 'og_title', 'og_description',
            'canonical_url', 'robots_meta'
        ]
    
    def validate_user_id(self, value):
        """Validate that user is an admin user"""
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        try:
            user = User.objects.get(id=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("کاربر یافت نشد.")
        
        user_type = getattr(user, 'user_type', None)
        is_staff = getattr(user, 'is_staff', False)
        is_admin_active = getattr(user, 'is_admin_active', False)
        
        if user_type != 'admin' or not is_staff or not is_admin_active:
            raise serializers.ValidationError(AGENT_ERRORS["user_must_be_admin"])
        
        return value
    
    def validate_license_number(self, value):
        if PropertyAgent.objects.exclude(id=self.instance.id).filter(license_number=value).exists():
            raise serializers.ValidationError(AGENT_ERRORS["license_number_exists"])
        return value

    def validate(self, attrs):
        province = attrs.get('province')
        city = attrs.get('city')
        if province and city:
            if getattr(city, 'province_id', None) != province.id:
                raise serializers.ValidationError({
                    'city': 'شهر انتخاب‌شده متعلق به استان انتخاب‌شده نیست.'
                })
        return attrs


class PropertyAgentAdminSerializer(PropertyAgentAdminDetailSerializer):
    pass

