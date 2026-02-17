from rest_framework import serializers

from src.real_estate.models.agency import RealEstateAgency

class RealEstateAgencyPublicBriefSerializer(serializers.ModelSerializer):

    province_name = serializers.CharField(source='province.name', read_only=True, allow_null=True)
    city_name = serializers.CharField(source='city.name', read_only=True, allow_null=True)
    logo = serializers.SerializerMethodField()

    class Meta:
        model = RealEstateAgency
        fields = [
            'id',
            'public_id',
            'name',
            'slug',
            'phone',
            'email',
            'website',
            'province_name',
            'city_name',
            'logo',
            'rating',
        ]

    def get_logo(self, obj):
        try:
            if obj.profile_picture and obj.profile_picture.file:
                return obj.profile_picture.file.url
        except Exception:
            pass
        return None

class RealEstateAgencyPublicListSerializer(serializers.ModelSerializer):

    province_name = serializers.CharField(source='province.name', read_only=True, allow_null=True)
    city_name = serializers.CharField(source='city.name', read_only=True, allow_null=True)
    logo = serializers.SerializerMethodField()
    total_agents = serializers.IntegerField(source='agent_count', read_only=True, default=0)
    total_properties = serializers.IntegerField(source='property_count', read_only=True, default=0)

    class Meta:
        model = RealEstateAgency
        fields = [
            'id',
            'public_id',
            'name',
            'slug',
            'license_number',
            'phone',
            'email',
            'website',
            'province_id',
            'province_name',
            'city_id',
            'city_name',
            'address',
            'logo',
            'rating',
            'total_reviews',
            'description',
            'total_agents',
            'total_properties',
            'created_at',
            'updated_at',
        ]

    def get_logo(self, obj):
        try:
            if obj.profile_picture and obj.profile_picture.file:
                return obj.profile_picture.file.url
        except Exception:
            pass
        return None

class RealEstateAgencyPublicDetailSerializer(RealEstateAgencyPublicListSerializer):

    agents = serializers.SerializerMethodField()
    social_media = serializers.SerializerMethodField()
    social_links = serializers.SerializerMethodField()

    class Meta(RealEstateAgencyPublicListSerializer.Meta):
        fields = RealEstateAgencyPublicListSerializer.Meta.fields + [
            'agents',
            'license_expire_date',
            'social_media',
            'social_links',
            'meta_title',
            'meta_description',
            'og_title',
            'og_description',
        ]

    def get_agents(self, obj):
        from src.real_estate.serializers.public.agent_serializer import PropertyAgentPublicListSerializer

        active_agents = obj.agents.filter(is_active=True).select_related(
            'user',
            'user__admin_profile',
            'profile_picture',
        ).order_by('-rating', '-total_sales')[:10]

        return PropertyAgentPublicListSerializer(active_agents, many=True).data

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
