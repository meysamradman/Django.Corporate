from typing import List, Tuple, Optional, Dict, Any
from decimal import Decimal
from django.db.models import QuerySet
from src.real_estate.models.property import Property
import math


class PropertyGeoService:
    """
    سرویس جستجوی جغرافیایی املاک (استفاده از PostgreSQL معمولی)
    از bbox و محاسبات ساده برای عملکرد بهتر استفاده می‌کند
    """

    @classmethod
    def search_nearby(
        cls,
        latitude: float,
        longitude: float,
        radius_km: float = 2.0,
        limit: int = 20,
        queryset: Optional[QuerySet] = None
    ) -> QuerySet:
        """
        جستجوی املاک نزدیک با bbox بهینه‌شده
        
        Args:
            latitude: عرض جغرافیایی
            longitude: طول جغرافیایی
            radius_km: شعاع به کیلومتر (پیش‌فرض 2)
            limit: حداکثر تعداد نتایج
            queryset: QuerySet اولیه (اختیاری)
            
        Returns:
            QuerySet املاک در محدوده bbox
        """
        if queryset is None:
            queryset = Property.objects.published()
        
        # محاسبه bbox بهینه با تصحیح longitude
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
        """
        جستجوی املاک در یک چندضلعی - استفاده از bbox ساده
        
        Args:
            polygon: لیست مختصات چندضلعی [(lat, lon), ...]
            limit: حداکثر تعداد نتایج
            queryset: QuerySet اولیه (اختیاری)
            
        Returns:
            QuerySet املاک در bbox چندضلعی
        """
        if queryset is None:
            queryset = Property.objects.published()
        
        # استخراج bbox از مختصات
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
        """
        جستجوی املاک در یک bbox (مستطیل)
        
        Args:
            min_lat: حداقل عرض جغرافیایی
            max_lat: حداکثر عرض جغرافیایی
            min_lon: حداقل طول جغرافیایی
            max_lon: حداکثر طول جغرافیایی
            limit: حداکثر تعداد نتایج
            queryset: QuerySet اولیه (اختیاری)
            
        Returns:
            QuerySet املاک در bbox
        """
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
        """
        محاسبه فاصله بین دو نقطه با فرمول Haversine
        
        Args:
            lat1, lon1: مختصات نقطه اول
            lat2, lon2: مختصات نقطه دوم
            
        Returns:
            فاصله به کیلومتر
        """
        return cls._haversine_distance(lat1, lon1, lat2, lon2)

    @classmethod
    def _haversine_distance(
        cls,
        lat1: float,
        lon1: float,
        lat2: float,
        lon2: float
    ) -> float:
        """
        محاسبه فاصله با فرمول Haversine (دقیق)
        
        Returns:
            فاصله به کیلومتر
        """
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
        """
        دریافت مختصات یک ملک
        
        Returns:
            Tuple (latitude, longitude) یا None
        """
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
        دریافت املاک در محدوده مستطیلی برای نقشه
        با فیلدهای بهینه برای نمایش
        """
        if queryset is None:
            queryset = Property.objects.published()
        
        # فیلتر bbox
        properties = cls.search_in_bbox(
            min_lat=float(min_lat),
            max_lat=float(max_lat),
            min_lon=float(min_lon),
            max_lon=float(max_lon),
            limit=limit,
            queryset=queryset
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
            'is_featured'
        ))
