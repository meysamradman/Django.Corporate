from typing import List, Tuple, Optional, Dict, Any
from decimal import Decimal
from django.db.models import QuerySet, F
from src.real_estate.models.property import Property, HAS_POSTGIS

# PostGIS imports (conditional)
if HAS_POSTGIS:
    from django.contrib.gis.geos import Point, Polygon, MultiPolygon
    from django.contrib.gis.measure import D  # Distance
    from django.contrib.gis.db.models.functions import Distance
else:
    Point = None
    Polygon = None
    MultiPolygon = None
    D = None
    Distance = None


class PropertyGeoService:
    
    @classmethod
    def has_postgis_support(cls) -> bool:

        return HAS_POSTGIS
    
    @classmethod
    def search_nearby(
        cls,
        latitude: float,
        longitude: float,
        radius_km: float = 2.0,
        queryset: Optional[QuerySet] = None
    ) -> QuerySet:

        if queryset is None:
            queryset = Property.objects.published()
        
        if not HAS_POSTGIS:
            # Fallback: استفاده از bbox ساده
            return cls._search_nearby_fallback(
                latitude, longitude, radius_km, queryset
            )
        
        # استفاده از PostGIS برای جستجوی دقیق
        user_location = Point(longitude, latitude, srid=4326)
        
        return queryset.filter(
            location__distance_lte=(user_location, D(km=radius_km))
        ).annotate(
            distance_km=Distance('location', user_location)
        ).order_by('distance_km')
    
    @classmethod
    def search_in_polygon(
        cls,
        polygon_coords: List[Tuple[float, float]],
        queryset: Optional[QuerySet] = None
    ) -> QuerySet:

        if queryset is None:
            queryset = Property.objects.published()
        
        if not HAS_POSTGIS:
            # Fallback: استفاده از bbox ساده
            return cls._search_in_bbox_fallback(polygon_coords, queryset)
        
        # تبدیل مختصات به Polygon
        polygon = Polygon(polygon_coords, srid=4326)
        
        return queryset.filter(location__within=polygon)
    
    @classmethod
    def search_in_bbox(
        cls,
        min_lat: float,
        max_lat: float,
        min_lon: float,
        max_lon: float,
        queryset: Optional[QuerySet] = None
    ) -> QuerySet:

        if queryset is None:
            queryset = Property.objects.published()
        
        # این کوئری با یا بدون PostGIS کار میکنه
        return queryset.filter(
            latitude__gte=min_lat,
            latitude__lte=max_lat,
            longitude__gte=min_lon,
            longitude__lte=max_lon
        )
    
    @classmethod
    def calculate_distance(
        cls,
        lat1: float,
        lon1: float,
        lat2: float,
        lon2: float
    ) -> float:

        if HAS_POSTGIS:
            # استفاده از PostGIS برای محاسبه دقیق
            point1 = Point(lon1, lat1, srid=4326)
            point2 = Point(lon2, lat2, srid=4326)
            return point1.distance(point2) * 111.0  # تقریب به کیلومتر
        else:
            # Fallback: فرمول Haversine
            return cls._haversine_distance(lat1, lon1, lat2, lon2)
    
    # ==================== Fallback Methods ====================
    
    @classmethod
    def _search_nearby_fallback(
        cls,
        latitude: float,
        longitude: float,
        radius_km: float,
        queryset: QuerySet
    ) -> QuerySet:

        lat_delta = radius_km / 111.0
        lon_delta = radius_km / (111.0 * abs(Decimal(str(latitude)).cos()))
        
        return queryset.filter(
            latitude__gte=latitude - lat_delta,
            latitude__lte=latitude + lat_delta,
            longitude__gte=longitude - lon_delta,
            longitude__lte=longitude + lon_delta
        )
    
    @classmethod
    def _search_in_bbox_fallback(
        cls,
        polygon_coords: List[Tuple[float, float]],
        queryset: QuerySet
    ) -> QuerySet:

        lats = [coord[1] for coord in polygon_coords]
        lons = [coord[0] for coord in polygon_coords]
        
        return queryset.filter(
            latitude__gte=min(lats),
            latitude__lte=max(lats),
            longitude__gte=min(lons),
            longitude__lte=max(lons)
        )
    
    @classmethod
    def _haversine_distance(
        cls,
        lat1: float,
        lon1: float,
        lat2: float,
        lon2: float
    ) -> float:

        import math
        
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
    
    # ==================== Utility Methods ====================
    
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
        """
        املاک برای نمایش روی نقشه (بدون bbox)
        """
        if queryset is None:
            queryset = Property.objects.published()
        
        # فیلتر بر اساس شهر
        if city_id:
            queryset = queryset.filter(city_id=city_id)
        
        # فقط املاک با مختصات
        queryset = queryset.filter(
            latitude__isnull=False,
            longitude__isnull=False
        )
        
        # فقط فیلدهای ضروری
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
        """
        املاک در محدوده مستطیلی برای نقشه
        با فیلدهای بهینه برای نمایش
        """
        if queryset is None:
            queryset = Property.objects.published()
        
        # فیلتر bbox
        properties = cls.search_in_bbox(
            min_lat=min_lat,
            max_lat=max_lat,
            min_lon=min_lon,
            max_lon=max_lon,
            queryset=queryset,
            limit=limit
        )
        
        # تبدیل به دیکشنری با فیلدهای ضروری
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
            'is_featured',
            'is_verified'
        ))
