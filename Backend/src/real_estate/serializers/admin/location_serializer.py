"""
Serializers for Real Estate Location Models
استان‌ها، شهرها و مناطق شهری برای املاک
"""
from rest_framework import serializers
from src.core.models import Province, City
from src.real_estate.models.location import CityRegion


class RealEstateProvinceSerializer(serializers.ModelSerializer):
    """
    Serializer for Province (استان) - برای املاک
    """
    country_name = serializers.CharField(source='country.name', read_only=True)
    cities_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Province
        fields = ['id', 'name', 'code', 'country_name', 'cities_count']
        read_only_fields = ['id']
    
    def get_cities_count(self, obj):
        """تعداد شهرهای فعال استان"""
        return obj.cities.filter(is_active=True).count()


class RealEstateCitySerializer(serializers.ModelSerializer):
    """
    Serializer for City (شهر) - برای املاک
    """
    province_name = serializers.CharField(source='province.name', read_only=True)
    province_id = serializers.IntegerField(source='province.id', read_only=True)
    has_regions = serializers.SerializerMethodField()
    
    class Meta:
        model = City
        fields = [
            'id', 'name', 'code', 
            'province_id', 'province_name',
            'has_regions'
        ]
        read_only_fields = ['id']
    
    def get_has_regions(self, obj):
        """آیا این شهر مناطق شهری دارد؟"""
        return CityRegion.objects.filter(city=obj, is_active=True).exists()


class RealEstateCityRegionSerializer(serializers.ModelSerializer):
    """
    Serializer for City Region (منطقه شهری) - برای املاک
    فقط برای شهرهای بزرگ مثل تهران (منطقه 1 تا 22)
    """
    city_name = serializers.CharField(source='city.name', read_only=True)
    city_id = serializers.IntegerField(source='city.id', read_only=True)
    province_name = serializers.CharField(source='city.province.name', read_only=True)
    
    class Meta:
        model = CityRegion
        fields = [
            'id', 'code', 'name',
            'city_id', 'city_name',
            'province_name'
        ]
        read_only_fields = ['id']


class RealEstateCitySimpleSerializer(serializers.ModelSerializer):
    """
    Serializer ساده برای City - برای استفاده در لیست‌ها
    """
    class Meta:
        model = City
        fields = ['id', 'name', 'code']
        read_only_fields = ['id']


class RealEstateCityRegionSimpleSerializer(serializers.ModelSerializer):
    """
    Serializer ساده برای City Region - برای استفاده در لیست‌ها
    """
    class Meta:
        model = CityRegion
        fields = ['id', 'code', 'name']
        read_only_fields = ['id']
