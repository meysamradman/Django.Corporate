from rest_framework import viewsets, status
from rest_framework.decorators import action

from src.real_estate.serializers.admin import (
    RealEstateProvinceSerializer,
    RealEstateCitySerializer,
    RealEstateCityRegionSerializer,
    RealEstateCitySimpleSerializer,
    RealEstateProvinceCreateUpdateSerializer,
    RealEstateCityCreateUpdateSerializer,
    RealEstateCityRegionCreateUpdateSerializer,
)
from src.core.responses.response import APIResponse
from src.core.pagination.pagination import StandardLimitPagination
from src.user.access_control import real_estate_permission, PermissionRequiredMixin
from src.real_estate.services.admin import RealEstateLocationAdminService
from src.real_estate.messages import LOCATION_SUCCESS, LOCATION_ERRORS


def _parse_bool_param(value, default=True):
    if value is None or value == '':
        return default
    if isinstance(value, bool):
        return value
    normalized = str(value).lower()
    if normalized in ('1', 'true', 'yes', 'on'):
        return True
    if normalized in ('0', 'false', 'no', 'off'):
        return False
    return default

class RealEstateProvinceViewSet(PermissionRequiredMixin, viewsets.ModelViewSet):
    
    queryset = RealEstateLocationAdminService.get_provinces_queryset()
    serializer_class = RealEstateProvinceSerializer
    permission_classes = [real_estate_permission]
    pagination_class = StandardLimitPagination
    permission_map = {
        'list': 'real_estate.property.read',
        'retrieve': 'real_estate.property.read',
        'cities': 'real_estate.property.read',
        'create': 'real_estate.property.create',
        'update': 'real_estate.property.update',
        'partial_update': 'real_estate.property.update',
        'destroy': 'real_estate.property.delete',
    }
    permission_denied_message = LOCATION_ERRORS["location_not_authorized"]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return RealEstateProvinceCreateUpdateSerializer
        return RealEstateProvinceSerializer

    def get_queryset(self):
        search = self.request.query_params.get('search')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        order_by = self.request.query_params.get('order_by', 'created_at')
        order_desc = _parse_bool_param(self.request.query_params.get('order_desc'), True)
        is_active = _parse_bool_param(self.request.query_params.get('is_active'), True)

        return RealEstateLocationAdminService.get_provinces_queryset(
            search=search,
            date_from=date_from,
            date_to=date_to,
            order_by=order_by,
            order_desc=order_desc,
            is_active=is_active,
        )
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        data = serializer.data

        return APIResponse.success(
            message=LOCATION_SUCCESS["province_list_success"],
            data=data
        )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = RealEstateLocationAdminService.create_province(serializer.validated_data, created_by=request.user)
        data = RealEstateProvinceSerializer(instance).data
        return APIResponse.success(message=LOCATION_SUCCESS["province_created"], data=data, status_code=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=kwargs.get('partial', False))
        serializer.is_valid(raise_exception=True)
        updated = RealEstateLocationAdminService.update_province(instance, serializer.validated_data)
        data = RealEstateProvinceSerializer(updated).data
        return APIResponse.success(message=LOCATION_SUCCESS["province_updated"], data=data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        RealEstateLocationAdminService.deactivate_province(instance)
        return APIResponse.success(message=LOCATION_SUCCESS["province_deleted"])
    
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

class RealEstateCityViewSet(PermissionRequiredMixin, viewsets.ModelViewSet):
    
    queryset = RealEstateLocationAdminService.get_cities_queryset()
    serializer_class = RealEstateCitySerializer
    permission_classes = [real_estate_permission]
    pagination_class = StandardLimitPagination
    permission_map = {
        'list': 'real_estate.property.read',
        'retrieve': 'real_estate.property.read',
        'regions': 'real_estate.property.read',
        'create': 'real_estate.property.create',
        'update': 'real_estate.property.update',
        'partial_update': 'real_estate.property.update',
        'destroy': 'real_estate.property.delete',
    }
    permission_denied_message = LOCATION_ERRORS["location_not_authorized"]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return RealEstateCityCreateUpdateSerializer
        return RealEstateCitySerializer
    
    def get_queryset(self):
        province_id = self.request.query_params.get('province_id')
        has_properties = _parse_bool_param(self.request.query_params.get('has_properties'), False)
        search = self.request.query_params.get('search')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        order_by = self.request.query_params.get('order_by', 'created_at')
        order_desc = _parse_bool_param(self.request.query_params.get('order_desc'), True)
        is_active = _parse_bool_param(self.request.query_params.get('is_active'), True)
        return RealEstateLocationAdminService.get_cities_queryset(
            province_id=province_id,
            has_properties=has_properties,
            search=search,
            date_from=date_from,
            date_to=date_to,
            order_by=order_by,
            order_desc=order_desc,
            is_active=is_active,
        )
    
    def list(self, request, *args, **kwargs):
        has_properties = _parse_bool_param(request.query_params.get('has_properties'), False)
        
        queryset = self.get_queryset()

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            if has_properties:
                data = []
                for item in serializer.data:
                    data.append({
                        **item,
                        'property_count': item.get('property_count', 0),
                    })
                return self.get_paginated_response(data)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        data = serializer.data

        return APIResponse.success(
            message=LOCATION_SUCCESS["city_list_success"],
            data=data
        )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = RealEstateLocationAdminService.create_city(serializer.validated_data, created_by=request.user)
        data = RealEstateCitySerializer(instance).data
        return APIResponse.success(message=LOCATION_SUCCESS["city_created"], data=data, status_code=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=kwargs.get('partial', False))
        serializer.is_valid(raise_exception=True)
        updated = RealEstateLocationAdminService.update_city(instance, serializer.validated_data)
        data = RealEstateCitySerializer(updated).data
        return APIResponse.success(message=LOCATION_SUCCESS["city_updated"], data=data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        RealEstateLocationAdminService.deactivate_city(instance)
        return APIResponse.success(message=LOCATION_SUCCESS["city_deleted"])
    
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

class RealEstateCityRegionViewSet(PermissionRequiredMixin, viewsets.ModelViewSet):
    
    queryset = RealEstateLocationAdminService.get_city_regions_queryset()
    serializer_class = RealEstateCityRegionSerializer
    permission_classes = [real_estate_permission]
    pagination_class = StandardLimitPagination
    permission_map = {
        'list': 'real_estate.property.read',
        'retrieve': 'real_estate.property.read',
        'create': 'real_estate.property.create',
        'update': 'real_estate.property.update',
        'partial_update': 'real_estate.property.update',
        'destroy': 'real_estate.property.delete',
    }
    permission_denied_message = LOCATION_ERRORS["location_not_authorized"]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return RealEstateCityRegionCreateUpdateSerializer
        return RealEstateCityRegionSerializer

    def get_queryset(self):
        city_id = self.request.query_params.get('city_id')
        search = self.request.query_params.get('search')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        order_by = self.request.query_params.get('order_by', 'created_at')
        order_desc = _parse_bool_param(self.request.query_params.get('order_desc'), True)
        is_active = _parse_bool_param(self.request.query_params.get('is_active'), True)
        return RealEstateLocationAdminService.get_city_regions_queryset(
            city_id=city_id,
            search=search,
            date_from=date_from,
            date_to=date_to,
            order_by=order_by,
            order_desc=order_desc,
            is_active=is_active,
        )

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        data = serializer.data

        return APIResponse.success(
            message=LOCATION_SUCCESS["region_list_success"],
            data=data
        )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = RealEstateLocationAdminService.create_region(serializer.validated_data, created_by=request.user)
        data = RealEstateCityRegionSerializer(instance).data
        return APIResponse.success(message=LOCATION_SUCCESS["region_created"], data=data, status_code=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=kwargs.get('partial', False))
        serializer.is_valid(raise_exception=True)
        updated = RealEstateLocationAdminService.update_region(instance, serializer.validated_data)
        data = RealEstateCityRegionSerializer(updated).data
        return APIResponse.success(message=LOCATION_SUCCESS["region_updated"], data=data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        RealEstateLocationAdminService.deactivate_region(instance)
        return APIResponse.success(message=LOCATION_SUCCESS["region_deleted"])

