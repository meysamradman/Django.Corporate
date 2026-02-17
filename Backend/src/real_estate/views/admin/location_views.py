from rest_framework import viewsets, status
from rest_framework.decorators import action

from src.real_estate.serializers.admin import (
    RealEstateProvinceSerializer,
    RealEstateCitySerializer,
    RealEstateCityRegionSerializer,
    RealEstateCitySimpleSerializer,
)
from src.core.responses.response import APIResponse
from src.core.pagination.pagination import StandardLimitPagination
from src.user.access_control import real_estate_permission, PermissionRequiredMixin
from src.real_estate.services.admin import RealEstateLocationAdminService
from src.real_estate.messages import LOCATION_SUCCESS, LOCATION_ERRORS

class RealEstateProvinceViewSet(PermissionRequiredMixin, viewsets.ReadOnlyModelViewSet):
    
    queryset = RealEstateLocationAdminService.get_provinces_queryset()
    serializer_class = RealEstateProvinceSerializer
    permission_classes = [real_estate_permission]
    pagination_class = StandardLimitPagination
    permission_map = {
        'list': 'real_estate.property.read',
        'retrieve': 'real_estate.property.read',
        'cities': 'real_estate.property.read',
    }
    permission_denied_message = LOCATION_ERRORS["location_not_authorized"]
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        data = serializer.data

        return APIResponse.success(
            message=LOCATION_SUCCESS["province_list_success"],
            data=data
        )
    
    @action(detail=True, methods=['get'], url_path='cities')
    def cities(self, request, pk=None):
        province = RealEstateLocationAdminService.get_province_by_id(pk)
        if not province:
            return APIResponse.error(
                message=LOCATION_ERRORS["province_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        cities = RealEstateLocationAdminService.get_province_cities(province)
        serializer = RealEstateCitySimpleSerializer(cities, many=True)
        data = serializer.data

        return APIResponse.success(
            message=LOCATION_SUCCESS["city_list_success"],
            data=data
        )

class RealEstateCityViewSet(PermissionRequiredMixin, viewsets.ReadOnlyModelViewSet):
    
    queryset = RealEstateLocationAdminService.get_cities_queryset()
    serializer_class = RealEstateCitySerializer
    permission_classes = [real_estate_permission]
    pagination_class = StandardLimitPagination
    permission_map = {
        'list': 'real_estate.property.read',
        'retrieve': 'real_estate.property.read',
        'regions': 'real_estate.property.read',
    }
    permission_denied_message = LOCATION_ERRORS["location_not_authorized"]
    
    def get_queryset(self):
        province_id = self.request.query_params.get('province_id')
        has_properties = self.request.query_params.get('has_properties', 'false').lower() == 'true'
        return RealEstateLocationAdminService.get_cities_queryset(
            province_id=province_id,
            has_properties=has_properties
        )
    
    def list(self, request, *args, **kwargs):
        province_id = request.query_params.get('province_id')
        has_properties = request.query_params.get('has_properties', 'false').lower() == 'true'
        
        queryset = self.get_queryset()
        
        if has_properties:
            data = [{
                'id': city.id,
                'name': city.name,
                'province_id': city.province_id,
                'province_name': city.province.name,
                'property_count': city.property_count  # تعداد املاک
            } for city in queryset]
        else:
            serializer = self.get_serializer(queryset, many=True)
            data = serializer.data

        return APIResponse.success(
            message=LOCATION_SUCCESS["city_list_success"],
            data=data
        )
    
    @action(detail=True, methods=['get'], url_path='regions')
    def regions(self, request, pk=None):
        city = RealEstateLocationAdminService.get_city_by_id(pk)
        if not city:
            return APIResponse.error(
                message=LOCATION_ERRORS["city_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )

        regions = RealEstateLocationAdminService.get_city_regions_for_city(city)
        data = [{
            'id': region.id,
            'code': region.code,
            'name': region.name
        } for region in regions]

        return APIResponse.success(
            message=LOCATION_SUCCESS["region_list_success"],
            data=data
        )

class RealEstateCityRegionViewSet(PermissionRequiredMixin, viewsets.ReadOnlyModelViewSet):
    
    queryset = RealEstateLocationAdminService.get_city_regions_queryset()
    serializer_class = RealEstateCityRegionSerializer
    permission_classes = [real_estate_permission]
    permission_map = {
        'list': 'real_estate.property.read',
        'retrieve': 'real_estate.property.read',
    }
    permission_denied_message = LOCATION_ERRORS["location_not_authorized"]

    def get_queryset(self):
        city_id = self.request.query_params.get('city_id')
        return RealEstateLocationAdminService.get_city_regions_queryset(city_id=city_id)

    def list(self, request, *args, **kwargs):
        city_id = request.query_params.get('city_id')

        queryset = self.get_queryset()
        data = [{
            'id': region.id,
            'code': region.code,
            'name': region.name,
            'city_id': region.city_id,
            'city_name': region.city.name,
        } for region in queryset]

        return APIResponse.success(
            message=LOCATION_SUCCESS["region_list_success"],
            data=data
        )

