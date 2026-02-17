from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django.core.cache import cache

from src.user.messages import AUTH_SUCCESS, AUTH_ERRORS
from src.core.models import Province, City
from src.user.utils.cache import UserCacheKeys
from src.user.utils.cache_ttl import (
    USER_LOCATION_PROVINCES_TTL,
    USER_LOCATION_PROVINCES_LIST_TTL,
    USER_LOCATION_PROVINCE_CITIES_TTL,
    USER_LOCATION_DROPDOWN_TTL,
    USER_LOCATION_CITIES_BY_PROVINCE_LIST_TTL,
    USER_LOCATION_ALL_CITIES_LIST_TTL,
    USER_LOCATION_CITIES_DROPDOWN_TTL,
)
from src.user.serializers.location_serializer import (
    ProvinceSerializer, ProvinceDetailSerializer,
    CitySerializer, CityDetailSerializer
)
from src.core.responses.response import APIResponse
from src.core.pagination.pagination import StandardLimitPagination

class ProvinceViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Province.objects.filter(is_active=True).order_by('name')
    permission_classes = [IsAuthenticated]
    pagination_class = StandardLimitPagination
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ProvinceDetailSerializer
        return ProvinceSerializer
    
    def get_queryset(self):
        cache_key = UserCacheKeys.location_active_provinces()
        provinces = cache.get(cache_key)
        
        if not provinces:
            provinces = list(Province.objects.filter(is_active=True).order_by('name').values(
                'id', 'public_id', 'name', 'code'
            ))
            cache.set(cache_key, provinces, USER_LOCATION_PROVINCES_TTL)
        
        return Province.objects.filter(is_active=True).order_by('name')
    
    def list(self, request, *args, **kwargs):
        page = request.query_params.get('offset', 0)
        limit = request.query_params.get('limit', 10)
        
        cache_key = UserCacheKeys.location_provinces_list(str(page), str(limit))
        cached_response = cache.get(cache_key)
        
        if cached_response:
            paginator = self.pagination_class()
            return paginator.get_paginated_response(cached_response)
        
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
            
            cache.set(cache_key, paginated_data, USER_LOCATION_PROVINCES_LIST_TTL)
            
            return self.paginator.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return APIResponse.success(
            message=AUTH_SUCCESS["location_provinces_retrieved"],
            data=serializer.data
        )
    
    def retrieve(self, request, *args, **kwargs):
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
        province = self.get_object()
        
        cache_key = UserCacheKeys.location_province_cities(province.id)
        cached_cities = cache.get(cache_key)
        
        if cached_cities:
            return APIResponse.success(
                message=AUTH_SUCCESS["location_province_cities_retrieved"],
                data=cached_cities
            )
        
        cities = province.cities.filter(is_active=True).order_by('name')
        serializer = CitySerializer(cities, many=True)
        
        cache.set(cache_key, serializer.data, USER_LOCATION_PROVINCE_CITIES_TTL)
        
        return APIResponse.success(
            message=AUTH_SUCCESS["location_province_cities_retrieved"],
            data=serializer.data
        )

    @action(detail=False, methods=['get'])
    def all_for_dropdown(self, request):
        cache_key = UserCacheKeys.location_provinces_dropdown()
        cached_response = cache.get(cache_key)
        
        if cached_response:
            return APIResponse.success(
                message=AUTH_SUCCESS["location_provinces_retrieved"],
                data=cached_response
            )
        
        provinces = Province.objects.filter(is_active=True).order_by('name').values(
            'id', 'name', 'code'
        )
        
        provinces_list = list(provinces)
        cache.set(cache_key, provinces_list, USER_LOCATION_DROPDOWN_TTL)
        
        return APIResponse.success(
            message=AUTH_SUCCESS["location_provinces_retrieved"],
            data=provinces_list
        )

class CityViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = City.objects.filter(is_active=True).select_related('province').order_by('province__name', 'name')
    permission_classes = [IsAuthenticated]
    pagination_class = StandardLimitPagination
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return CityDetailSerializer
        return CitySerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        province_id = self.request.query_params.get('province_id')
        if province_id:
            queryset = queryset.filter(province_id=province_id)
        
        return queryset
    
    def retrieve(self, request, *args, **kwargs):
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
        province_id = request.query_params.get('province_id')
        page = request.query_params.get('offset', 0)
        limit = request.query_params.get('limit', 10)
        
        if province_id:
            cache_key = UserCacheKeys.location_cities_by_province_list(str(province_id), str(page), str(limit))
            cached_response = cache.get(cache_key)
            
            if cached_response:
                paginator = self.pagination_class()
                return paginator.get_paginated_response(cached_response)
            
            try:
                province = Province.objects.get(id=province_id, is_active=True)
                cities_queryset = province.cities.filter(is_active=True).order_by('name')
                
                page_obj = self.paginate_queryset(cities_queryset)
                
                if page_obj is not None:
                    serializer = self.get_serializer(page_obj, many=True)
                    paginated_data = {
                        'count': self.paginator.count,
                        'next': self.paginator.get_next_link(),
                        'previous': self.paginator.get_previous_link(),
                        'results': serializer.data
                    }
                    
                    cache.set(cache_key, paginated_data, USER_LOCATION_CITIES_BY_PROVINCE_LIST_TTL)
                    
                    return self.paginator.get_paginated_response(serializer.data)
                
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
        
        cache_key = UserCacheKeys.location_all_cities_list(str(page), str(limit))
        cached_response = cache.get(cache_key)
        
        if cached_response:
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
            
            cache.set(cache_key, paginated_data, USER_LOCATION_ALL_CITIES_LIST_TTL)
            
            return self.paginator.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return APIResponse.success(
            message=AUTH_SUCCESS["location_cities_retrieved"],
            data=serializer.data
        )
    
    @action(detail=False, methods=['get'])
    def for_province_dropdown(self, request):
        province_id = request.query_params.get('province_id')
        
        if not province_id:
            return APIResponse.error(
                message=AUTH_ERRORS.get("auth_validation_error"),
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        cache_key = UserCacheKeys.location_cities_dropdown(str(province_id))
        cached_response = cache.get(cache_key)
        
        if cached_response:
            return APIResponse.success(
                message=AUTH_SUCCESS["location_province_cities_retrieved"],
                data=cached_response
            )
        
        try:
            province = Province.objects.get(id=province_id, is_active=True)
            
            cities = province.cities.filter(is_active=True).order_by('name').values(
                'id', 'name'
            )
            
            cities_list = list(cities)
            cache.set(cache_key, cities_list, USER_LOCATION_CITIES_DROPDOWN_TTL)
            
            return APIResponse.success(
                message=AUTH_SUCCESS["location_province_cities_retrieved"],
                data=cities_list
            )
            
        except Province.DoesNotExist:
            return APIResponse.error(
                message=AUTH_ERRORS["location_province_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )