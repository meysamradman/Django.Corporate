from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from src.real_estate.models.agency import RealEstateAgency
from src.real_estate.models.agency_social_media import RealEstateAgencySocialMedia
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
    class SocialMediaSerializer(serializers.ModelSerializer):
        icon_url = serializers.SerializerMethodField()

        class Meta:
            model = RealEstateAgencySocialMedia
            fields = ['id', 'public_id', 'name', 'url', 'icon', 'icon_url', 'order']

        def get_icon_url(self, obj):
            if obj.icon and obj.icon.file:
                return obj.icon.file.url
            return None

    province_name = serializers.CharField(source='province.name', read_only=True)
    city_name = serializers.CharField(source='city.name', read_only=True)
    property_count = serializers.IntegerField(read_only=True)
    agent_count = serializers.IntegerField(read_only=True)
    profile_picture = MediaAdminSerializer(read_only=True)
    social_media = SocialMediaSerializer(many=True, read_only=True)
    
    class Meta:
        model = RealEstateAgency
        fields = [
            'id', 'public_id', 'name', 'slug', 'license_number', 'license_expire_date',
            'phone', 'email', 'website',
            'province', 'province_name', 'city', 'city_name', 'address',
            'profile_picture',
            'property_count', 'agent_count',
            'rating', 'total_reviews',
            'description', 'social_media', 'is_active',
            'created_at', 'updated_at',
            'meta_title', 'meta_description', 'og_title', 'og_description',
            'canonical_url', 'robots_meta'
        ]
        read_only_fields = ['id', 'public_id', 'created_at', 'updated_at']

class RealEstateAgencyAdminCreateSerializer(serializers.ModelSerializer):
    slug = serializers.SlugField(required=False, allow_blank=True, allow_null=True)
    email = serializers.EmailField(required=False, allow_blank=True, allow_null=True)
    website = serializers.URLField(required=False, allow_blank=True, allow_null=True)
    address = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    description = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    social_media = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        allow_null=True,
        write_only=True
    )

    class Meta:
        model = RealEstateAgency
        fields = [
            'name', 'slug', 'license_number', 'license_expire_date',
            'phone', 'email', 'website',
            'province', 'city', 'address',
            'profile_picture',
            'social_media',
            'rating', 'total_reviews',
            'description', 'is_active',
            'meta_title', 'meta_description', 'og_title', 'og_description',
            'canonical_url', 'robots_meta'
        ]
        extra_kwargs = {
            'name': {
                'error_messages': {
                    'blank': AGENCY_ERRORS["agency_name_required"],
                    'null': AGENCY_ERRORS["agency_name_required"],
                    'required': AGENCY_ERRORS["agency_name_required"],
                }
            },
            'phone': {
                'error_messages': {
                    'blank': AGENCY_ERRORS["agency_phone_required"],
                    'null': AGENCY_ERRORS["agency_phone_required"],
                    'required': AGENCY_ERRORS["agency_phone_required"],
                }
            },
        }

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
            return value
        if RealEstateAgency.objects.filter(slug=value).exists():
            raise serializers.ValidationError(AGENCY_ERRORS["slug_exists"])
        return value

    def validate(self, attrs):
        nullable_string_fields = ['email', 'website', 'address', 'description', 'slug']
        for field in nullable_string_fields:
            if attrs.get(field) is None:
                attrs[field] = ''

        if attrs.get('slug', '') == '':
            attrs.pop('slug', None)

        if attrs.get('social_media') is None:
            attrs.pop('social_media', None)

        return attrs
    
    def validate_license_number(self, value):
        if RealEstateAgency.objects.filter(license_number=value).exists():
            raise serializers.ValidationError(AGENCY_ERRORS["license_number_exists"])
        return value

class RealEstateAgencyAdminUpdateSerializer(serializers.ModelSerializer):
    slug = serializers.SlugField(required=False, allow_blank=True, allow_null=True)
    email = serializers.EmailField(required=False, allow_blank=True, allow_null=True)
    website = serializers.URLField(required=False, allow_blank=True, allow_null=True)
    address = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    description = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    social_media = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        allow_null=True,
        write_only=True
    )

    class Meta:
        model = RealEstateAgency
        fields = [
            'name', 'slug', 'license_number', 'license_expire_date',
            'phone', 'email', 'website',
            'province', 'city', 'address',
            'profile_picture',
            'social_media',
            'rating', 'total_reviews',
            'description', 'is_active',
            'meta_title', 'meta_description', 'og_title', 'og_description',
            'canonical_url', 'robots_meta'
        ]
        extra_kwargs = {
            'name': {
                'error_messages': {
                    'blank': AGENCY_ERRORS["agency_name_required"],
                    'null': AGENCY_ERRORS["agency_name_required"],
                    'required': AGENCY_ERRORS["agency_name_required"],
                }
            },
            'phone': {
                'error_messages': {
                    'blank': AGENCY_ERRORS["agency_phone_required"],
                    'null': AGENCY_ERRORS["agency_phone_required"],
                    'required': AGENCY_ERRORS["agency_phone_required"],
                }
            },
        }

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
            return value
        if RealEstateAgency.objects.exclude(id=self.instance.id).filter(slug=value).exists():
            raise serializers.ValidationError(AGENCY_ERRORS["slug_exists"])
        return value

    def validate(self, attrs):
        nullable_string_fields = ['email', 'website', 'address', 'description', 'slug']
        for field in nullable_string_fields:
            if attrs.get(field) is None:
                attrs[field] = ''

        if attrs.get('slug', '') == '':
            attrs.pop('slug', None)

        if attrs.get('social_media') is None:
            attrs.pop('social_media', None)

        return attrs
    
    def validate_license_number(self, value):
        if RealEstateAgency.objects.exclude(id=self.instance.id).filter(license_number=value).exists():
            raise serializers.ValidationError(AGENCY_ERRORS["license_number_exists"])
        return value

class RealEstateAgencyAdminSerializer(RealEstateAgencyAdminDetailSerializer):
    pass

