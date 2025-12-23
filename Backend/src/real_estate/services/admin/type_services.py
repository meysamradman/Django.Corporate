from django.db.models import Count
from django.db import transaction
from django.core.exceptions import ValidationError
from src.real_estate.models.type import PropertyType
from src.real_estate.models.property import Property
from src.real_estate.messages.messages import TYPE_ERRORS


class PropertyTypeAdminService:
    
    @staticmethod
    def get_type_queryset(filters=None, search=None):
        queryset = PropertyType.objects.annotate(
            property_count=Count('properties', distinct=True)
        )
        
        if filters:
            if filters.get('is_active') is not None:
                queryset = queryset.filter(is_active=filters['is_active'])
        
        if search:
            queryset = queryset.filter(title__icontains=search)
        
        return queryset.order_by('display_order', 'title')
    
    @staticmethod
    def get_type_by_id(type_id):
        try:
            return PropertyType.objects.annotate(
                property_count=Count('properties', distinct=True)
            ).get(id=type_id)
        except PropertyType.DoesNotExist:
            return None
    
    @staticmethod
    def create_type(validated_data, created_by=None):
        with transaction.atomic():
            type_obj = PropertyType.objects.create(**validated_data)
        return type_obj
    
    @staticmethod
    def update_type_by_id(type_id, validated_data, updated_by=None):
        type_obj = PropertyTypeAdminService.get_type_by_id(type_id)
        
        if not type_obj:
            raise PropertyType.DoesNotExist(TYPE_ERRORS["type_not_found"])
        
        with transaction.atomic():
            for field, value in validated_data.items():
                setattr(type_obj, field, value)
            type_obj.save()
        
        return type_obj
    
    @staticmethod
    def delete_type_by_id(type_id):
        type_obj = PropertyTypeAdminService.get_type_by_id(type_id)
        
        if not type_obj:
            raise PropertyType.DoesNotExist(TYPE_ERRORS["type_not_found"])
        
        property_count = type_obj.properties.count()
        if property_count > 0:
            raise ValidationError(TYPE_ERRORS["type_has_properties"].format(count=property_count))
        
        with transaction.atomic():
            type_obj.delete()
    
    @staticmethod
    def bulk_delete_types(type_ids):
        types = PropertyType.objects.filter(id__in=type_ids)
        
        if not types.exists():
            raise ValidationError(TYPE_ERRORS["type_not_found"])
        
        with transaction.atomic():
            type_list = list(types)
            for type_obj in type_list:
                property_count = type_obj.properties.count()
                if property_count > 0:
                    raise ValidationError(TYPE_ERRORS["type_has_properties"].format(count=property_count))
            
            deleted_count = types.count()
            types.delete()
        
        return deleted_count

