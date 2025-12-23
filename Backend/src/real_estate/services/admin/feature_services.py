from django.db.models import Count
from django.db import transaction
from src.real_estate.models.feature import PropertyFeature
from src.real_estate.messages.messages import FEATURE_ERRORS


class PropertyFeatureAdminService:
    
    @staticmethod
    def get_feature_queryset(filters=None, search=None):
        queryset = PropertyFeature.objects.annotate(
            property_count=Count('properties', distinct=True)
        )
        
        if filters:
            if filters.get('is_active') is not None:
                queryset = queryset.filter(is_active=filters['is_active'])
            if filters.get('category'):
                queryset = queryset.filter(category=filters['category'])
        
        if search:
            queryset = queryset.filter(title__icontains=search)
        
        return queryset.order_by('category', 'title')
    
    @staticmethod
    def get_feature_by_id(feature_id):
        try:
            return PropertyFeature.objects.annotate(
                property_count=Count('properties', distinct=True)
            ).get(id=feature_id)
        except PropertyFeature.DoesNotExist:
            return None
    
    @staticmethod
    def create_feature(validated_data, created_by=None):
        with transaction.atomic():
            feature_obj = PropertyFeature.objects.create(**validated_data)
        return feature_obj
    
    @staticmethod
    def update_feature_by_id(feature_id, validated_data, updated_by=None):
        feature_obj = PropertyFeatureAdminService.get_feature_by_id(feature_id)
        
        if not feature_obj:
            raise PropertyFeature.DoesNotExist(FEATURE_ERRORS["feature_not_found"])
        
        with transaction.atomic():
            for field, value in validated_data.items():
                setattr(feature_obj, field, value)
            feature_obj.save()
        
        return feature_obj
    
    @staticmethod
    def delete_feature_by_id(feature_id):
        feature_obj = PropertyFeatureAdminService.get_feature_by_id(feature_id)
        
        if not feature_obj:
            raise PropertyFeature.DoesNotExist(FEATURE_ERRORS["feature_not_found"])
        
        with transaction.atomic():
            feature_obj.delete()

