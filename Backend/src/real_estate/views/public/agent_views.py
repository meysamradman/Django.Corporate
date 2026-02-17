from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import AllowAny

from src.core.pagination import StandardLimitPagination
from src.core.responses.response import APIResponse
from src.real_estate.serializers.public.agent_serializer import (
    PropertyAgentPublicListSerializer,
    PropertyAgentPublicDetailSerializer,
)
from src.real_estate.services.public.agent_services import PropertyAgentPublicService
from src.real_estate.messages.messages import AGENT_SUCCESS, AGENT_ERRORS

class PropertyAgentPublicViewSet(viewsets.ReadOnlyModelViewSet):

    permission_classes = [AllowAny]
    pagination_class = StandardLimitPagination
    lookup_field = 'slug'
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['user__admin_profile__first_name', 'user__admin_profile__last_name', 'specialization', 'bio']
    ordering_fields = ['rating', 'total_sales', 'total_reviews', 'created_at']
    ordering = ['-rating', '-total_reviews']
    
    def get_queryset(self):
        filters = {
            'agency_id': self.request.query_params.get('agency_id'),
            'is_verified': self.request.query_params.get('is_verified'),
            'specialization': self.request.query_params.get('specialization'),
            'min_rating': self.request.query_params.get('min_rating'),
            'city_id': self.request.query_params.get('city_id'),
            'province_id': self.request.query_params.get('province_id'),
        }
        search = self.request.query_params.get('search')
        ordering = self.request.query_params.get('ordering')
        
        return PropertyAgentPublicService.get_agent_queryset(
            filters=filters,
            search=search,
            ordering=ordering
        )
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return PropertyAgentPublicDetailSerializer
        return PropertyAgentPublicListSerializer
    
    def list(self, request, *args, **kwargs):

        filters = {
            'agency_id': request.query_params.get('agency_id'),
            'is_verified': request.query_params.get('is_verified'),
            'specialization': request.query_params.get('specialization'),
            'min_rating': request.query_params.get('min_rating'),
            'city_id': request.query_params.get('city_id'),
            'province_id': request.query_params.get('province_id'),
        }
        search = request.query_params.get('search')
        ordering = request.query_params.get('ordering')

        data = PropertyAgentPublicService.get_agent_list_data(filters=filters, search=search, ordering=ordering)
        page = self.paginate_queryset(data)
        if page is not None:
            return self.get_paginated_response(page)

        return APIResponse.success(
            message=AGENT_SUCCESS["agent_list_success"],
            data=data,
            status_code=status.HTTP_200_OK
        )
    
    def retrieve(self, request, *args, **kwargs):

        slug = kwargs.get('slug')
        agent_data = PropertyAgentPublicService.get_agent_detail_by_slug_data(slug)
        
        if not agent_data:
            return APIResponse.error(
                message=AGENT_ERRORS["agent_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )

        return APIResponse.success(
            message=AGENT_SUCCESS["agent_retrieved"],
            data=agent_data,
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['get'], url_path='featured')
    def featured(self, request):

        limit = self._parse_positive_int(request.query_params.get('limit'), default=6, max_value=50)
        data = PropertyAgentPublicService.get_featured_agents_data(limit=limit)

        return APIResponse.success(
            message=AGENT_SUCCESS["agent_list_success"],
            data=data,
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['get'], url_path='top-rated')
    def top_rated(self, request):

        limit = self._parse_positive_int(request.query_params.get('limit'), default=10, max_value=50)
        data = PropertyAgentPublicService.get_top_rated_agents_data(limit=limit)

        return APIResponse.success(
            message=AGENT_SUCCESS["agent_list_success"],
            data=data,
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['get'], url_path='by-agency/(?P<agency_id>[^/.]+)')
    def by_agency(self, request, agency_id=None):

        limit = request.query_params.get('limit')
        limit = self._parse_positive_int(limit, default=None, max_value=100, allow_none=True)

        data = PropertyAgentPublicService.get_agents_by_agency_data(agency_id=agency_id, limit=limit)

        return APIResponse.success(
            message=AGENT_SUCCESS["agent_list_success"],
            data=data,
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['get'], url_path='statistics')
    def statistics(self, request, slug=None):

        agent = PropertyAgentPublicService.get_agent_by_slug(slug)
        
        if not agent:
            return APIResponse.error(
                message=AGENT_ERRORS["agent_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        stats = PropertyAgentPublicService.get_agent_statistics_data(agent.id)
        
        if not stats:
            return APIResponse.error(
                message=AGENT_ERRORS["agent_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        return APIResponse.success(
            message=AGENT_SUCCESS["agent_statistics_retrieved"],
            data=stats,
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

