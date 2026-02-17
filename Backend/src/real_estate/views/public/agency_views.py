from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import AllowAny

from src.core.pagination import StandardLimitPagination
from src.core.responses.response import APIResponse
from src.real_estate.serializers.public.agency_serializer import (
    RealEstateAgencyPublicListSerializer,
    RealEstateAgencyPublicDetailSerializer,
)
from src.real_estate.serializers.public.agent_serializer import (
    PropertyAgentPublicListSerializer,
)
from src.real_estate.services.public.agency_services import RealEstateAgencyPublicService
from src.real_estate.messages.messages import AGENCY_SUCCESS, AGENCY_ERRORS


class RealEstateAgencyPublicViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Public API for Real Estate Agencies
    
    list: Get paginated list of active agencies
    retrieve: Get single agency by slug
    featured: Get featured/top rated agencies
    top_rated: Get top rated agencies
    by_city: Get agencies by city
    by_province: Get agencies by province
    """
    permission_classes = [AllowAny]
    pagination_class = StandardLimitPagination
    lookup_field = 'slug'
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description', 'address']
    ordering_fields = ['rating', 'total_reviews', 'created_at', 'name']
    ordering = ['-rating', '-total_reviews']
    
    def get_queryset(self):
        filters = {
            'province_id': self.request.query_params.get('province_id'),
            'city_id': self.request.query_params.get('city_id'),
            'min_rating': self.request.query_params.get('min_rating'),
            'min_agents': self.request.query_params.get('min_agents'),
            'min_properties': self.request.query_params.get('min_properties'),
        }
        search = self.request.query_params.get('search')
        ordering = self.request.query_params.get('ordering')
        
        return RealEstateAgencyPublicService.get_agency_queryset(
            filters=filters,
            search=search,
            ordering=ordering
        )
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return RealEstateAgencyPublicDetailSerializer
        return RealEstateAgencyPublicListSerializer
    
    def list(self, request, *args, **kwargs):
        """لیست آژانس‌های فعال"""
        filters = {
            'province_id': request.query_params.get('province_id'),
            'city_id': request.query_params.get('city_id'),
            'min_rating': request.query_params.get('min_rating'),
            'min_agents': request.query_params.get('min_agents'),
            'min_properties': request.query_params.get('min_properties'),
        }
        search = request.query_params.get('search')
        ordering = request.query_params.get('ordering')

        data = RealEstateAgencyPublicService.get_agency_list_data(filters=filters, search=search, ordering=ordering)

        page = self.paginate_queryset(data)
        if page is not None:
            return self.get_paginated_response(page)

        return APIResponse.success(
            message=AGENCY_SUCCESS["agency_list_success"],
            data=data,
            status_code=status.HTTP_200_OK
        )
    
    def retrieve(self, request, *args, **kwargs):
        """دریافت جزئیات آژانس با slug"""
        slug = kwargs.get('slug')
        agency_data = RealEstateAgencyPublicService.get_agency_detail_by_slug_data(slug)
        
        if not agency_data:
            return APIResponse.error(
                message=AGENCY_ERRORS["agency_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )

        return APIResponse.success(
            message=AGENCY_SUCCESS["agency_retrieved"],
            data=agency_data,
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['get'], url_path='featured')
    def featured(self, request):
        """دریافت آژانس‌های برجسته (با امتیاز بالا)"""
        limit = self._parse_positive_int(request.query_params.get('limit'), default=6, max_value=50)
        data = RealEstateAgencyPublicService.get_featured_agencies_data(limit=limit)

        return APIResponse.success(
            message=AGENCY_SUCCESS["agency_list_success"],
            data=data,
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['get'], url_path='top-rated')
    def top_rated(self, request):
        """دریافت آژانس‌ها با بالاترین امتیاز"""
        limit = self._parse_positive_int(request.query_params.get('limit'), default=10, max_value=50)
        data = RealEstateAgencyPublicService.get_top_rated_agencies_data(limit=limit)

        return APIResponse.success(
            message=AGENCY_SUCCESS["agency_list_success"],
            data=data,
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['get'], url_path='by-city/(?P<city_id>[^/.]+)')
    def by_city(self, request, city_id=None):
        """دریافت آژانس‌های یک شهر"""
        limit = request.query_params.get('limit')
        limit = self._parse_positive_int(limit, default=None, max_value=100, allow_none=True)

        data = RealEstateAgencyPublicService.get_agencies_by_city_data(city_id=city_id, limit=limit)

        return APIResponse.success(
            message=AGENCY_SUCCESS["agency_list_success"],
            data=data,
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['get'], url_path='by-province/(?P<province_id>[^/.]+)')
    def by_province(self, request, province_id=None):
        """دریافت آژانس‌های یک استان"""
        limit = request.query_params.get('limit')
        limit = self._parse_positive_int(limit, default=None, max_value=100, allow_none=True)

        data = RealEstateAgencyPublicService.get_agencies_by_province_data(province_id=province_id, limit=limit)

        return APIResponse.success(
            message=AGENCY_SUCCESS["agency_list_success"],
            data=data,
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['get'], url_path='statistics')
    def statistics(self, request, slug=None):
        """دریافت آمار آژانس"""
        agency = RealEstateAgencyPublicService.get_agency_by_slug(slug)
        
        if not agency:
            return APIResponse.error(
                message=AGENCY_ERRORS["agency_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        stats = RealEstateAgencyPublicService.get_agency_statistics_data(agency.id)
        
        if not stats:
            return APIResponse.error(
                message=AGENCY_ERRORS["agency_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        return APIResponse.success(
            message=AGENCY_SUCCESS["agency_statistics_retrieved"],
            data=stats,
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['get'], url_path='with-agents')
    def with_agents(self, request, slug=None):
        """دریافت آژانس با لیست کامل مشاورین"""
        agency_data = RealEstateAgencyPublicService.get_agency_with_agents_data(slug)
        
        if not agency_data:
            return APIResponse.error(
                message=AGENCY_ERRORS["agency_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        return APIResponse.success(
            message=AGENCY_SUCCESS["agency_retrieved"],
            data=agency_data,
            status_code=status.HTTP_200_OK
        )

    @staticmethod
    def _parse_positive_int(value, default, max_value=100, allow_none=False):
        if allow_none and value in (None, ''):
            return None
        try:
            parsed = int(value)
        except (TypeError, ValueError):
            return default

        if parsed < 1:
            return default
        return min(parsed, max_value)
