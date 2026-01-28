from datetime import datetime
from django.db.models import Count
from django.db import transaction
from src.real_estate.models.feature import PropertyFeature
from src.real_estate.messages.messages import FEATURE_ERRORS
from src.media.models.media import ImageMedia

class PropertyFeatureAdminService:
    
    @staticmethod
    def get_feature_queryset(filters=None, search=None, date_from=None, date_to=None):
        queryset = PropertyFeature.objects.annotate(
            property_count=Count('properties', distinct=True)
        )
        
        if filters:
            if filters.get('is_active') is not None:
                queryset = queryset.filter(is_active=filters['is_active'])
            if filters.get('group'):
                queryset = queryset.filter(group=filters['group'])
        
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
        
        return queryset.order_by('group', 'title')
    
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
            image_id = validated_data.pop('image_id', None)
            feature_obj = PropertyFeature.objects.create(**validated_data)
            
            if image_id:
                try:
                    image = ImageMedia.objects.get(id=image_id)
                    feature_obj.image = image
                    feature_obj.save()
                except ImageMedia.DoesNotExist:
                    pass
        
        return feature_obj
    
    @staticmethod
    def update_feature_by_id(feature_id, validated_data, updated_by=None):
        feature_obj = PropertyFeatureAdminService.get_feature_by_id(feature_id)
        
        if not feature_obj:
            raise PropertyFeature.DoesNotExist(FEATURE_ERRORS["feature_not_found"])
        
        with transaction.atomic():
            image_id = validated_data.pop('image_id', None)
            
            for field, value in validated_data.items():
                setattr(feature_obj, field, value)
            
            if image_id is not None:
                if image_id == 0 or image_id == '':
                    feature_obj.image = None
                else:
                    try:
                        image = ImageMedia.objects.get(id=image_id)
                        feature_obj.image = image
                    except ImageMedia.DoesNotExist:
                        pass
            
            feature_obj.save()
        
        return feature_obj
    
    @staticmethod
    def delete_feature_by_id(feature_id):
        feature_obj = PropertyFeatureAdminService.get_feature_by_id(feature_id)
        
        if not feature_obj:
            raise PropertyFeature.DoesNotExist(FEATURE_ERRORS["feature_not_found"])
        
        with transaction.atomic():
            feature_obj.delete()

