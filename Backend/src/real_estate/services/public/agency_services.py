from datetime import datetime
from django.db.models import Count, Q

from src.real_estate.models.agency import RealEstateAgency
from src.real_estate.messages.messages import AGENCY_ERRORS


class RealEstateAgencyPublicService:
    """سرویس عمومی برای آژانس‌های املاک"""
    
    ALLOWED_ORDERING_FIELDS = {
        'rating',
        'total_reviews',
        'name',
        'created_at',
    }

    @staticmethod
    def _parse_int(value):
        """تبدیل به عدد صحیح"""
        try:
            return int(value)
        except (TypeError, ValueError):
            return None

    @staticmethod
    def _parse_float(value):
        """تبدیل به عدد اعشاری"""
        try:
            return float(value)
        except (TypeError, ValueError):
            return None

    @staticmethod
    def _parse_bool(value):
        """تبدیل به boolean"""
        if value is None:
            return None
        if isinstance(value, bool):
            return value
        if isinstance(value, str):
            return value.lower() in ('1', 'true', 'yes', 'on')
        return None

    @staticmethod
    def _normalize_ordering(ordering):
        """نرمال‌سازی فیلد مرتب‌سازی"""
        if not ordering:
            return ('-rating', 'name')

        candidate = ordering.split(',')[0].strip()
        descending = candidate.startswith('-')
        field = candidate[1:] if descending else candidate

        if field not in RealEstateAgencyPublicService.ALLOWED_ORDERING_FIELDS:
            return ('-rating', 'name')

        return (f"-{field}" if descending else field,)

    @staticmethod
    def _base_queryset():
        """QuerySet پایه برای آژانس‌های فعال"""
        return RealEstateAgency.objects.filter(
            is_active=True
        ).select_related(
            'province',
            'city',
            'profile_picture'
        ).prefetch_related(
            'agents',
            'social_media',
            'social_media__icon'
        ).annotate(
            property_count=Count(
                'properties',
                filter=Q(
                    properties__is_active=True,
                    properties__is_public=True,
                    properties__is_published=True,
                ),
                distinct=True,
            ),
            agent_count=Count(
                'agents',
                filter=Q(agents__is_active=True),
                distinct=True,
            )
        )

    @staticmethod
    def get_agency_queryset(filters=None, search=None, ordering=None):
        """دریافت لیست آژانس‌ها با فیلترها"""
        queryset = RealEstateAgencyPublicService._base_queryset()

        if filters:
            # فیلتر بر اساس استان
            province_id = RealEstateAgencyPublicService._parse_int(filters.get('province_id'))
            if province_id is not None:
                queryset = queryset.filter(province_id=province_id)

            # فیلتر بر اساس شهر
            city_id = RealEstateAgencyPublicService._parse_int(filters.get('city_id'))
            if city_id is not None:
                queryset = queryset.filter(city_id=city_id)

            # فیلتر بر اساس حداقل امتیاز
            min_rating = RealEstateAgencyPublicService._parse_float(filters.get('min_rating'))
            if min_rating is not None:
                queryset = queryset.filter(rating__gte=min_rating)

            # فیلتر بر اساس حداقل تعداد مشاورین
            min_agents = RealEstateAgencyPublicService._parse_int(filters.get('min_agents'))
            if min_agents is not None:
                queryset = queryset.filter(agent_count__gte=min_agents)

            # فیلتر بر اساس حداقل تعداد املاک
            min_properties = RealEstateAgencyPublicService._parse_int(filters.get('min_properties'))
            if min_properties is not None:
                queryset = queryset.filter(property_count__gte=min_properties)

        # جستجو در نام، توضیحات و آدرس
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search) |
                Q(address__icontains=search) |
                Q(license_number__icontains=search)
            )

        # مرتب‌سازی
        queryset = queryset.order_by(*RealEstateAgencyPublicService._normalize_ordering(ordering))
        return queryset.distinct()

    @staticmethod
    def get_agency_by_slug(slug):
        """دریافت آژانس با slug"""
        try:
            return RealEstateAgencyPublicService._base_queryset().get(slug=slug)
        except RealEstateAgency.DoesNotExist:
            return None

    @staticmethod
    def get_agency_by_public_id(public_id):
        """دریافت آژانس با public_id"""
        try:
            return RealEstateAgencyPublicService._base_queryset().get(public_id=public_id)
        except RealEstateAgency.DoesNotExist:
            return None

    @staticmethod
    def get_agency_by_id(agency_id):
        """دریافت آژانس با id"""
        try:
            return RealEstateAgencyPublicService._base_queryset().get(id=agency_id)
        except RealEstateAgency.DoesNotExist:
            return None

    @staticmethod
    def get_featured_agencies(limit=6):
        """دریافت آژانس‌های برجسته (با امتیاز بالا)"""
        return RealEstateAgencyPublicService._base_queryset().order_by('-rating', '-total_reviews')[:limit]

    @staticmethod
    def get_top_rated_agencies(limit=10):
        """دریافت آژانس‌ها با بالاترین امتیاز"""
        return RealEstateAgencyPublicService._base_queryset().filter(
            rating__gte=4.0
        ).order_by('-rating', '-total_reviews')[:limit]

    @staticmethod
    def get_agencies_by_city(city_id, limit=None):
        """دریافت آژانس‌های یک شهر"""
        queryset = RealEstateAgencyPublicService._base_queryset().filter(
            city_id=city_id
        ).order_by('-rating', 'name')
        
        if limit:
            queryset = queryset[:limit]
        
        return queryset

    @staticmethod
    def get_agencies_by_province(province_id, limit=None):
        """دریافت آژانس‌های یک استان"""
        queryset = RealEstateAgencyPublicService._base_queryset().filter(
            province_id=province_id
        ).order_by('-rating', 'name')
        
        if limit:
            queryset = queryset[:limit]
        
        return queryset

    @staticmethod
    def get_agency_with_agents(slug_or_id):
        """دریافت آژانس با لیست مشاورین"""
        try:
            # Try by slug first
            if isinstance(slug_or_id, str):
                agency = RealEstateAgencyPublicService._base_queryset().prefetch_related(
                    'agents__user__admin_profile'
                ).get(slug=slug_or_id)
            else:
                # Try by ID
                agency = RealEstateAgencyPublicService._base_queryset().prefetch_related(
                    'agents__user__admin_profile'
                ).get(id=slug_or_id)
            
            return {
                'agency': agency,
                'agents': agency.agents.filter(is_active=True).select_related(
                    'user', 'user__admin_profile'
                ).order_by('-rating', '-total_sales')
            }
        except RealEstateAgency.DoesNotExist:
            return None

    @staticmethod
    def get_agency_statistics(agency_id):
        """دریافت آمار یک آژانس"""
        from django.db.models import Sum, Avg
        
        try:
            agency = RealEstateAgency.objects.get(id=agency_id, is_active=True)
        except RealEstateAgency.DoesNotExist:
            return None
        
        # آمار مشاورین
        agents_stats = agency.agents.filter(is_active=True).aggregate(
            total_agents=Count('id'),
            verified_agents=Count('id', filter=Q(is_verified=True)),
            avg_agent_rating=Avg('rating'),
            total_sales_by_agents=Sum('total_sales'),
        )
        
        # آمار املاک
        properties_stats = agency.properties.filter(
            is_active=True, is_published=True
        ).aggregate(
            total_properties=Count('id'),
            featured_properties=Count('id', filter=Q(is_featured=True)),
        )
        
        return {
            'agency_id': agency.id,
            'agency_name': agency.name,
            'rating': agency.rating,
            'total_reviews': agency.total_reviews,
            **agents_stats,
            **properties_stats
        }

    @staticmethod
    def search_agencies(query, filters=None):
        """جستجوی پیشرفته آژانس‌ها"""
        queryset = RealEstateAgencyPublicService._base_queryset()
        
        if query:
            queryset = queryset.filter(
                Q(name__icontains=query) |
                Q(description__icontains=query) |
                Q(address__icontains=query) |
                Q(license_number__icontains=query) |
                Q(city__name__icontains=query) |
                Q(province__name__icontains=query)
            )
        
        if filters:
            min_rating = RealEstateAgencyPublicService._parse_float(filters.get('min_rating'))
            if min_rating is not None:
                queryset = queryset.filter(rating__gte=min_rating)
            
            city_id = RealEstateAgencyPublicService._parse_int(filters.get('city_id'))
            if city_id is not None:
                queryset = queryset.filter(city_id=city_id)
        
        return queryset.order_by('-rating', 'name').distinct()

    @staticmethod
    def get_nearby_agencies(latitude, longitude, radius_km=10, limit=10):
        """دریافت آژانس‌های نزدیک (در صورت وجود مختصات جغرافیایی)"""
        # این متد می‌تواند در آینده با استفاده از GeoDjango پیاده‌سازی شود
        # فعلاً یک پیاده‌سازی ساده برگشت می‌دهیم
        return RealEstateAgencyPublicService._base_queryset().order_by('-rating')[:limit]
