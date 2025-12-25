from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django.core.cache import cache

from src.real_estate.models.location import Province, City, CityRegion, Country
from rest_framework.response import Response
from django.db.models import Q, F
from decimal import Decimal
import math
from src.core.responses.response import APIResponse
from src.core.pagination.pagination import StandardLimitPagination


class RealEstateProvinceViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Real Estate Provinces (read-only)
    """
    queryset = Province.objects.filter(is_active=True).select_related('country').order_by('country__name', 'name')
    permission_classes = [IsAuthenticated]
    pagination_class = StandardLimitPagination
    
    def list(self, request, *args, **kwargs):
        cache_key = 'real_estate_active_provinces'
        cached_data = cache.get(cache_key)
        
        if cached_data:
            return APIResponse.success(
                message="استان‌ها با موفقیت دریافت شدند",
                data=cached_data
            )
        
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        data = serializer.data
        
        cache.set(cache_key, data, 3600)  # Cache for 1 hour
        
        return APIResponse.success(
            message="استان‌ها با موفقیت دریافت شدند",
            data=data
        )
    
    @action(detail=True, methods=['get'], url_path='cities')
    def cities(self, request, pk=None):
        """Get cities for a specific province"""
        province = self.get_object()
        cache_key = f'real_estate_province_{province.id}_cities'
        cached_data = cache.get(cache_key)
        
        if cached_data:
            return APIResponse.success(
                message="شهرها با موفقیت دریافت شدند",
                data=cached_data
            )
        
        cities = City.objects.filter(province=province, is_active=True).order_by('name')
        data = [{'id': city.id, 'name': city.name, 'code': city.code} for city in cities]
        
        cache.set(cache_key, data, 3600)
        
        return APIResponse.success(
            message="شهرها با موفقیت دریافت شدند",
            data=data
        )
    
    def get_serializer_class(self):
        from rest_framework import serializers
        
        class ProvinceSerializer(serializers.ModelSerializer):
            country_name = serializers.CharField(source='country.name', read_only=True)
            
            class Meta:
                model = Province
                fields = ['id', 'public_id', 'name', 'code', 'country_name', 'latitude', 'longitude', 'is_active']
        
        return ProvinceSerializer


class RealEstateCityViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Real Estate Cities (read-only)
    """
    queryset = City.objects.filter(is_active=True).select_related('province', 'province__country').order_by('province__name', 'name')
    permission_classes = [IsAuthenticated]
    pagination_class = StandardLimitPagination
    
    def get_queryset(self):
        queryset = super().get_queryset()
        province_id = self.request.query_params.get('province_id')
        if province_id:
            queryset = queryset.filter(province_id=province_id)
        return queryset
    
    def list(self, request, *args, **kwargs):
        province_id = request.query_params.get('province_id')
        cache_key = f'real_estate_cities_province_{province_id or "all"}'
        cached_data = cache.get(cache_key)
        
        if cached_data:
            return APIResponse.success(
                message="شهرها با موفقیت دریافت شدند",
                data=cached_data
            )
        
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        data = serializer.data
        
        cache.set(cache_key, data, 3600)
        
        return APIResponse.success(
            message="شهرها با موفقیت دریافت شدند",
            data=data
        )
    
    @action(detail=True, methods=['get'], url_path='regions')
    def regions(self, request, pk=None):
        """Get city regions for a specific city (only for major cities)"""
        city = self.get_object()
        cache_key = f'real_estate_city_{city.id}_city_regions'
        cached_data = cache.get(cache_key)

        if cached_data:
            return APIResponse.success(
                message="مناطق شهری با موفقیت دریافت شدند",
                data=cached_data
            )

        regions = CityRegion.objects.filter(city=city, is_active=True).order_by('code')
        data = [{
            'id': region.id,
            'code': region.code,
            'name': region.name
        } for region in regions]

        cache.set(cache_key, data, 3600)

        return APIResponse.success(
            message="مناطق شهری با موفقیت دریافت شدند",
            data=data
        )
    
    def get_serializer_class(self):
        from rest_framework import serializers
        
        class CitySerializer(serializers.ModelSerializer):
            province_name = serializers.CharField(source='province.name', read_only=True)
            province_id = serializers.IntegerField(source='province.id', read_only=True)
            
            class Meta:
                model = City
                fields = ['id', 'public_id', 'name', 'code', 'province_id', 'province_name', 'latitude', 'longitude', 'is_active']
        
        return CitySerializer


class RealEstateCityRegionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Real Estate City Regions (read-only) - simplified like Diwar
    Only for major cities like Tehran (regions 1-22)
    """
    queryset = CityRegion.objects.filter(is_active=True).select_related('city', 'city__province').order_by('city', 'code')
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        city_id = self.request.query_params.get('city_id')
        if city_id:
            queryset = queryset.filter(city_id=city_id)
        return queryset

    def list(self, request, *args, **kwargs):
        city_id = request.query_params.get('city_id')

        cache_key = f'real_estate_city_regions_{city_id or "all"}'
        cached_data = cache.get(cache_key)

        if cached_data:
            return APIResponse.success(
                message="مناطق شهری با موفقیت دریافت شدند",
                data=cached_data
            )

        queryset = self.get_queryset()
        data = [{
            'id': region.id,
            'code': region.code,
            'name': region.name,
            'city_id': region.city_id,
            'city_name': region.city.name,
        } for region in queryset]

        cache.set(cache_key, data, 3600)  # 1 hour

        return APIResponse.success(
            message="مناطق شهری با موفقیت دریافت شدند",
            data=data
        )


# دیگه District ViewSet لازم نیست - منطق ساده شده

