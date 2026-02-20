from django.db.models import Count, Q

from src.core.models import Country, Province, City
from src.real_estate.models.location import CityRegion

class RealEstateLocationAdminService:
    @staticmethod
    def get_provinces_queryset(search=None, date_from=None, date_to=None, order_by='created_at', order_desc=True):
        queryset = Province.objects.filter(is_active=True).select_related('country')

        if search:
            queryset = queryset.filter(Q(name__icontains=search) | Q(code__icontains=search))

        if date_from:
            queryset = queryset.filter(created_at__date__gte=date_from)
        if date_to:
            queryset = queryset.filter(created_at__date__lte=date_to)

        direction = '-' if order_desc else ''
        allowed = {'created_at', 'updated_at', 'name', 'code'}
        order_field = order_by if order_by in allowed else 'created_at'
        return queryset.order_by(f'{direction}{order_field}')

    @staticmethod
    def get_province_by_id(province_id):
        return Province.objects.filter(id=province_id, is_active=True).first()

    @staticmethod
    def get_cities_queryset(
        province_id=None,
        has_properties=False,
        search=None,
        date_from=None,
        date_to=None,
        order_by='created_at',
        order_desc=True,
    ):
        queryset = City.objects.filter(is_active=True).select_related('province', 'province__country')

        if province_id:
            queryset = queryset.filter(province_id=province_id)

        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(code__icontains=search) |
                Q(province__name__icontains=search)
            )

        if date_from:
            queryset = queryset.filter(created_at__date__gte=date_from)
        if date_to:
            queryset = queryset.filter(created_at__date__lte=date_to)

        if has_properties:
            queryset = queryset.annotate(
                property_count=Count('real_estate_properties', filter=Q(real_estate_properties__is_active=True))
            ).filter(property_count__gt=0)

        direction = '-' if order_desc else ''
        allowed = {'created_at', 'updated_at', 'name', 'code', 'province_name'}
        if order_by == 'province_name':
            order_field = 'province__name'
        else:
            order_field = order_by if order_by in allowed else 'created_at'
        return queryset.order_by(f'{direction}{order_field}')

    @staticmethod
    def get_city_by_id(city_id):
        return City.objects.filter(id=city_id, is_active=True).select_related('province', 'province__country').first()

    @staticmethod
    def get_province_cities(province):
        return City.objects.filter(province=province, is_active=True).order_by('name')

    @staticmethod
    def get_city_regions_queryset(
        city_id=None,
        search=None,
        date_from=None,
        date_to=None,
        order_by='created_at',
        order_desc=True,
    ):
        queryset = CityRegion.objects.filter(is_active=True).select_related('city', 'city__province')
        if city_id:
            queryset = queryset.filter(city_id=city_id)

        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(code__icontains=search) |
                Q(city__name__icontains=search)
            )

        if date_from:
            queryset = queryset.filter(created_at__date__gte=date_from)
        if date_to:
            queryset = queryset.filter(created_at__date__lte=date_to)

        direction = '-' if order_desc else ''
        allowed = {'created_at', 'updated_at', 'name', 'code', 'city_name'}
        if order_by == 'city_name':
            order_field = 'city__name'
        else:
            order_field = order_by if order_by in allowed else 'created_at'
        return queryset.order_by(f'{direction}{order_field}')

    @staticmethod
    def get_city_regions_for_city(city):
        return CityRegion.objects.filter(city=city, is_active=True).order_by('code')

    @staticmethod
    def create_province(validated_data, created_by=None):
        province = Province.objects.create(
            country=Country.get_iran(),
            created_by=created_by,
            **validated_data,
        )
        return province

    @staticmethod
    def update_province(instance, validated_data):
        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.save()
        return instance

    @staticmethod
    def deactivate_province(instance):
        instance.is_active = False
        instance.save(update_fields=['is_active', 'updated_at'])
        return instance

    @staticmethod
    def create_city(validated_data, created_by=None):
        city = City.objects.create(created_by=created_by, **validated_data)
        return city

    @staticmethod
    def update_city(instance, validated_data):
        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.save()
        return instance

    @staticmethod
    def deactivate_city(instance):
        instance.is_active = False
        instance.save(update_fields=['is_active', 'updated_at'])
        return instance

    @staticmethod
    def create_region(validated_data, created_by=None):
        region = CityRegion.objects.create(created_by=created_by, **validated_data)
        return region

    @staticmethod
    def update_region(instance, validated_data):
        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.save()
        return instance

    @staticmethod
    def deactivate_region(instance):
        instance.is_active = False
        instance.save(update_fields=['is_active', 'updated_at'])
        return instance
