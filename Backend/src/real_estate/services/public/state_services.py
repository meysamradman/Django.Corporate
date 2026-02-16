from django.db.models import Count, Q
from src.real_estate.models.state import PropertyState


class PropertyStatePublicService:
    """Service layer for public Property State operations"""
    
    @staticmethod
    def get_state_queryset(filters=None, search=None):
        """
        Get queryset of active property states with property count
        
        Args:
            filters: Dict with optional filters (usage_type, min_property_count)
            search: Search term for title/slug
            
        Returns:
            Queryset of PropertyState objects
        """
        queryset = PropertyState.objects.filter(
            is_active=True
        ).select_related(
            'image'
        ).annotate(
            property_count=Count('properties', filter=Q(
                properties__is_active=True,
                properties__is_published=True
            ))
        )
        
        if filters:
            if filters.get('usage_type'):
                queryset = queryset.filter(usage_type=filters['usage_type'])
            if filters.get('min_property_count'):
                queryset = queryset.filter(property_count__gte=filters['min_property_count'])
        
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | Q(slug__icontains=search)
            )
        
        return queryset.order_by('title')
    
    @staticmethod
    def get_state_by_slug(slug):
        """
        Get single property state by slug
        
        Args:
            slug: URL slug of the property state
            
        Returns:
            PropertyState object or None
        """
        return PropertyState.objects.filter(
            slug=slug,
            is_active=True
        ).select_related(
            'image'
        ).annotate(
            property_count=Count('properties', filter=Q(
                properties__is_active=True,
                properties__is_published=True
            ))
        ).first()
    
    @staticmethod
    def get_state_by_id(state_id):
        """
        Get single property state by ID
        
        Args:
            state_id: ID of the property state
            
        Returns:
            PropertyState object or None
        """
        try:
            return PropertyState.objects.filter(
                is_active=True
            ).select_related(
                'image'
            ).annotate(
                property_count=Count('properties', filter=Q(
                    properties__is_active=True,
                    properties__is_published=True
                ))
            ).get(id=state_id)
        except PropertyState.DoesNotExist:
            return None
    
    @staticmethod
    def get_featured_states(limit=3):
        """
        Get featured property states (states with most properties)
        
        Args:
            limit: Maximum number of states to return
            
        Returns:
            Queryset of PropertyState objects
        """
        return PropertyState.objects.filter(
            is_active=True
        ).select_related(
            'image'
        ).annotate(
            property_count=Count('properties', filter=Q(
                properties__is_active=True,
                properties__is_published=True
            ))
        ).filter(
            property_count__gt=0
        ).order_by('-property_count', 'title')[:limit]
