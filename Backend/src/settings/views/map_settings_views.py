import json
import os
import requests
from rest_framework import viewsets, status
from rest_framework.decorators import action
from src.core.responses.response import APIResponse
from ..models.map_settings import MapSettings
from ..serializers.map_settings_serializer import MapSettingsSerializer
from src.user.access_control import PermissionRequiredMixin

class MapSettingsViewSet(PermissionRequiredMixin, viewsets.ModelViewSet):
    queryset = MapSettings.objects.all()
    serializer_class = MapSettingsSerializer
    
    permission_map = {
        'list': 'settings.manage',
        'retrieve': 'settings.manage',
        'create': 'settings.manage',
        'update': 'settings.manage',
        'partial_update': 'settings.manage',
        'destroy': 'settings.manage',
        'geocode': 'settings.manage',
        'reverse_geocode': 'settings.manage',
    }

    def list(self, request, *args, **kwargs):
        settings = MapSettings.objects.first()
        if not settings:
            settings = MapSettings.objects.create(provider='leaflet')
        serializer = self.get_serializer(settings)
        return APIResponse.success(data=serializer.data)

    def update(self, request, *args, **kwargs):
        settings = MapSettings.objects.first()
        if not settings:
            settings = MapSettings.objects.create(provider='leaflet')
        
        serializer = self.get_serializer(settings, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return APIResponse.success(data=serializer.data)
        return APIResponse.error(errors=serializer.errors)

    @action(detail=False, methods=['get'], url_path='geocode')
    def geocode(self, request, *args, **kwargs):
        query = (request.query_params.get('query') or '').strip()
        city = (request.query_params.get('city') or '').strip()
        province = (request.query_params.get('province') or '').strip()

        if not query:
            return APIResponse.error(message='query is required', status_code=status.HTTP_400_BAD_REQUEST)

        neshan_api_key = (os.getenv('NESHAN_SERVER_API_KEY') or '').strip()

        if neshan_api_key:
            try:
                payload = {'address': query}
                if city:
                    payload['city'] = city
                if province:
                    payload['province'] = province

                response = requests.get(
                    'https://api.neshan.org/geocoding/v1',
                    headers={'Api-Key': neshan_api_key},
                    params={'json': json.dumps(payload, ensure_ascii=False)},
                    timeout=8,
                )

                if response.ok:
                    data = response.json() or {}
                    items = data.get('items') or []
                    if isinstance(items, list) and items:
                        first = items[0] or {}
                        location = first.get('location') or {}
                        lat = location.get('latitude')
                        lng = location.get('longitude')
                        if lat is not None and lng is not None:
                            return APIResponse.success(data={
                                'latitude': float(lat),
                                'longitude': float(lng),
                                'display_name': ', '.join(
                                    x for x in [first.get('province'), first.get('city'), first.get('neighbourhood')] if x
                                ),
                                'source': 'neshan',
                            })
            except Exception:
                pass

        try:
            search_response = requests.get(
                'https://nominatim.openstreetmap.org/search',
                params={
                    'format': 'json',
                    'q': ', '.join(x for x in [query, city, province, 'Iran'] if x),
                    'limit': 1,
                    'accept-language': 'fa,en',
                },
                headers={'User-Agent': 'CorporateAdmin/1.0'},
                timeout=8,
            )
            if not search_response.ok:
                return APIResponse.error(message='Geocoding service unavailable', status_code=status.HTTP_503_SERVICE_UNAVAILABLE)

            search_data = search_response.json() or []
            if not isinstance(search_data, list) or not search_data:
                return APIResponse.error(message='No geocoding result found', status_code=status.HTTP_404_NOT_FOUND)

            first = search_data[0]
            return APIResponse.success(data={
                'latitude': float(first['lat']),
                'longitude': float(first['lon']),
                'display_name': first.get('display_name') or '',
                'source': 'nominatim',
            })
        except Exception:
            return APIResponse.error(message='Geocoding failed', status_code=status.HTTP_503_SERVICE_UNAVAILABLE)

    @action(detail=False, methods=['get'], url_path='reverse-geocode')
    def reverse_geocode(self, request, *args, **kwargs):
        lat = request.query_params.get('lat')
        lng = request.query_params.get('lng')

        if lat is None or lng is None:
            return APIResponse.error(message='lat and lng are required', status_code=status.HTTP_400_BAD_REQUEST)

        try:
            lat_value = float(lat)
            lng_value = float(lng)
        except (TypeError, ValueError):
            return APIResponse.error(message='lat/lng are invalid', status_code=status.HTTP_400_BAD_REQUEST)

        neshan_api_key = (os.getenv('NESHAN_SERVER_API_KEY') or '').strip()

        if neshan_api_key:
            try:
                response = requests.get(
                    'https://api.neshan.org/v5/reverse',
                    headers={'Api-Key': neshan_api_key},
                    params={'lat': lat_value, 'lng': lng_value},
                    timeout=8,
                )
                if response.ok:
                    data = response.json() or {}
                    zone = str(data.get('municipality_zone') or '').strip()
                    city_district = f'منطقه {zone}' if zone else ''
                    normalized = {
                        'display_name': data.get('formatted_address') or '',
                        'address': {
                            'state': data.get('state') or '',
                            'city': data.get('city') or '',
                            'city_district': city_district,
                            'neighbourhood': data.get('neighbourhood') or '',
                            'road': data.get('route_name') or '',
                        },
                        'source': 'neshan',
                        'raw': data,
                    }
                    return APIResponse.success(data=normalized)
            except Exception:
                pass

        try:
            response = requests.get(
                'https://nominatim.openstreetmap.org/reverse',
                params={
                    'format': 'json',
                    'lat': lat_value,
                    'lon': lng_value,
                    'zoom': 18,
                    'addressdetails': 1,
                    'accept-language': 'fa,en',
                },
                headers={'User-Agent': 'CorporateAdmin/1.0'},
                timeout=8,
            )
            if not response.ok:
                return APIResponse.error(message='Reverse geocoding service unavailable', status_code=status.HTTP_503_SERVICE_UNAVAILABLE)

            data = response.json() or {}
            data['source'] = 'nominatim'
            return APIResponse.success(data=data)
        except Exception:
            return APIResponse.error(message='Reverse geocoding failed', status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
