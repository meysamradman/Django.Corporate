from rest_framework import serializers
from src.core.models import Province, City

class ProvinceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Province
        fields = ['id', 'public_id', 'name', 'code', 'slug', 'is_active']
        read_only_fields = ['public_id']

class ProvinceDetailSerializer(serializers.ModelSerializer):
    cities_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Province
        fields = ['id', 'public_id', 'name', 'code', 'slug', 'is_active', 'cities_count', 'created_at', 'updated_at']
        read_only_fields = ['public_id']
    
    def get_cities_count(self, obj):
        return obj.cities.filter(is_active=True).count()

class CitySerializer(serializers.ModelSerializer):
    province_name = serializers.CharField(source='province.name', read_only=True)
    full_name = serializers.CharField(read_only=True)
    
    class Meta:
        model = City
        fields = ['id', 'public_id', 'name', 'code', 'slug', 'province_name', 'full_name', 'is_active']
        read_only_fields = ['public_id']

class CityDetailSerializer(serializers.ModelSerializer):
    province = ProvinceSerializer(read_only=True)
    full_name = serializers.CharField(read_only=True)
    
    class Meta:
        model = City
        fields = ['id', 'public_id', 'name', 'code', 'slug', 'province', 'full_name', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['public_id']

class ProvinceCompactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Province
        fields = ['id', 'name', 'code', 'slug']

class CityCompactSerializer(serializers.ModelSerializer):
    province_name = serializers.CharField(source='province.name', read_only=True)
    
    class Meta:
        model = City
        fields = ['id', 'name', 'code', 'slug', 'province_name']