from django.db.models import Count, Q
from django.db import transaction
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.utils.text import slugify
from datetime import datetime
from src.portfolio.models.tag import PortfolioTag
from src.portfolio.utils.cache import TagCacheKeys, TagCacheManager
from src.portfolio.messages import TAG_ERRORS

class PortfolioTagAdminService:
    
    @staticmethod
    def get_tag_queryset(filters=None, search=None, date_from=None, date_to=None):
        queryset = PortfolioTag.objects.with_counts()
        
        if filters:
            if filters.get('is_active') is not None:
                queryset = queryset.filter(is_active=filters['is_active'])
        
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
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
        
        return queryset.order_by('-portfolio_count', 'name')
    
    @staticmethod
    def get_tag_by_id(tag_id):
        cache_key = TagCacheKeys.tag(tag_id)
        cached_data = cache.get(cache_key)
        
        if cached_data:
            try:
                return PortfolioTag.objects.annotate(
                    portfolio_count=Count('portfolio_tags')
                ).get(id=tag_id)
            except PortfolioTag.DoesNotExist:
                cache.delete(cache_key)
                return None
        
        try:
            tag = PortfolioTag.objects.annotate(
                portfolio_count=Count('portfolio_tags')
            ).get(id=tag_id)
            cache.set(cache_key, True, 3600)
            return tag
        except PortfolioTag.DoesNotExist:
            return None

    @staticmethod
    def create_tag(validated_data, created_by=None):
        if not validated_data.get('slug') and validated_data.get('name'):
            validated_data['slug'] = slugify(validated_data['name'])
        
        tag = PortfolioTag.objects.create(**validated_data)
        
        TagCacheManager.invalidate_all()
        
        return tag

    @staticmethod
    def update_tag_by_id(tag_id, validated_data):
        try:
            tag = PortfolioTag.objects.get(id=tag_id)
        except PortfolioTag.DoesNotExist:
            raise PortfolioTag.DoesNotExist(TAG_ERRORS["tag_not_found"])
        
        for key, value in validated_data.items():
            setattr(tag, key, value)
        
        tag.save()
        
        TagCacheManager.invalidate_tag(tag_id)
        
        return tag

    @staticmethod
    def delete_tag_by_id(tag_id):
        try:
            tag = PortfolioTag.objects.get(id=tag_id)
        except PortfolioTag.DoesNotExist:
            raise PortfolioTag.DoesNotExist(TAG_ERRORS["tag_not_found"])
        
        portfolio_count = tag.portfolio_tags.count()
        if portfolio_count > 0:
            raise ValidationError(TAG_ERRORS["tag_has_portfolios"].format(count=portfolio_count))
        
        tag.delete()
        
        TagCacheManager.invalidate_tag(tag_id)
    
    @staticmethod
    def bulk_delete_tags(tag_ids):
        tags = PortfolioTag.objects.filter(id__in=tag_ids)
        
        if not tags.exists():
            raise ValidationError(TAG_ERRORS["tags_not_found"])
        
        with transaction.atomic():
            tag_list = list(tags)
            for tag in tag_list:
                tag.portfolio_tags.clear()
            
            deleted_count = tags.count()
            tags.delete()
            
            TagCacheManager.invalidate_tags(tag_ids)
        
        return deleted_count
    
    @staticmethod
    def get_popular_tags(limit=10):
        cache_key = TagCacheKeys.popular()
        tags = cache.get(cache_key)
        
        if tags is None:
            tags = list(PortfolioTag.objects.popular(limit).values(
                'id', 'name', 'slug', 'usage_count'
            ))
            cache.set(cache_key, tags, 3600)
        
        return tags
    
    @staticmethod
    def merge_tags(source_tag_id, target_tag_id):
        try:
            source_tag = PortfolioTag.objects.get(id=source_tag_id)
            target_tag = PortfolioTag.objects.get(id=target_tag_id)
        except PortfolioTag.DoesNotExist:
            raise PortfolioTag.DoesNotExist(TAG_ERRORS["tag_not_found"])
        
        portfolios = source_tag.portfolio_tags.all()
        for portfolio in portfolios:
            portfolio.tags.remove(source_tag)
            if not portfolio.tags.filter(id=target_tag_id).exists():
                portfolio.tags.add(target_tag)
        
        source_tag.delete()
        
        TagCacheManager.invalidate_tags([source_tag_id, target_tag_id])
        
        return target_tag
