from datetime import datetime
from django.db.models import Count
from django.db import transaction
from django.core.exceptions import ValidationError
from src.real_estate.models.label import PropertyLabel
from src.real_estate.messages.messages import LABEL_ERRORS

class PropertyLabelAdminService:
    
    @staticmethod
    def get_label_queryset(filters=None, search=None, date_from=None, date_to=None):
        queryset = PropertyLabel.objects.annotate(
            property_count=Count('properties', distinct=True)
        )
        
        if filters:
            if filters.get('is_active') is not None:
                queryset = queryset.filter(is_active=filters['is_active'])
        
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
    def get_label_by_id(label_id):
        try:
            return PropertyLabel.objects.annotate(
                property_count=Count('properties', distinct=True)
            ).get(id=label_id)
        except PropertyLabel.DoesNotExist:
            return None
    
    @staticmethod
    def create_label(validated_data, created_by=None):
        with transaction.atomic():
            label_obj = PropertyLabel.objects.create(**validated_data)
        return label_obj
    
    @staticmethod
    def update_label_by_id(label_id, validated_data, updated_by=None):
        label_obj = PropertyLabelAdminService.get_label_by_id(label_id)
        
        if not label_obj:
            raise PropertyLabel.DoesNotExist(LABEL_ERRORS["label_not_found"])
        
        with transaction.atomic():
            for field, value in validated_data.items():
                setattr(label_obj, field, value)
            label_obj.save()
        
        return label_obj
    
    @staticmethod
    def delete_label_by_id(label_id):
        label_obj = PropertyLabelAdminService.get_label_by_id(label_id)
        
        if not label_obj:
            raise PropertyLabel.DoesNotExist(LABEL_ERRORS["label_not_found"])
        
        with transaction.atomic():
            label_obj.delete()

