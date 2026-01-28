from typing import List, Tuple, Optional, Dict, Any
from decimal import Decimal
from django.db.models import QuerySet
from src.real_estate.models.property import Property
import math

class PropertyGeoService:

    @classmethod
    def search_nearby(
        cls,
        latitude: float,
        longitude: float,
        radius_km: float = 2.0,
        limit: int = 20,
        queryset: Optional[QuerySet] = None
    ) -> QuerySet:
        
        if queryset is None:
            queryset = Property.objects.published()
        
        lat_delta = radius_km / 111.0
        lon_delta = radius_km / (111.0 * abs(math.cos(math.radians(latitude))))
        
        return queryset.filter(
            latitude__gte=latitude - lat_delta,
            latitude__lte=latitude + lat_delta,
            longitude__gte=longitude - lon_delta,
            longitude__lte=longitude + lon_delta
        )[:limit]
    @classmethod
    def search_in_polygon(
        cls,
        polygon: List[Tuple[float, float]],
        limit: int = 100,
        queryset: Optional[QuerySet] = None
    ) -> QuerySet:
        
        if queryset is None:
            queryset = Property.objects.published()
        
        lats = [coord[0] for coord in polygon]
        lons = [coord[1] for coord in polygon]
        
        return queryset.filter(
            latitude__gte=min(lats),
            latitude__lte=max(lats),
            longitude__gte=min(lons),
            longitude__lte=max(lons)
        )[:limit]
    @classmethod
    def search_in_bbox(
        cls,
        min_lat: float,
        max_lat: float,
        min_lon: float,
        max_lon: float,
        limit: int = 100,
        queryset: Optional[QuerySet] = None
    ) -> QuerySet:
        
        if queryset is None:
            queryset = Property.objects.published()
        
        return queryset.filter(
            latitude__gte=min_lat,
            latitude__lte=max_lat,
            longitude__gte=min_lon,
            longitude__lte=max_lon
        )[:limit]
    @classmethod
    def calculate_distance(
        cls,
        lat1: float,
        lon1: float,
        lat2: float,
        lon2: float
    ) -> float:
        
        return cls._haversine_distance(lat1, lon1, lat2, lon2)

    @classmethod
    def _haversine_distance(
        cls,
        lat1: float,
        lon1: float,
        lat2: float,
        lon2: float
    ) -> float:
        
        R = 6371  # شعاع زمین به کیلومتر
        
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        
        a = (
            math.sin(dlat / 2) ** 2 +
            math.cos(math.radians(lat1)) *
            math.cos(math.radians(lat2)) *
            math.sin(dlon / 2) ** 2
        )
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        
        return R * c

    @classmethod
    def get_property_coordinates(cls, property_id: int) -> Optional[Tuple[float, float]]:
        
        try:
            prop = Property.objects.only('latitude', 'longitude').get(id=property_id)
            if prop.latitude and prop.longitude:
                return (float(prop.latitude), float(prop.longitude))
        except Property.DoesNotExist:
            pass
        return None
    
    @classmethod
    def properties_on_map(
        cls,
        city_id: Optional[int] = None,
        queryset: Optional[QuerySet] = None
    ) -> List[Dict[str, Any]]:
        
        if queryset is None:
            queryset = Property.objects.published()
        
        if city_id:
            queryset = queryset.filter(city_id=city_id)
        
        queryset = queryset.filter(
            latitude__isnull=False,
            longitude__isnull=False
        )
        
        return list(queryset.values(
            'id',
            'public_id',
            'title',
            'slug',
            'latitude',
            'longitude',
            'price',
            'bedrooms',
            'bathrooms',
            'built_area',
            'property_type__title',
            'is_featured'
        ))
    
    @classmethod
    def get_properties_for_map(
        cls,
        min_lat: Decimal,
        max_lat: Decimal,
        min_lon: Decimal,
        max_lon: Decimal,
        limit: int = 500,
        queryset: Optional[QuerySet] = None
    ) -> List[Dict[str, Any]]:
        
        if queryset is None:
            queryset = Property.objects.published()
        
        properties = cls.search_in_bbox(
            min_lat=float(min_lat),
            max_lat=float(max_lat),
            min_lon=float(min_lon),
            max_lon=float(max_lon),
            limit=limit,
            queryset=queryset
        )
        
        return list(properties.values(
            'id',
            'public_id',
            'title',
            'slug',
            'latitude',
            'longitude',
            'price',
            'sale_price',
            'monthly_rent',
            'bedrooms',
            'bathrooms',
            'built_area',
            'property_type__title',
            'state__title',
            'is_featured'
        ))
