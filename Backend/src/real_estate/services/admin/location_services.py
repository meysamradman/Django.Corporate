from django.db.models import Count, Q

from src.core.models import Province, City
from src.real_estate.models.location import CityRegion


class RealEstateLocationAdminService:
    @staticmethod
    def get_provinces_queryset():
        return Province.objects.filter(is_active=True).select_related('country').order_by('country__name', 'name')

    @staticmethod
    def get_province_by_id(province_id):
        return Province.objects.filter(id=province_id, is_active=True).first()

    @staticmethod
    def get_cities_queryset(province_id=None, has_properties=False):
        queryset = City.objects.filter(is_active=True).select_related('province', 'province__country').order_by('province__name', 'name')

        if province_id:
            queryset = queryset.filter(province_id=province_id)

        if has_properties:
            queryset = queryset.annotate(
                property_count=Count('real_estate_properties', filter=Q(real_estate_properties__is_active=True))
            ).filter(property_count__gt=0)

        return queryset

    @staticmethod
    def get_city_by_id(city_id):
        return City.objects.filter(id=city_id, is_active=True).select_related('province', 'province__country').first()

    @staticmethod
    def get_province_cities(province):
        return City.objects.filter(province=province, is_active=True).order_by('name')

    @staticmethod
    def get_city_regions_queryset(city_id=None):
        queryset = CityRegion.objects.filter(is_active=True).select_related('city', 'city__province').order_by('city', 'code')
        if city_id:
            queryset = queryset.filter(city_id=city_id)
        return queryset

    @staticmethod
    def get_city_regions_for_city(city):
        return CityRegion.objects.filter(city=city, is_active=True).order_by('code')
