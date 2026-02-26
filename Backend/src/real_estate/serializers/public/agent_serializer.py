from rest_framework import serializers
from src.real_estate.models.agent import PropertyAgent
from src.real_estate.serializers.public.agency_serializer import RealEstateAgencyPublicBriefSerializer

class PropertyAgentPublicListSerializer(serializers.ModelSerializer):

    user_name = serializers.SerializerMethodField()
    first_name = serializers.SerializerMethodField()
    last_name = serializers.SerializerMethodField()
    user_email = serializers.EmailField(source='user.email', read_only=True)
    agency_name = serializers.CharField(source='agency.name', read_only=True, allow_null=True)
    city_name = serializers.SerializerMethodField()
    province_name = serializers.SerializerMethodField()
    profile_picture = serializers.SerializerMethodField()
    phone = serializers.CharField(source='user.mobile', read_only=True, allow_null=True)
    property_count = serializers.IntegerField(read_only=True, default=0)
    
    class Meta:
        model = PropertyAgent
        fields = [
            'id', 'public_id', 'user_id', 'user_name', 'first_name', 'last_name',
            'user_email', 'agency_id', 'agency_name',
            'license_number', 'slug', 'specialization',
            'profile_picture', 'is_verified', 'show_in_team', 'team_order', 'rating',
            'total_sales', 'total_reviews', 'bio',
            'phone', 'email', 'property_count',
            'city_name', 'province_name',
            'created_at', 'updated_at'
        ]
    
    def get_user_name(self, obj):
        try:
            if obj.user and hasattr(obj.user, 'admin_profile'):
                profile = obj.user.admin_profile
                full_name = f"{profile.first_name} {profile.last_name}".strip()
                return full_name if full_name else obj.user.email
            return obj.user.email if obj.user else "نامشخص"
        except Exception:
            return "نامشخص"
    
    def get_first_name(self, obj):
        try:
            if obj.user and hasattr(obj.user, 'admin_profile'):
                return obj.user.admin_profile.first_name or ""
        except Exception:
            pass
        return ""
    
    def get_last_name(self, obj):
        try:
            if obj.user and hasattr(obj.user, 'admin_profile'):
                return obj.user.admin_profile.last_name or ""
        except Exception:
            pass
        return ""
    
    def get_city_name(self, obj):
        try:
            if obj.user and hasattr(obj.user, 'admin_profile'):
                profile = obj.user.admin_profile
                if profile.city:
                    return profile.city.name
        except Exception:
            pass
        return None
    
    def get_province_name(self, obj):
        try:
            if obj.user and hasattr(obj.user, 'admin_profile'):
                profile = obj.user.admin_profile
                if profile.province:
                    return profile.province.name
        except Exception:
            pass
        return None
    
    def get_profile_picture(self, obj):
        try:
            if obj.profile_picture and obj.profile_picture.file:
                return obj.profile_picture.file.url
            if obj.user and hasattr(obj.user, 'admin_profile'):
                profile = obj.user.admin_profile
                if profile.profile_picture and profile.profile_picture.file:
                    return profile.profile_picture.file.url
        except Exception:
            pass
        return None

class PropertyAgentPublicDetailSerializer(PropertyAgentPublicListSerializer):

    agency = RealEstateAgencyPublicBriefSerializer(read_only=True)
    social_media = serializers.SerializerMethodField()
    social_links = serializers.SerializerMethodField()
    
    class Meta(PropertyAgentPublicListSerializer.Meta):
        fields = PropertyAgentPublicListSerializer.Meta.fields + [
            'agency', 'license_expire_date', 'social_media', 'social_links',
            'meta_title', 'meta_description', 'og_title', 'og_description'
        ]

    def get_social_media(self, obj):
        links = []
        for item in obj.social_media.filter(is_active=True).order_by('order', '-created_at'):
            icon_url = item.icon.file.url if item.icon and item.icon.file else None
            links.append({
                'id': item.id,
                'public_id': str(item.public_id),
                'name': item.name,
                'url': item.url,
                'icon_url': icon_url,
                'order': item.order,
            })
        return links

    def get_social_links(self, obj):
        output = {}
        for item in obj.social_media.filter(is_active=True).only('name', 'url'):
            key = (item.name or '').strip().lower()
            if key:
                output[key] = item.url
        return output
