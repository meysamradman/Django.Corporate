from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from decimal import Decimal

from src.core.responses.response import APIResponse
from src.user.access_control import real_estate_permission, PermissionRequiredMixin
from src.real_estate.services.admin import PropertyGeoService
from src.real_estate.serializers.admin import PropertyAdminListSerializer
from src.real_estate.messages.messages import PROPERTY_SUCCESS, PROPERTY_ERRORS
from src.core.utils.validation_helpers import extract_validation_message

class PropertyGeoViewSet(PermissionRequiredMixin, viewsets.ViewSet):
    
    permission_classes = [real_estate_permission]
    
    permission_map = {
        'nearby': 'real_estate.property.read',
        'in_bbox': 'real_estate.property.read',
        'in_polygon': 'real_estate.property.read',
        'map_data': 'real_estate.property.read',
        'engine_status': 'real_estate.property.read',
    }
    permission_denied_message = PROPERTY_ERRORS["property_not_authorized"]
    
    @action(detail=False, methods=['get'], url_path='nearby')
    def nearby(self, request):
        
        try:
            latitude = request.query_params.get('latitude')
            longitude = request.query_params.get('longitude')
            
            if not latitude or not longitude:
                return APIResponse.error(
                    message="مختصات جغرافیایی الزامی است.",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                latitude = Decimal(str(latitude))
                longitude = Decimal(str(longitude))
            except:
                return APIResponse.error(
                    message="مختصات جغرافیایی معتبر نیست.",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            radius_km = float(request.query_params.get('radius_km', 2.0))
            limit = int(request.query_params.get('limit', 20))
            
            properties = PropertyGeoService.search_nearby(
                latitude=latitude,
                longitude=longitude,
                radius_km=radius_km,
                limit=limit
            )
            
            serializer = PropertyAdminListSerializer(properties, many=True)
            
            return APIResponse.success(
                message=f"{len(properties)} ملک در شعاع {radius_km} کیلومتری یافت شد.",
                data=serializer.data,
                status_code=status.HTTP_200_OK
            )
            
        except Exception as e:
            return APIResponse.error(
                message=extract_validation_message(e, PROPERTY_ERRORS["property_update_failed"]),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'], url_path='in-bbox')
    def in_bbox(self, request):
        
        try:
            min_lat = request.query_params.get('min_lat')
            max_lat = request.query_params.get('max_lat')
            min_lon = request.query_params.get('min_lon')
            max_lon = request.query_params.get('max_lon')
            
            if not all([min_lat, max_lat, min_lon, max_lon]):
                return APIResponse.error(
                    message="مختصات محدوده الزامی است.",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                min_lat = Decimal(str(min_lat))
                max_lat = Decimal(str(max_lat))
                min_lon = Decimal(str(min_lon))
                max_lon = Decimal(str(max_lon))
            except:
                return APIResponse.error(
                    message="مختصات جغرافیایی معتبر نیست.",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            limit = int(request.query_params.get('limit', 100))
            
            properties = PropertyGeoService.search_in_bbox(
                min_lat=min_lat,
                max_lat=max_lat,
                min_lon=min_lon,
                max_lon=max_lon,
                limit=limit
            )
            
            serializer = PropertyAdminListSerializer(properties, many=True)
            
            return APIResponse.success(
                message=f"{len(properties)} ملک در محدوده یافت شد.",
                data=serializer.data,
                status_code=status.HTTP_200_OK
            )
            
        except Exception as e:
            return APIResponse.error(
                message=extract_validation_message(e, PROPERTY_ERRORS["property_update_failed"]),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'], url_path='in-polygon')
    def in_polygon(self, request):
        
        try:
            polygon_coords = request.data.get('polygon', [])
            
            if not polygon_coords or len(polygon_coords) < 3:
                return APIResponse.error(
                    message="چندضلعی باید حداقل 3 نقطه داشته باشد.",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                polygon = [
                    (Decimal(str(lat)), Decimal(str(lon))) 
                    for lat, lon in polygon_coords
                ]
            except:
                return APIResponse.error(
                    message="مختصات چندضلعی معتبر نیست.",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            limit = int(request.data.get('limit', 100))
            
            properties = PropertyGeoService.search_in_polygon(
                polygon=polygon,
                limit=limit
            )
            
            serializer = PropertyAdminListSerializer(properties, many=True)
            
            return APIResponse.success(
                message=f"{len(properties)} ملک در محدوده یافت شد.",
                data=serializer.data,
                status_code=status.HTTP_200_OK
            )
            
        except Exception as e:
            return APIResponse.error(
                message=extract_validation_message(e, PROPERTY_ERRORS["property_update_failed"]),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'], url_path='map-data')
    def map_data(self, request):
        
        try:
            min_lat = request.query_params.get('min_lat')
            max_lat = request.query_params.get('max_lat')
            min_lon = request.query_params.get('min_lon')
            max_lon = request.query_params.get('max_lon')
            
            if not all([min_lat, max_lat, min_lon, max_lon]):
                return APIResponse.error(
                    message="مختصات محدوده الزامی است.",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                min_lat = Decimal(str(min_lat))
                max_lat = Decimal(str(max_lat))
                min_lon = Decimal(str(min_lon))
                max_lon = Decimal(str(max_lon))
            except:
                return APIResponse.error(
                    message="مختصات جغرافیایی معتبر نیست.",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            limit = int(request.query_params.get('limit', 500))
            
            map_properties = PropertyGeoService.get_properties_for_map(
                min_lat=min_lat,
                max_lat=max_lat,
                min_lon=min_lon,
                max_lon=max_lon,
                limit=limit
            )
            
            return APIResponse.success(
                message=f"{len(map_properties)} ملک برای نقشه یافت شد.",
                data=map_properties,
                status_code=status.HTTP_200_OK
            )
            
        except Exception as e:
            return APIResponse.error(
                message=extract_validation_message(e, PROPERTY_ERRORS["property_update_failed"]),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'], url_path='engine-status')
    def engine_status(self, request):

        try:
            data = PropertyGeoService.engine_status()
            return APIResponse.success(
                message="وضعیت موتور جستجوی مکانی با موفقیت دریافت شد.",
                data=data,
                status_code=status.HTTP_200_OK
            )
        except Exception as e:
            return APIResponse.error(
                message=extract_validation_message(e, PROPERTY_ERRORS["property_update_failed"]),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
