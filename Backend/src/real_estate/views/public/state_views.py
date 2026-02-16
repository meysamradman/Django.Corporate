from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from src.real_estate.services.public.state_services import PropertyStatePublicService
from src.real_estate.serializers.public.state_serializer import (
    PropertyStatePublicListSerializer,
    PropertyStatePublicDetailSerializer,
)


class PropertyStatePublicViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Public API ViewSet for Property States (e.g., Sale, Rent, Mortgage)
    
    Endpoints:
        GET /api/public/real-estate/states/ - List all active states
        GET /api/public/real-estate/states/{slug}/ - Get state detail by slug
        GET /api/public/real-estate/states/featured/ - Get featured states (top 3)
    
    No authentication required (AllowAny)
    """
    permission_classes = [AllowAny]
    serializer_class = PropertyStatePublicListSerializer
    lookup_field = 'slug'
    
    def get_queryset(self):
        """Get active property states using service layer"""
        filters = {}
        search = self.request.query_params.get('search', None)
        
        # Optional filters
        usage_type = self.request.query_params.get('usage_type', None)
        if usage_type:
            filters['usage_type'] = usage_type
        
        min_property_count = self.request.query_params.get('min_property_count', None)
        if min_property_count:
            try:
                filters['min_property_count'] = int(min_property_count)
            except (ValueError, TypeError):
                pass
        
        return PropertyStatePublicService.get_state_queryset(
            filters=filters,
            search=search
        )
    
    def get_serializer_class(self):
        """Use different serializers for list and detail"""
        if self.action == 'retrieve':
            return PropertyStatePublicDetailSerializer
        return PropertyStatePublicListSerializer
    
    def retrieve(self, request, slug=None):
        """Get single property state by slug"""
        state = PropertyStatePublicService.get_state_by_slug(slug)
        
        if not state:
            return Response(
                {'detail': 'Property state not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = self.get_serializer(state)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='featured')
    def featured(self, request):
        """
        Get featured property states (top 3 by property count)
        
        Query params:
            - limit: Number of states to return (default: 3, max: 10)
        """
        try:
            limit = int(request.query_params.get('limit', 3))
            limit = min(max(1, limit), 10)  # Between 1 and 10
        except (ValueError, TypeError):
            limit = 3
        
        states = PropertyStatePublicService.get_featured_states(limit=limit)
        serializer = self.get_serializer(states, many=True)
        
        return Response(serializer.data)
