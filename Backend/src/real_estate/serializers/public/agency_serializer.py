from rest_framework import serializers

from src.real_estate.models.agency import RealEstateAgency


class RealEstateAgencyPublicBriefSerializer(serializers.ModelSerializer):
    """Brief agency info for use in agent serializers"""
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
    """Public list serializer for real estate agencies"""
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
    """Public detail serializer for real estate agencies"""
    agents = serializers.SerializerMethodField()
    social_links = serializers.JSONField(read_only=True, allow_null=True)

    class Meta(RealEstateAgencyPublicListSerializer.Meta):
        fields = RealEstateAgencyPublicListSerializer.Meta.fields + [
            'agents',
            'license_expire_date',
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
