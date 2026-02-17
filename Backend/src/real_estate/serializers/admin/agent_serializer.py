from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from django.db.models import Sum, Avg
from src.real_estate.models.agent import PropertyAgent
from src.real_estate.models.agent_social_media import PropertyAgentSocialMedia
from src.real_estate.models.agency import RealEstateAgency
from src.real_estate.models.statistics import AgentStatistics
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
        if obj.profile_picture and obj.profile_picture.file:
            return obj.profile_picture.file.url
        try:
            if obj.user and hasattr(obj.user, 'admin_profile'):
                profile = obj.user.admin_profile
                if profile.profile_picture and profile.profile_picture.file:
                    return profile.profile_picture.file.url
        except Exception:
            pass
        return None

class PropertyAgentAdminDetailSerializer(serializers.ModelSerializer):
    class SocialMediaSerializer(serializers.ModelSerializer):
        icon_url = serializers.SerializerMethodField()

        class Meta:
            model = PropertyAgentSocialMedia
            fields = ['id', 'public_id', 'name', 'url', 'icon', 'icon_url', 'order']

        def get_icon_url(self, obj):
            if obj.icon and obj.icon.file:
                return obj.icon.file.url
            return None

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
    total_sales_value = serializers.SerializerMethodField()
    total_commissions = serializers.SerializerMethodField()
    properties_sold = serializers.SerializerMethodField()
    properties_rented = serializers.SerializerMethodField()
    conversion_rate = serializers.SerializerMethodField()
    avg_deal_time = serializers.SerializerMethodField()
    lead_to_contract_rate = serializers.SerializerMethodField()
    failure_rate = serializers.SerializerMethodField()
    social_media = SocialMediaSerializer(many=True, read_only=True)
    
    class Meta:
        model = PropertyAgent
        fields = [
            'id', 'public_id', 'user', 'first_name', 'last_name', 'full_name',
            'phone', 'email',
            'license_number', 'license_expire_date', 'slug', 'agency', 'city', 'city_name',
            'province', 'province_name',
            'profile_picture', 'property_count',
            'is_verified', 'rating', 'total_sales', 'total_reviews',
            'total_sales_value', 'total_commissions', 'properties_sold', 'properties_rented',
            'conversion_rate', 'avg_deal_time', 'lead_to_contract_rate', 'failure_rate',
            'specialization', 'bio',
            'social_media',
            'is_active', 'created_at', 'updated_at',
            'meta_title', 'meta_description', 'og_title', 'og_description',
            'og_image', 'canonical_url', 'robots_meta'
        ]
        read_only_fields = ['id', 'public_id', 'created_at', 'updated_at']
    
    def get_profile_picture(self, obj):
        if obj.profile_picture:
            from src.media.serializers.media_serializer import MediaAdminSerializer
            return MediaAdminSerializer(obj.profile_picture).data
        try:
            if obj.user and hasattr(obj.user, 'admin_profile'):
                profile = obj.user.admin_profile
                if profile.profile_picture:
                    from src.media.serializers.media_serializer import MediaAdminSerializer
                    return MediaAdminSerializer(profile.profile_picture).data
        except Exception:
            pass
        return None

    def _get_kpi_aggregate(self, obj):
        cache_key = f"_agent_kpi_{obj.id}"
        if not hasattr(self, cache_key):
            setattr(
                self,
                cache_key,
                AgentStatistics.objects.filter(agent=obj).aggregate(
                    total_sales_value=Sum('total_sales_value'),
                    total_commissions=Sum('total_commissions'),
                    properties_sold=Sum('properties_sold'),
                    properties_rented=Sum('properties_rented'),
                    conversion_rate=Avg('conversion_rate'),
                    avg_deal_time=Avg('avg_deal_time'),
                    lead_to_contract_rate=Avg('lead_to_contract_rate'),
                    failure_rate=Avg('failure_rate'),
                )
            )
        return getattr(self, cache_key)

    def get_total_sales_value(self, obj):
        value = self._get_kpi_aggregate(obj).get('total_sales_value')
        return int(value or 0)

    def get_total_commissions(self, obj):
        value = self._get_kpi_aggregate(obj).get('total_commissions')
        return int(value or 0)

    def get_properties_sold(self, obj):
        value = self._get_kpi_aggregate(obj).get('properties_sold')
        return int(value or 0)

    def get_properties_rented(self, obj):
        value = self._get_kpi_aggregate(obj).get('properties_rented')
        return int(value or 0)

    def get_conversion_rate(self, obj):
        value = self._get_kpi_aggregate(obj).get('conversion_rate')
        return round(float(value or 0), 2)

    def get_avg_deal_time(self, obj):
        value = self._get_kpi_aggregate(obj).get('avg_deal_time')
        return int(round(float(value or 0)))

    def get_lead_to_contract_rate(self, obj):
        value = self._get_kpi_aggregate(obj).get('lead_to_contract_rate')
        return round(float(value or 0), 2)

    def get_failure_rate(self, obj):
        value = self._get_kpi_aggregate(obj).get('failure_rate')
        return round(float(value or 0), 2)

class PropertyAgentAdminCreateSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(write_only=True)
    social_media = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        write_only=True
    )
    
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

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['slug'].validators = [
            validator for validator in self.fields['slug'].validators
            if not isinstance(validator, UniqueValidator)
        ]
        self.fields['license_number'].validators = [
            validator for validator in self.fields['license_number'].validators
            if not isinstance(validator, UniqueValidator)
        ]
    
    def validate_slug(self, value):
        
        if not value:
            raise serializers.ValidationError(AGENT_ERRORS["slug_required"])
        if PropertyAgent.objects.filter(slug=value).exists():
            raise serializers.ValidationError(AGENT_ERRORS["slug_exists"])
        return value
    
    def validate_user_id(self, value):
        
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        try:
            user = User.objects.get(id=value)
        except User.DoesNotExist:
            raise serializers.ValidationError(AGENT_ERRORS["user_not_found"])
        
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
    social_media = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        write_only=True
    )
    
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

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['slug'].validators = [
            validator for validator in self.fields['slug'].validators
            if not isinstance(validator, UniqueValidator)
        ]
        self.fields['license_number'].validators = [
            validator for validator in self.fields['license_number'].validators
            if not isinstance(validator, UniqueValidator)
        ]
    
    def validate_slug(self, value):
        
        if not value:
            raise serializers.ValidationError(AGENT_ERRORS["slug_required"])
        if PropertyAgent.objects.exclude(id=self.instance.id).filter(slug=value).exists():
            raise serializers.ValidationError(AGENT_ERRORS["slug_exists"])
        return value
    
    def validate_user_id(self, value):
        
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        try:
            user = User.objects.get(id=value)
        except User.DoesNotExist:
            raise serializers.ValidationError(AGENT_ERRORS["user_not_found"])
        
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

