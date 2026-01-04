from rest_framework import serializers
from src.real_estate.models.agent import PropertyAgent
from src.real_estate.models.agency import RealEstateAgency
from src.core.models import Province, City
from src.real_estate.messages.messages import AGENT_ERRORS
from src.media.serializers.media_serializer import MediaAdminSerializer


class RealEstateAgencySimpleAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = RealEstateAgency
        fields = ['id', 'public_id', 'name', 'slug']


class PropertyAgentAdminListSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    first_name = serializers.CharField(read_only=True, source='user.admin_profile.first_name')
    last_name = serializers.CharField(read_only=True, source='user.admin_profile.last_name')
    phone = serializers.CharField(read_only=True, source='user.mobile')
    email = serializers.EmailField(read_only=True, source='user.email')
    profile_picture_url = serializers.SerializerMethodField()
    agency = RealEstateAgencySimpleAdminSerializer(read_only=True)
    city_name = serializers.CharField(source='user.admin_profile.city.name', read_only=True)
    property_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = PropertyAgent
        fields = [
            'id', 'public_id', 'first_name', 'last_name', 'full_name',
            'phone', 'email', 'license_number', 'license_expire_date', 'slug',
            'agency', 'city_name', 'property_count',
            'is_verified', 'rating', 'total_sales', 'total_reviews',
            'profile_picture_url', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'public_id', 'created_at', 'updated_at']
    
    def get_profile_picture_url(self, obj):
        # اول از PropertyAgent خودش بخوان
        if obj.profile_picture and obj.profile_picture.file:
            return obj.profile_picture.file.url
        # اگر نبود، از AdminProfile بخوان (برای سازگاری با قبل)
        try:
            if obj.user and hasattr(obj.user, 'admin_profile'):
                profile = obj.user.admin_profile
                if profile.profile_picture and profile.profile_picture.file:
                    return profile.profile_picture.file.url
        except Exception:
            pass
        return None


class PropertyAgentAdminDetailSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    first_name = serializers.CharField(read_only=True, source='user.admin_profile.first_name')
    last_name = serializers.CharField(read_only=True, source='user.admin_profile.last_name')
    phone = serializers.CharField(read_only=True, source='user.mobile')
    email = serializers.EmailField(read_only=True, source='user.email')
    profile_picture = serializers.SerializerMethodField()
    agency = RealEstateAgencySimpleAdminSerializer(read_only=True)
    city = serializers.IntegerField(source='user.admin_profile.city.id', read_only=True)
    city_name = serializers.CharField(source='user.admin_profile.city.name', read_only=True)
    province = serializers.IntegerField(source='user.admin_profile.province.id', read_only=True)
    province_name = serializers.CharField(source='user.admin_profile.province.name', read_only=True)
    property_count = serializers.IntegerField(read_only=True)
    og_image = MediaAdminSerializer(read_only=True)
    
    class Meta:
        model = PropertyAgent
        fields = [
            'id', 'public_id', 'user', 'first_name', 'last_name', 'full_name',
            'phone', 'email',
            'license_number', 'license_expire_date', 'slug', 'agency', 'city', 'city_name',
            'province', 'province_name',
            'profile_picture', 'property_count',
            'is_verified', 'rating', 'total_sales', 'total_reviews',
            'specialization', 'bio',
            'is_active', 'created_at', 'updated_at',
            'meta_title', 'meta_description', 'og_title', 'og_description',
            'og_image', 'canonical_url', 'robots_meta'
        ]
        read_only_fields = ['id', 'public_id', 'created_at', 'updated_at']
    
    def get_profile_picture(self, obj):
        # اول از PropertyAgent خودش بخوان
        if obj.profile_picture:
            from src.media.serializers.media_serializer import MediaAdminSerializer
            return MediaAdminSerializer(obj.profile_picture).data
        # اگر نبود، از AdminProfile بخوان (برای سازگاری با قبل)
        try:
            if obj.user and hasattr(obj.user, 'admin_profile'):
                profile = obj.user.admin_profile
                if profile.profile_picture:
                    from src.media.serializers.media_serializer import MediaAdminSerializer
                    return MediaAdminSerializer(profile.profile_picture).data
        except Exception:
            pass
        return None


class PropertyAgentAdminCreateSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = PropertyAgent
        fields = [
            'user_id', 'agency',
            'license_number', 'license_expire_date', 'slug',
            'profile_picture',
            'is_verified', 'rating', 'total_sales', 'total_reviews',
            'specialization', 'bio',
            'is_active',
            'meta_title', 'meta_description', 'og_title', 'og_description',
            'og_image_id', 'canonical_url', 'robots_meta'
        ]
    
    def validate_slug(self, value):
        """Validate that slug is unique"""
        if not value:
            raise serializers.ValidationError("نامک (Slug) الزامی است.")
        if PropertyAgent.objects.filter(slug=value).exists():
            raise serializers.ValidationError("این نامک قبلاً استفاده شده است.")
        return value
    
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


class PropertyAgentAdminUpdateSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(write_only=True, required=False)
    
    class Meta:
        model = PropertyAgent
        fields = [
            'user_id', 'agency',
            'license_number', 'license_expire_date', 'slug',
            'profile_picture',
            'is_verified', 'rating', 'total_sales', 'total_reviews',
            'specialization', 'bio',
            'is_active',
            'meta_title', 'meta_description', 'og_title', 'og_description',
            'og_image_id', 'canonical_url', 'robots_meta'
        ]
    
    def validate_slug(self, value):
        """Validate that slug is unique (excluding current instance)"""
        if not value:
            raise serializers.ValidationError("نامک (Slug) الزامی است.")
        if PropertyAgent.objects.exclude(id=self.instance.id).filter(slug=value).exists():
            raise serializers.ValidationError("این نامک قبلاً استفاده شده است.")
        return value
    
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


class PropertyAgentAdminSerializer(PropertyAgentAdminDetailSerializer):
    pass

