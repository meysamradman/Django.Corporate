
from rest_framework import serializers
from src.core.models import Province, City
from src.real_estate.models.location import CityRegion

class RealEstateProvinceSerializer(serializers.ModelSerializer):
    
    country_name = serializers.CharField(source='country.name', read_only=True)
    cities_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Province
        fields = ['id', 'public_id', 'name', 'code', 'country_name', 'cities_count', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id']
    
    def get_cities_count(self, obj):
        
        return obj.cities.filter(is_active=True).count()

class RealEstateCitySerializer(serializers.ModelSerializer):
    
    province_name = serializers.CharField(source='province.name', read_only=True)
    province_id = serializers.IntegerField(source='province.id', read_only=True)
    has_regions = serializers.SerializerMethodField()
    property_count = serializers.SerializerMethodField()
    
    class Meta:
        model = City
        fields = [
            'id', 'public_id', 'name', 'code', 
            'province_id', 'province_name',
            'has_regions', 'property_count',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id']
    
    def get_has_regions(self, obj):
        
        return CityRegion.objects.filter(city=obj, is_active=True).exists()

    def get_property_count(self, obj):
        return getattr(obj, 'property_count', 0)

class RealEstateCityRegionSerializer(serializers.ModelSerializer):
    
    city_name = serializers.CharField(source='city.name', read_only=True)
    city_id = serializers.IntegerField(source='city.id', read_only=True)
    province_id = serializers.IntegerField(source='city.province.id', read_only=True)
    province_name = serializers.CharField(source='city.province.name', read_only=True)
    
    class Meta:
        model = CityRegion
        fields = [
            'id', 'public_id', 'code', 'name',
            'city_id', 'city_name',
            'province_id', 'province_name',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id']

class RealEstateCitySimpleSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = City
        fields = ['id', 'name', 'code']
        read_only_fields = ['id']

class RealEstateCityRegionSimpleSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = CityRegion
        fields = ['id', 'code', 'name']
        read_only_fields = ['id']


class RealEstateProvinceCreateUpdateSerializer(serializers.ModelSerializer):

    class Meta:
        model = Province
        fields = ['id', 'name', 'code']
        read_only_fields = ['id']


class RealEstateCityCreateUpdateSerializer(serializers.ModelSerializer):

    province_id = serializers.PrimaryKeyRelatedField(
        source='province',
        queryset=Province.objects.filter(is_active=True),
        write_only=True,
    )

    class Meta:
        model = City
        fields = ['id', 'name', 'code', 'province_id']
        read_only_fields = ['id']


class RealEstateCityRegionCreateUpdateSerializer(serializers.ModelSerializer):

    city_id = serializers.PrimaryKeyRelatedField(
        source='city',
        queryset=City.objects.filter(is_active=True),
        write_only=True,
    )

    class Meta:
        model = CityRegion
        fields = ['id', 'name', 'code', 'city_id']
        read_only_fields = ['id']
