from typing import List, Tuple, Optional, Dict, Any
from decimal import Decimal
import os
import logging
from django.conf import settings
from django.db import connection
from django.db.models import QuerySet
from django.db.models.expressions import RawSQL
from src.real_estate.models.property import Property
import math

logger = logging.getLogger(__name__)

class PropertyGeoService:

    _postgis_available: Optional[bool] = None
    _postgis_warning_emitted: bool = False

    @classmethod
    def _geo_engine_mode(cls) -> str:
        mode = getattr(settings, 'REAL_ESTATE_GEO_ENGINE', None) or os.getenv('REAL_ESTATE_GEO_ENGINE') or os.getenv('GEO_ENGINE') or 'auto'
        return str(mode).strip().lower()

    @classmethod
    def _is_postgis_available(cls) -> bool:
        if cls._postgis_available is not None:
            return cls._postgis_available

        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis')")
                row = cursor.fetchone()
                cls._postgis_available = bool(row and row[0])
        except Exception:
            cls._postgis_available = False

        return cls._postgis_available

    @classmethod
    def _use_postgis(cls) -> bool:
        mode = cls._geo_engine_mode()
        postgis_available = cls._is_postgis_available()

        if mode == 'basic':
            return False

        if mode == 'postgis' and not postgis_available:
            if not cls._postgis_warning_emitted:
                logger.warning("REAL_ESTATE_GEO_ENGINE=postgis but PostGIS extension is unavailable. Falling back to basic geo engine.")
                cls._postgis_warning_emitted = True
            return False

        if mode == 'postgis':
            return True

        return postgis_available

    @classmethod
    def _search_nearby_basic(
        cls,
        latitude: float,
        longitude: float,
        radius_km: float,
        limit: int,
        queryset: QuerySet,
    ) -> QuerySet:
        lat_delta = radius_km / 111.0
        cos_lat = abs(math.cos(math.radians(latitude)))
        lon_delta = radius_km / (111.0 * max(cos_lat, 1e-6))

        return queryset.filter(
            latitude__gte=latitude - lat_delta,
            latitude__lte=latitude + lat_delta,
            longitude__gte=longitude - lon_delta,
            longitude__lte=longitude + lon_delta
        )[:limit]

    @classmethod
    def _search_nearby_postgis(
        cls,
        latitude: float,
        longitude: float,
        radius_km: float,
        limit: int,
        queryset: QuerySet,
    ) -> QuerySet:
        radius_m = float(radius_km) * 1000.0
        reference_lng = float(longitude)
        reference_lat = float(latitude)

        queryset = queryset.filter(latitude__isnull=False, longitude__isnull=False)

        distance_sql = RawSQL(
            """
            ST_DistanceSphere(
                ST_SetSRID(ST_MakePoint(longitude, latitude), 4326),
                ST_SetSRID(ST_MakePoint(%s, %s), 4326)
            )
            """,
            (reference_lng, reference_lat),
        )

        return queryset.annotate(_distance_m=distance_sql).filter(_distance_m__lte=radius_m).order_by('_distance_m')[:limit]

    @classmethod
    def _search_in_polygon_basic(
        cls,
        polygon: List[Tuple[float, float]],
        limit: int,
        queryset: QuerySet,
    ) -> QuerySet:
        lats = [coord[0] for coord in polygon]
        lons = [coord[1] for coord in polygon]

        return queryset.filter(
            latitude__gte=min(lats),
            latitude__lte=max(lats),
            longitude__gte=min(lons),
            longitude__lte=max(lons)
        )[:limit]

    @classmethod
    def _search_in_polygon_postgis(
        cls,
        polygon: List[Tuple[float, float]],
        limit: int,
        queryset: QuerySet,
    ) -> QuerySet:
        ring = list(polygon)
        if ring and ring[0] != ring[-1]:
            ring.append(ring[0])

        polygon_wkt = "POLYGON((" + ", ".join(f"{float(lon)} {float(lat)}" for lat, lon in ring) + "))"

        inside_sql = RawSQL(
            """
            ST_Intersects(
                ST_GeomFromText(%s, 4326),
                ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
            )
            """,
            (polygon_wkt,),
        )

        return queryset.filter(latitude__isnull=False, longitude__isnull=False).annotate(_inside=inside_sql).filter(_inside=True)[:limit]

    @classmethod
    def engine_status(cls) -> Dict[str, Any]:
        mode = cls._geo_engine_mode()
        postgis_available = cls._is_postgis_available()
        effective = 'postgis' if cls._use_postgis() else 'basic'

        return {
            'configured_mode': mode,
            'postgis_available': postgis_available,
            'effective_engine': effective,
        }

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

        if cls._use_postgis():
            try:
                return cls._search_nearby_postgis(
                    latitude=float(latitude),
                    longitude=float(longitude),
                    radius_km=float(radius_km),
                    limit=limit,
                    queryset=queryset,
                )
            except Exception:
                logger.exception("PostGIS nearby query failed. Falling back to basic geo engine.")

        return cls._search_nearby_basic(
            latitude=float(latitude),
            longitude=float(longitude),
            radius_km=float(radius_km),
            limit=limit,
            queryset=queryset,
        )
    @classmethod
    def search_in_polygon(
        cls,
        polygon: List[Tuple[float, float]],
        limit: int = 100,
        queryset: Optional[QuerySet] = None
    ) -> QuerySet:
        
        if queryset is None:
            queryset = Property.objects.published()

        if cls._use_postgis():
            try:
                return cls._search_in_polygon_postgis(
                    polygon=polygon,
                    limit=limit,
                    queryset=queryset,
                )
            except Exception:
                logger.exception("PostGIS polygon query failed. Falling back to basic geo engine.")

        return cls._search_in_polygon_basic(
            polygon=polygon,
            limit=limit,
            queryset=queryset,
        )
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
