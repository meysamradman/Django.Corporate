from rest_framework import serializers

from src.core.models import City, Province
from src.real_estate.models.location import CityRegion


class ProvincePublicSerializer(serializers.ModelSerializer):
    property_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Province
        fields = ["id", "name", "code", "slug", "property_count"]


class CityPublicSerializer(serializers.ModelSerializer):
    province_id = serializers.IntegerField(source="province.id", read_only=True)
    province_name = serializers.CharField(source="province.name", read_only=True)
    province_slug = serializers.CharField(source="province.slug", read_only=True)

    class Meta:
        model = City
        fields = ["id", "name", "code", "slug", "province_id", "province_name", "province_slug"]


class RegionPublicSerializer(serializers.ModelSerializer):
    city_id = serializers.IntegerField(source="city.id", read_only=True)
    city_name = serializers.CharField(source="city.name", read_only=True)
    province_name = serializers.CharField(source="city.province.name", read_only=True)

    class Meta:
        model = CityRegion
        fields = ["id", "name", "code", "city_id", "city_name", "province_name"]
