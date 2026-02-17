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
    """
    Public API for Property Agents
    
    list: Get paginated list of active agents
    retrieve: Get single agent by slug
    featured: Get featured/top rated agents
    top_rated: Get top rated agents
    search: Advanced search for agents
    """
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
        """لیست مشاورین فعال"""
        queryset = self.filter_queryset(self.get_queryset())
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return APIResponse.success(
            message=AGENT_SUCCESS["agent_list_success"],
            data=serializer.data,
            status_code=status.HTTP_200_OK
        )
    
    def retrieve(self, request, *args, **kwargs):
        """دریافت جزئیات مشاور با slug"""
        slug = kwargs.get('slug')
        agent = PropertyAgentPublicService.get_agent_by_slug(slug)
        
        if not agent:
            return APIResponse.error(
                message=AGENT_ERRORS["agent_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        serializer = self.get_serializer(agent)
        return APIResponse.success(
            message=AGENT_SUCCESS["agent_retrieved"],
            data=serializer.data,
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['get'], url_path='featured')
    def featured(self, request):
        """دریافت مشاورین برجسته (تایید شده با امتیاز بالا)"""
        limit = int(request.query_params.get('limit', 6))
        agents = PropertyAgentPublicService.get_featured_agents(limit=limit)
        
        serializer = self.get_serializer(agents, many=True)
        return APIResponse.success(
            message=AGENT_SUCCESS["agent_list_success"],
            data=serializer.data,
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['get'], url_path='top-rated')
    def top_rated(self, request):
        """دریافت مشاورین با بالاترین امتیاز"""
        limit = int(request.query_params.get('limit', 10))
        agents = PropertyAgentPublicService.get_top_rated_agents(limit=limit)
        
        serializer = self.get_serializer(agents, many=True)
        return APIResponse.success(
            message=AGENT_SUCCESS["agent_list_success"],
            data=serializer.data,
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['get'], url_path='by-agency/(?P<agency_id>[^/.]+)')
    def by_agency(self, request, agency_id=None):
        """دریافت مشاورین یک آژانس"""
        limit = request.query_params.get('limit')
        limit = int(limit) if limit else None
        
        agents = PropertyAgentPublicService.get_agents_by_agency(
            agency_id=agency_id,
            limit=limit
        )
        
        serializer = self.get_serializer(agents, many=True)
        return APIResponse.success(
            message=AGENT_SUCCESS["agent_list_success"],
            data=serializer.data,
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['get'], url_path='statistics')
    def statistics(self, request, slug=None):
        """دریافت آمار مشاور"""
        agent = PropertyAgentPublicService.get_agent_by_slug(slug)
        
        if not agent:
            return APIResponse.error(
                message=AGENT_ERRORS["agent_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        stats = PropertyAgentPublicService.get_agent_statistics(agent.id)
        
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

