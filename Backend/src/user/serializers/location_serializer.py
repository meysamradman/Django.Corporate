from rest_framework import serializers
from src.user.models import Province, City


class ProvinceSerializer(serializers.ModelSerializer):
    """
    سریالایزر برای استان‌ها - بهینه برای لیست و انتخاب
    """
    class Meta:
        model = Province
        fields = ['id', 'public_id', 'name', 'code', 'is_active']
        read_only_fields = ['public_id']


class ProvinceDetailSerializer(serializers.ModelSerializer):
    """
    سریالایزر کامل استان با تعداد شهرها
    """
    cities_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Province
        fields = ['id', 'public_id', 'name', 'code', 'is_active', 'cities_count', 'created_at', 'updated_at']
        read_only_fields = ['public_id']
    
    def get_cities_count(self, obj):
        return obj.cities.filter(is_active=True).count()


class CitySerializer(serializers.ModelSerializer):
    """
    سریالایزر برای شهرها - بهینه برای لیست و انتخاب
    """
    province_name = serializers.CharField(source='province.name', read_only=True)
    full_name = serializers.CharField(read_only=True)
    
    class Meta:
        model = City
        fields = ['id', 'public_id', 'name', 'code', 'province_name', 'full_name', 'is_active']
        read_only_fields = ['public_id']


class CityDetailSerializer(serializers.ModelSerializer):
    """
    سریالایزر کامل شهر با اطلاعات استان
    """
    province = ProvinceSerializer(read_only=True)
    full_name = serializers.CharField(read_only=True)
    
    class Meta:
        model = City
        fields = ['id', 'public_id', 'name', 'code', 'province', 'full_name', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['public_id']


# Compact serializers برای استفاده در Profile ها
class ProvinceCompactSerializer(serializers.ModelSerializer):
    """سریالایزر فشرده برای استان در پروفایل‌ها"""
    class Meta:
        model = Province
        fields = ['id', 'name', 'code']


class CityCompactSerializer(serializers.ModelSerializer):
    """سریالایزر فشرده برای شهر در پروفایل‌ها"""
    province_name = serializers.CharField(source='province.name', read_only=True)
    
    class Meta:
        model = City
        fields = ['id', 'name', 'code', 'province_name']