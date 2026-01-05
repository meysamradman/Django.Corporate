from datetime import datetime
from django.db.models import Count
from django.db import transaction
from django.core.exceptions import ValidationError
from src.real_estate.models.state import PropertyState
from src.real_estate.messages.messages import STATE_ERRORS


class PropertyStateAdminService:
    
    @staticmethod
    def get_state_queryset(filters=None, search=None, date_from=None, date_to=None):
        queryset = PropertyState.objects.annotate(
            property_count=Count('properties', distinct=True)
        )
        
        if filters:
            if filters.get('is_active') is not None:
                queryset = queryset.filter(is_active=filters['is_active'])
            if filters.get('usage_type'):
                queryset = queryset.filter(usage_type=filters['usage_type'])
        
        if search:
            queryset = queryset.filter(title__icontains=search)
        
        # Date filters
        if date_from:
            try:
                date_from_obj = datetime.strptime(date_from, '%Y-%m-%d').date()
                queryset = queryset.filter(created_at__date__gte=date_from_obj)
            except ValueError:
                pass
        
        if date_to:
            try:
                date_to_obj = datetime.strptime(date_to, '%Y-%m-%d').date()
                queryset = queryset.filter(created_at__date__lte=date_to_obj)
            except ValueError:
                pass
        
        return queryset.order_by('title')
    
    @staticmethod
    def get_state_by_id(state_id):
        try:
            return PropertyState.objects.annotate(
                property_count=Count('properties', distinct=True)
            ).get(id=state_id)
        except PropertyState.DoesNotExist:
            return None
    
    @staticmethod
    def create_state(validated_data, created_by=None):
        with transaction.atomic():
            state_obj = PropertyState.objects.create(**validated_data)
        return state_obj
    
    @staticmethod
    def update_state_by_id(state_id, validated_data, updated_by=None):
        state_obj = PropertyStateAdminService.get_state_by_id(state_id)
        
        if not state_obj:
            raise PropertyState.DoesNotExist(STATE_ERRORS["state_not_found"])
        
        with transaction.atomic():
            for field, value in validated_data.items():
                setattr(state_obj, field, value)
            state_obj.save()
        
        return state_obj
    
    @staticmethod
    def delete_state_by_id(state_id):
        state_obj = PropertyStateAdminService.get_state_by_id(state_id)
        
        if not state_obj:
            raise PropertyState.DoesNotExist(STATE_ERRORS["state_not_found"])
        
        property_count = state_obj.properties.count()
        if property_count > 0:
            raise ValidationError(STATE_ERRORS["state_has_properties"].format(count=property_count))
        
        with transaction.atomic():
            state_obj.delete()
    
    @staticmethod
    def bulk_delete_states(state_ids):
        states = PropertyState.objects.filter(id__in=state_ids)
        
        if not states.exists():
            raise ValidationError(STATE_ERRORS["state_not_found"])
        
        with transaction.atomic():
            state_list = list(states)
            for state_obj in state_list:
                property_count = state_obj.properties.count()
                if property_count > 0:
                    raise ValidationError(STATE_ERRORS["state_has_properties"].format(count=property_count))
            
            deleted_count = states.count()
            states.delete()
        
        return deleted_count

