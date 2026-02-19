from datetime import datetime
from django.db.models import Count
from django.db import transaction
from django.core.exceptions import ValidationError
from src.core.cache import CacheService
from src.real_estate.models.state import PropertyState
from src.real_estate.messages.messages import STATE_ERRORS
from src.media.models.media import ImageMedia
from src.real_estate.utils.cache_shared import hash_payload
from src.real_estate.utils.cache_ttl import ADMIN_TAXONOMY_LIST_TTL

class PropertyStateAdminService:

    @staticmethod
    def _normalize_query_params(query_params):
        if hasattr(query_params, 'lists'):
            normalized = {}
            for key, values in sorted(query_params.lists()):
                if not values:
                    normalized[key] = None
                elif len(values) == 1:
                    normalized[key] = values[0]
                else:
                    normalized[key] = values
            return normalized

        if isinstance(query_params, dict):
            return {key: query_params[key] for key in sorted(query_params.keys())}

        return {}

    @staticmethod
    def get_list_cache_key(user_id, query_params):
        payload = {
            'user_id': user_id,
            'query_params': PropertyStateAdminService._normalize_query_params(query_params),
        }
        return f"admin:real_estate:state:list:{hash_payload(payload)}"

    @staticmethod
    def get_cached_list_payload(user_id, query_params):
        cache_key = PropertyStateAdminService.get_list_cache_key(user_id, query_params)
        return CacheService.get(cache_key)

    @staticmethod
    def set_cached_list_payload(user_id, query_params, payload):
        cache_key = PropertyStateAdminService.get_list_cache_key(user_id, query_params)
        CacheService.set(cache_key, payload, timeout=ADMIN_TAXONOMY_LIST_TTL)

    @staticmethod
    def invalidate_list_cache():
        return CacheService.delete_pattern("admin:real_estate:state:list:*")
    
    @staticmethod
    def get_state_queryset(filters=None, search=None, date_from=None, date_to=None):
        queryset = PropertyState.objects.select_related('image').annotate(
            property_count=Count('properties', distinct=True)
        )
        
        if filters:
            if filters.get('is_active') is not None:
                queryset = queryset.filter(is_active=filters['is_active'])
            if filters.get('usage_type'):
                queryset = queryset.filter(usage_type=filters['usage_type'])
        
        if search:
            queryset = queryset.filter(title__icontains=search)
        
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
            return PropertyState.objects.select_related('image').annotate(
                property_count=Count('properties', distinct=True)
            ).get(id=state_id)
        except PropertyState.DoesNotExist:
            return None
    
    @staticmethod
    def create_state(validated_data, created_by=None):
        with transaction.atomic():
            image_id = validated_data.pop('image_id', None)
            state_obj = PropertyState.objects.create(**validated_data)

            if image_id:
                try:
                    media = ImageMedia.objects.get(id=image_id)
                    state_obj.image = media
                    state_obj.save(update_fields=['image', 'updated_at'])
                except ImageMedia.DoesNotExist:
                    pass
            PropertyStateAdminService.invalidate_list_cache()
        return state_obj
    
    @staticmethod
    def update_state_by_id(state_id, validated_data, updated_by=None):
        state_obj = PropertyStateAdminService.get_state_by_id(state_id)
        
        if not state_obj:
            raise PropertyState.DoesNotExist(STATE_ERRORS["state_not_found"])
        
        with transaction.atomic():
            image_id = validated_data.pop('image_id', None)

            for field, value in validated_data.items():
                setattr(state_obj, field, value)

            if image_id is not None:
                if image_id:
                    try:
                        media = ImageMedia.objects.get(id=image_id)
                        state_obj.image = media
                    except ImageMedia.DoesNotExist:
                        pass
                else:
                    state_obj.image = None

            state_obj.save()

        PropertyStateAdminService.invalidate_list_cache()
        
        return state_obj
    
    @staticmethod
    def delete_state_by_id(state_id):
        state_obj = PropertyStateAdminService.get_state_by_id(state_id)
        
        if not state_obj:
            raise PropertyState.DoesNotExist(STATE_ERRORS["state_not_found"])

        with transaction.atomic():
            state_obj.delete()
        PropertyStateAdminService.invalidate_list_cache()
    
    @staticmethod
    def bulk_delete_states(state_ids):
        states = PropertyState.objects.filter(id__in=state_ids)
        
        if not states.exists():
            raise ValidationError({'ids': [STATE_ERRORS["states_not_found"]]})
        
        with transaction.atomic():
            state_list = list(states)
            for state_obj in state_list:
                property_count = state_obj.properties.count()
                if property_count > 0:
                    raise ValidationError({
                        'non_field_errors': [
                            STATE_ERRORS["state_has_properties"].format(count=property_count)
                        ]
                    })
            
            deleted_count = states.count()
            states.delete()

        PropertyStateAdminService.invalidate_list_cache()
        
        return deleted_count

