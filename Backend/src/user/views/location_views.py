from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.core.cache import cache
from src.user.models import Province, City
from src.user.serializers.location_serializer import (
    ProvinceSerializer, ProvinceDetailSerializer,
    CitySerializer, CityDetailSerializer
)
from src.core.responses.response import APIResponse
from src.core.pagination.pagination import StandardLimitPagination
from src.user.messages.messages import AUTH_SUCCESS, AUTH_ERRORS


class ProvinceViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet برای استان‌ها - فقط خواندن
    API های استان برای استفاده در فرم‌ها - با pagination بهینه
    """
    queryset = Province.objects.filter(is_active=True).order_by('name')
    permission_classes = [IsAuthenticated]
    pagination_class = StandardLimitPagination
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ProvinceDetailSerializer
        return ProvinceSerializer
    
    def get_queryset(self):
        """بهینه‌سازی query ها با cache"""
        cache_key = 'active_provinces'
        provinces = cache.get(cache_key)
        
        if not provinces:
            provinces = list(Province.objects.filter(is_active=True).order_by('name').values(
                'id', 'public_id', 'name', 'code'
            ))
            cache.set(cache_key, provinces, 3600)  # 1 hour cache
        
        return Province.objects.filter(is_active=True).order_by('name')
    
    def list(self, request, *args, **kwargs):
        """لیست استان‌ها با pagination و cache بهینه"""
        # برای درخواست‌های pagination شده
        page = request.query_params.get('offset', 0)
        limit = request.query_params.get('limit', 10)
        
        cache_key = f'provinces_list_{page}_{limit}'
        cached_response = cache.get(cache_key)
        
        if cached_response:
            # Return paginated response using DRF's standard pagination response
            paginator = self.pagination_class()
            return paginator.get_paginated_response(cached_response)
        
        # استفاده از pagination کلاس والد
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)
        
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            paginated_data = {
                'count': self.paginator.count,
                'next': self.paginator.get_next_link(),
                'previous': self.paginator.get_previous_link(),
                'results': serializer.data
            }
            
            # کش کردن نتیجه
            cache.set(cache_key, paginated_data, 1800)  # 30 minutes cache
            
            # Return paginated response using DRF's standard pagination response
            return self.paginator.get_paginated_response(serializer.data)
        
        # اگر pagination نباشد
        serializer = self.get_serializer(queryset, many=True)
        return APIResponse.success(
            message=AUTH_SUCCESS["location_provinces_retrieved"],
            data=serializer.data
        )
    
    def retrieve(self, request, *args, **kwargs):
        """جزئیات یک استان"""
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance)
            return APIResponse.success(
                message=AUTH_SUCCESS["location_province_retrieved"],
                data=serializer.data
            )
        except Province.DoesNotExist:
            return APIResponse.error(
                message=AUTH_ERRORS["location_province_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['get'])
    def cities(self, request, pk=None):
        """شهرهای یک استان"""
        province = self.get_object()
        
        cache_key = f'province_{province.id}_cities'
        cached_cities = cache.get(cache_key)
        
        if cached_cities:
            return APIResponse.success(
                message=AUTH_SUCCESS["location_province_cities_retrieved"],
                data=cached_cities
            )
        
        cities = province.cities.filter(is_active=True).order_by('name')
        serializer = CitySerializer(cities, many=True)
        
        cache.set(cache_key, serializer.data, 3600)  # 1 hour cache
        
        return APIResponse.success(
            message=AUTH_SUCCESS["location_province_cities_retrieved"],
            data=serializer.data
        )

    @action(detail=False, methods=['get'])
    def all_for_dropdown(self, request):
        """تمام استان‌ها بدون pagination برای dropdown"""
        cache_key = 'provinces_dropdown_all'
        cached_response = cache.get(cache_key)
        
        if cached_response:
            return APIResponse.success(
                message=AUTH_SUCCESS["location_provinces_retrieved"],
                data=cached_response
            )
        
        # فقط فیلدهای ضروری برای dropdown
        provinces = Province.objects.filter(is_active=True).order_by('name').values(
            'id', 'name', 'code'
        )
        
        provinces_list = list(provinces)
        cache.set(cache_key, provinces_list, 7200)  # 2 hours cache
        
        return APIResponse.success(
            message=AUTH_SUCCESS["location_provinces_retrieved"],
            data=provinces_list
        )


class CityViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet برای شهرها - فقط خواندن
    API های شهر برای استفاده در فرم‌ها - با pagination بهینه
    """
    queryset = City.objects.filter(is_active=True).select_related('province').order_by('province__name', 'name')
    permission_classes = [IsAuthenticated]
    pagination_class = StandardLimitPagination
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return CityDetailSerializer
        return CitySerializer
    
    def get_queryset(self):
        """فیلتر کردن شهرها بر اساس استان"""
        queryset = super().get_queryset()
        
        province_id = self.request.query_params.get('province_id')
        if province_id:
            queryset = queryset.filter(province_id=province_id)
        
        return queryset
    
    def retrieve(self, request, *args, **kwargs):
        """جزئیات یک شهر"""
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance)
            return APIResponse.success(
                message=AUTH_SUCCESS["location_city_retrieved"],
                data=serializer.data
            )
        except City.DoesNotExist:
            return APIResponse.error(
                message=AUTH_ERRORS["location_city_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
    
    def list(self, request, *args, **kwargs):
        """لیست شهرها با امکان فیلتر بر اساس استان و pagination بهینه"""
        province_id = request.query_params.get('province_id')
        page = request.query_params.get('offset', 0)
        limit = request.query_params.get('limit', 10)
        
        if province_id:
            cache_key = f'cities_province_{province_id}_{page}_{limit}'
            cached_response = cache.get(cache_key)
            
            if cached_response:
                # Return paginated response using DRF's standard pagination response
                paginator = self.pagination_class()
                return paginator.get_paginated_response(cached_response)
            
            try:
                province = Province.objects.get(id=province_id, is_active=True)
                cities_queryset = province.cities.filter(is_active=True).order_by('name')
                
                # استفاده از pagination
                page_obj = self.paginate_queryset(cities_queryset)
                
                if page_obj is not None:
                    serializer = self.get_serializer(page_obj, many=True)
                    paginated_data = {
                        'count': self.paginator.count,
                        'next': self.paginator.get_next_link(),
                        'previous': self.paginator.get_previous_link(),
                        'results': serializer.data
                    }
                    
                    # کش کردن نتیجه
                    cache.set(cache_key, paginated_data, 1800)  # 30 minutes cache
                    
                    # Return paginated response using DRF's standard pagination response
                    return self.paginator.get_paginated_response(serializer.data)
                
                # اگر pagination نباشد
                serializer = self.get_serializer(cities_queryset, many=True)
                return APIResponse.success(
                    message=AUTH_SUCCESS["location_province_cities_retrieved"],
                    data=serializer.data
                )
                
            except Province.DoesNotExist:
                return APIResponse.error(
                    message=AUTH_ERRORS["location_province_not_found"],
                    status_code=status.HTTP_404_NOT_FOUND
                )
        
        # تمام شهرها با pagination
        cache_key = f'all_cities_list_{page}_{limit}'
        cached_response = cache.get(cache_key)
        
        if cached_response:
            # Return paginated response using DRF's standard pagination response
            paginator = self.pagination_class()
            return paginator.get_paginated_response(cached_response)
        
        queryset = self.get_queryset()
        page_obj = self.paginate_queryset(queryset)
        
        if page_obj is not None:
            serializer = self.get_serializer(page_obj, many=True)
            paginated_data = {
                'count': self.paginator.count,
                'next': self.paginator.get_next_link(),
                'previous': self.paginator.get_previous_link(),
                'results': serializer.data
            }
            
            # کش کردن نتیجه
            cache.set(cache_key, paginated_data, 900)  # 15 minutes cache
            
            # Return paginated response using DRF's standard pagination response
            return self.paginator.get_paginated_response(serializer.data)
        
        # اگر pagination نباشد
        serializer = self.get_serializer(queryset, many=True)
        return APIResponse.success(
            message=AUTH_SUCCESS["location_cities_retrieved"],
            data=serializer.data
        )
    
    @action(detail=False, methods=['get'])
    def for_province_dropdown(self, request):
        """شهرهای یک استان بدون pagination برای dropdown"""
        province_id = request.query_params.get('province_id')
        
        if not province_id:
            return APIResponse.error(
                message="شناسه استان الزامی است",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        cache_key = f'cities_dropdown_province_{province_id}'
        cached_response = cache.get(cache_key)
        
        if cached_response:
            return APIResponse.success(
                message=AUTH_SUCCESS["location_province_cities_retrieved"],
                data=cached_response
            )
        
        try:
            province = Province.objects.get(id=province_id, is_active=True)
            
            # فقط فیلدهای ضروری برای dropdown
            cities = province.cities.filter(is_active=True).order_by('name').values(
                'id', 'name'
            )
            
            cities_list = list(cities)
            cache.set(cache_key, cities_list, 7200)  # 2 hours cache
            
            return APIResponse.success(
                message=AUTH_SUCCESS["location_province_cities_retrieved"],
                data=cities_list
            )
            
        except Province.DoesNotExist:
            return APIResponse.error(
                message=AUTH_ERRORS["location_province_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )