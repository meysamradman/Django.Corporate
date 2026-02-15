from django.db.models import Count, Q
from django.db import transaction
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.utils.text import slugify
from datetime import datetime
from src.real_estate.models.tag import PropertyTag
from src.real_estate.models.property import Property
from src.real_estate.utils.cache import PropertyTagCacheManager, PropertyTagCacheKeys
from src.real_estate.messages.messages import TAG_ERRORS

class PropertyTagAdminService:
    
    @staticmethod
    def get_tag_queryset(filters=None, search=None, date_from=None, date_to=None):
        queryset = PropertyTag.objects.annotate(
            property_count=Count('properties', distinct=True)
        )
        
        if filters:
            if filters.get('is_active') is not None:
                queryset = queryset.filter(is_active=filters['is_active'])
            if filters.get('is_public') is not None:
                queryset = queryset.filter(is_public=filters['is_public'])
        
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(description__icontains=search)
            )
        
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
        
        return queryset.order_by('-property_count', 'title')
    
    @staticmethod
    def get_tag_by_id(tag_id):
        cache_key = PropertyTagCacheKeys.tag(tag_id)
        cached_data = cache.get(cache_key)
        
        if cached_data:
            try:
                return PropertyTag.objects.annotate(
                    property_count=Count('properties', distinct=True)
                ).get(id=tag_id)
            except PropertyTag.DoesNotExist:
                cache.delete(cache_key)
                return None
        
        try:
            tag = PropertyTag.objects.annotate(
                property_count=Count('properties', distinct=True)
            ).get(id=tag_id)
            cache.set(cache_key, True, 3600)
            return tag
        except PropertyTag.DoesNotExist:
            return None
    
    @staticmethod
    def create_tag(validated_data, created_by=None):
        if not validated_data.get('slug') and validated_data.get('title'):
            base_slug = slugify(validated_data['title'], allow_unicode=True)
            slug = base_slug
            counter = 1
            while PropertyTag.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            validated_data['slug'] = slug
        
        if not validated_data.get('meta_title') and validated_data.get('title'):
            validated_data['meta_title'] = validated_data['title'][:70]
        
        if not validated_data.get('meta_description') and validated_data.get('description'):
            validated_data['meta_description'] = validated_data['description'][:300]
        
        with transaction.atomic():
            tag = PropertyTag.objects.create(**validated_data)
        
        PropertyTagCacheManager.invalidate_all()
        
        return tag
    
    @staticmethod
    def update_tag_by_id(tag_id, validated_data, updated_by=None):
        try:
            tag = PropertyTag.objects.get(id=tag_id)
        except PropertyTag.DoesNotExist:
            raise PropertyTag.DoesNotExist(TAG_ERRORS["tag_not_found"])
        
        if 'title' in validated_data and not validated_data.get('slug'):
            base_slug = slugify(validated_data['title'], allow_unicode=True)
            slug = base_slug
            counter = 1
            while PropertyTag.objects.filter(slug=slug).exclude(pk=tag_id).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            validated_data['slug'] = slug
        
        if 'title' in validated_data and not validated_data.get('meta_title'):
            validated_data['meta_title'] = validated_data['title'][:70]
        
        if 'description' in validated_data and not validated_data.get('meta_description'):
            validated_data['meta_description'] = validated_data['description'][:300]
        
        with transaction.atomic():
            for key, value in validated_data.items():
                setattr(tag, key, value)
            tag.save()
        
        PropertyTagCacheManager.invalidate_tag(tag_id)
        
        return tag
    
    @staticmethod
    def delete_tag_by_id(tag_id):
        try:
            tag = PropertyTag.objects.get(id=tag_id)
        except PropertyTag.DoesNotExist:
            raise PropertyTag.DoesNotExist(TAG_ERRORS["tag_not_found"])

        with transaction.atomic():
            tag.delete()
        
        PropertyTagCacheManager.invalidate_tag(tag_id)
    
    @staticmethod
    def bulk_delete_tags(tag_ids):
        tags = PropertyTag.objects.filter(id__in=tag_ids)
        
        if not tags.exists():
            raise ValidationError({'ids': [TAG_ERRORS["tags_not_found"]]})
        
        with transaction.atomic():
            tag_list = list(tags)
            
            deleted_count = tags.count()
            tags.delete()
            
            PropertyTagCacheManager.invalidate_tags(tag_ids)
        
        return deleted_count
    
    @staticmethod
    def get_popular_tags(limit=10):
        cache_key = PropertyTagCacheKeys.popular()
        tags = cache.get(cache_key)
        
        if tags is None:
            tags = list(
                PropertyTag.objects.annotate(
                    property_count=Count('properties', distinct=True)
                ).filter(
                    property_count__gt=0, is_active=True, is_public=True
                ).order_by('-property_count')[:limit].values(
                    'id', 'public_id', 'title', 'slug', 'property_count'
                )
            )
            cache.set(cache_key, tags, 3600)
        
        return tags

