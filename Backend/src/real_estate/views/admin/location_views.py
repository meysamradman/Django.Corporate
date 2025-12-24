from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django.core.cache import cache

from src.real_estate.models.location import Province, City, District, Country, Region
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
                fields = ['id', 'public_id', 'name', 'code', 'country_name', 'is_active']
        
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
        """Get regions for a specific city"""
        city = self.get_object()
        cache_key = f'real_estate_city_{city.id}_regions'
        cached_data = cache.get(cache_key)
        
        if cached_data:
            return APIResponse.success(
                message="منطقه‌ها با موفقیت دریافت شدند",
                data=cached_data
            )
        
        regions = Region.objects.filter(city=city, is_active=True).order_by('name')
        data = [{'id': region.id, 'name': region.name} for region in regions]
        
        cache.set(cache_key, data, 3600)
        
        return APIResponse.success(
            message="منطقه‌ها با موفقیت دریافت شدند",
            data=data
        )
    
    def get_serializer_class(self):
        from rest_framework import serializers
        
        class CitySerializer(serializers.ModelSerializer):
            province_name = serializers.CharField(source='province.name', read_only=True)
            province_id = serializers.IntegerField(source='province.id', read_only=True)
            
            class Meta:
                model = City
                fields = ['id', 'public_id', 'name', 'code', 'province_id', 'province_name', 'is_active']
        
        return CitySerializer


class RealEstateRegionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Real Estate Regions (read-only)
    """
    queryset = Region.objects.filter(is_active=True).select_related('city', 'city__province', 'city__province__country').order_by('city__name', 'name')
    permission_classes = [IsAuthenticated]
    pagination_class = StandardLimitPagination
    
    def get_queryset(self):
        queryset = super().get_queryset()
        city_id = self.request.query_params.get('city_id')
        if city_id:
            queryset = queryset.filter(city_id=city_id)
        return queryset
    
    def list(self, request, *args, **kwargs):
        city_id = request.query_params.get('city_id')
        cache_key = f'real_estate_regions_city_{city_id or "all"}'
        cached_data = cache.get(cache_key)
        
        if cached_data:
            return APIResponse.success(
                message="منطقه‌ها با موفقیت دریافت شدند",
                data=cached_data
            )
        
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        data = serializer.data
        
        cache.set(cache_key, data, 3600)
        
        return APIResponse.success(
            message="منطقه‌ها با موفقیت دریافت شدند",
            data=data
        )
    
    def get_serializer_class(self):
        from rest_framework import serializers
        
        class RegionSerializer(serializers.ModelSerializer):
            city_name = serializers.CharField(source='city.name', read_only=True)
            city_id = serializers.IntegerField(source='city.id', read_only=True)
            province_name = serializers.CharField(source='city.province.name', read_only=True)
            province_id = serializers.IntegerField(source='city.province.id', read_only=True)
            
            class Meta:
                model = Region
                fields = ['id', 'public_id', 'name', 'city_id', 'city_name', 'province_id', 'province_name', 'latitude', 'longitude', 'is_active']
        
        return RegionSerializer


class RealEstateDistrictViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Real Estate Districts (read-only)
    """
    queryset = District.objects.filter(is_active=True).select_related('region', 'region__city', 'region__city__province', 'region__city__province__country').order_by('region__city__name', 'name')
    permission_classes = [IsAuthenticated]
    pagination_class = StandardLimitPagination
    
    def get_queryset(self):
        queryset = super().get_queryset()
        city_id = self.request.query_params.get('city_id')
        region_id = self.request.query_params.get('region_id')
        if city_id:
            queryset = queryset.filter(region__city_id=city_id)
        if region_id:
            queryset = queryset.filter(region_id=region_id)
        return queryset
    
    def list(self, request, *args, **kwargs):
        city_id = request.query_params.get('city_id')
        region_id = request.query_params.get('region_id')
        cache_key = f'real_estate_districts_city_{city_id or "all"}_region_{region_id or "all"}'
        cached_data = cache.get(cache_key)
        
        if cached_data:
            return APIResponse.success(
                message="محله‌ها با موفقیت دریافت شدند",
                data=cached_data
            )
        
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        data = serializer.data
        
        cache.set(cache_key, data, 3600)
        
        return APIResponse.success(
            message="محله‌ها با موفقیت دریافت شدند",
            data=data
        )
    
    @action(detail=False, methods=['get'], url_path='reverse-geocode')
    def reverse_geocode(self, request):
        """
        Find nearest Region and District based on latitude and longitude.
        Query params: ?latitude=35.6892&longitude=51.3890
        """
        latitude = request.query_params.get('latitude')
        longitude = request.query_params.get('longitude')
        
        if not latitude or not longitude:
            return APIResponse.error(
                message="latitude و longitude الزامی است",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            lat = Decimal(latitude)
            lng = Decimal(longitude)
        except (ValueError, TypeError):
            return APIResponse.error(
                message="latitude و longitude باید عدد معتبر باشند",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        # Find districts with lat/lng within reasonable range (±0.1 degree ≈ 11km)
        # Using simple distance calculation (Haversine approximation)
        districts = District.objects.filter(
            is_active=True,
            latitude__isnull=False,
            longitude__isnull=False
        ).select_related('region', 'region__city', 'region__city__province', 'region__city__province__country')
        
        # Filter by approximate bounding box for performance (smaller range for accuracy)
        lat_range = Decimal('0.01')  # ~1km - برای دقت بیشتر
        lng_range = Decimal('0.01')
        districts = districts.filter(
            latitude__gte=lat - lat_range,
            latitude__lte=lat + lat_range,
            longitude__gte=lng - lng_range,
            longitude__lte=lng + lng_range
        )
        
        # Calculate distance and find nearest
        def haversine_distance(lat1, lon1, lat2, lon2):
            """Calculate distance in kilometers using Haversine formula"""
            R = 6371  # Earth radius in km
            lat1_rad = math.radians(float(lat1))
            lat2_rad = math.radians(float(lat2))
            delta_lat = math.radians(float(lat2) - float(lat1))
            delta_lon = math.radians(float(lon2) - float(lon1))
            
            a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon/2)**2
            c = 2 * math.asin(math.sqrt(a))
            return R * c
        
        nearest_district = None
        min_distance = float('inf')
        DISTANCE_THRESHOLD = 0.1  # 100 متر - اگر کمتر از این فاصله باشد، همان district را استفاده می‌کنیم
        
        for district in districts:
            if district.latitude and district.longitude:
                distance = haversine_distance(lat, lng, district.latitude, district.longitude)
                if distance < min_distance:
                    min_distance = distance
                    nearest_district = district
        
        # اگر district نزدیک پیدا شد (کمتر از 100 متر)، همان را برمی‌گردانیم
        if nearest_district and min_distance < DISTANCE_THRESHOLD:
            serializer = self.get_serializer(nearest_district)
            return APIResponse.success(
                message="محله موجود یافت شد",
                data={
                    'district': serializer.data,
                    'region': {
                        'id': nearest_district.region.id,
                        'public_id': str(nearest_district.region.public_id),
                        'name': nearest_district.region.name,
                        'city_id': nearest_district.region.city.id,
                        'city_name': nearest_district.region.city.name,
                        'province_id': nearest_district.region.city.province.id,
                        'province_name': nearest_district.region.city.province.name,
                    },
                    'distance_km': round(min_distance, 2),
                    'is_existing': True
                }
            )
        
        # اگر district نزدیک پیدا نشد، فقط نیاز به اطلاعات را برمی‌گردانیم
        # district هنگام ذخیره Property ایجاد می‌شود (نه اینجا)
        city_id = request.query_params.get('city_id')
        region_name = request.query_params.get('region_name')  # نام منطقه از frontend (اختیاری)
        district_name = request.query_params.get('district_name')  # نام محله از frontend (اختیاری)
        
        # اگر region_name و district_name ارسال شده، فقط بررسی می‌کنیم که آیا district موجود است
        if city_id and region_name and district_name:
            from src.real_estate.models.location import City, Region
            try:
                city = City.objects.get(id=city_id, is_active=True)
                
                # بررسی آیا region با همین نام در این شهر وجود دارد
                try:
                    region = Region.objects.get(city=city, name=region_name, is_active=True)
                    
                    # بررسی آیا district با همین نام در این region وجود دارد
                    try:
                        district = District.objects.get(region=region, name=district_name, is_active=True)
                        # district موجود است
                        serializer = self.get_serializer(district)
                        return APIResponse.success(
                            message="محله موجود یافت شد",
                            data={
                                'district': serializer.data,
                                'region': {
                                    'id': region.id,
                                    'public_id': str(region.public_id),
                                    'name': region.name,
                                    'city_id': city.id,
                                    'city_name': city.name,
                                    'province_id': city.province.id,
                                    'province_name': city.province.name,
                                },
                                'distance_km': 0,
                                'is_existing': True
                            }
                        )
                    except District.DoesNotExist:
                        # district موجود نیست - باید هنگام ذخیره Property ایجاد شود
                        pass
                except Region.DoesNotExist:
                    # region موجود نیست - باید هنگام ذخیره Property ایجاد شود
                    pass
            except City.DoesNotExist:
                return APIResponse.error(
                    message="شهر یافت نشد",
                    status_code=status.HTTP_404_NOT_FOUND
                )
        
        # اگر district نزدیک پیدا نشد و اطلاعات کافی برای ایجاد وجود ندارد
        return APIResponse.success(
            message="محله‌ای در نزدیکی این مختصات یافت نشد. هنگام ذخیره ملک، منطقه و محله ایجاد می‌شود.",
            data={
                'district': None, 
                'region': None, 
                'needs_info': True,
                'note': 'منطقه و محله هنگام ذخیره ملک ایجاد می‌شوند'
            }
        )
    
    def get_serializer_class(self):
        from rest_framework import serializers
        
        class DistrictSerializer(serializers.ModelSerializer):
            region_name = serializers.CharField(source='region.name', read_only=True)
            region_id = serializers.IntegerField(source='region.id', read_only=True)
            city_name = serializers.CharField(source='region.city.name', read_only=True)
            city_id = serializers.IntegerField(source='region.city.id', read_only=True)
            province_name = serializers.CharField(source='region.city.province.name', read_only=True)
            province_id = serializers.IntegerField(source='region.city.province.id', read_only=True)
            
            class Meta:
                model = District
                fields = ['id', 'public_id', 'name', 'region_id', 'region_name', 'city_id', 'city_name', 'province_id', 'province_name', 'latitude', 'longitude', 'is_active']
        
        return DistrictSerializer

