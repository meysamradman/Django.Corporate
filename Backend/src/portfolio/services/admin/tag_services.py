from django.shortcuts import get_object_or_404
from django.db.models import Count, Q
from django.core.cache import cache
from src.portfolio.models.tag import PortfolioTag


class PortfolioTagAdminService:
    """Enhanced Tag service for admin with caching and bulk operations"""
    
    @staticmethod
    def get_tag_queryset(filters=None, search=None):
        """Get optimized tag queryset for admin"""
        queryset = PortfolioTag.objects.with_counts()
        
        # Apply filters
        if filters:
            if filters.get('is_active') is not None:
                queryset = queryset.filter(is_active=filters['is_active'])
        
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search)
            )
        
        # Order by usage count and name
        return queryset.order_by('-portfolio_count', 'name')
    
    @staticmethod
    def get_tag_by_id(tag_id):
        """Get tag by ID with caching"""
        cache_key = f"portfolio_tag_{tag_id}"
        tag = cache.get(cache_key)
        
        if tag is None:
            try:
                tag = PortfolioTag.objects.annotate(
                    portfolio_count=Count('portfolio_tags')
                ).get(id=tag_id)
                cache.set(cache_key, tag, 3600)  # 1 hour cache
            except PortfolioTag.DoesNotExist:
                return None
        
        return tag

    @staticmethod
    def create_tag(validated_data, created_by=None):
        """Create tag with auto-slug generation"""
        # Auto-generate slug if not provided
        if not validated_data.get('slug') and validated_data.get('name'):
            from django.utils.text import slugify
            validated_data['slug'] = slugify(validated_data['name'])
        
        tag = PortfolioTag.objects.create(**validated_data)
        
        # Clear related caches
        cache.delete('popular_tags')
        
        return tag

    @staticmethod
    def update_tag_by_id(tag_id, validated_data):
        """Update tag and clear caches"""
        tag = get_object_or_404(PortfolioTag, id=tag_id)
        
        for key, value in validated_data.items():
            setattr(tag, key, value)
        
        tag.save()
        
        # Clear caches
        cache.delete(f'portfolio_tag_{tag_id}')
        cache.delete('popular_tags')
        
        return tag

    @staticmethod
    def delete_tag_by_id(tag_id):
        """Delete tag with safety checks"""
        tag = get_object_or_404(PortfolioTag, id=tag_id)
        
        # Check if tag is used
        portfolio_count = tag.portfolio_tags.count()
        if portfolio_count > 0:
            return {
                'success': False,
                'error': f'Cannot delete tag. It is used by {portfolio_count} portfolios.'
            }
        
        tag.delete()
        
        # Clear caches
        cache.delete(f'portfolio_tag_{tag_id}')
        cache.delete('popular_tags')
        
        return {'success': True}
    
    @staticmethod
    def bulk_delete_tags(tag_ids):
        """Bulk delete multiple tags"""
        # Check usage for all tags
        used_tags = PortfolioTag.objects.filter(
            id__in=tag_ids,
            portfolio_tags__isnull=False
        ).distinct().values_list('id', 'name')
        
        if used_tags:
            used_names = [name for _, name in used_tags]
            return {
                'success': False,
                'error': f'Cannot delete tags that are in use: {", ".join(used_names)}'
            }
        
        # Delete unused tags
        deleted_count = PortfolioTag.objects.filter(id__in=tag_ids).delete()[0]
        
        # Clear caches
        for tag_id in tag_ids:
            cache.delete(f'portfolio_tag_{tag_id}')
        cache.delete('popular_tags')
        
        return {
            'success': True,
            'deleted_count': deleted_count
        }
    
    @staticmethod
    def get_popular_tags(limit=10):
        """Get most popular tags with caching"""
        cache_key = 'popular_tags'
        tags = cache.get(cache_key)
        
        if tags is None:
            tags = list(PortfolioTag.objects.popular(limit).values(
                'id', 'name', 'slug', 'usage_count'
            ))
            cache.set(cache_key, tags, 3600)  # 1 hour cache
        
        return tags
    
    @staticmethod
    def merge_tags(source_tag_id, target_tag_id):
        """Merge one tag into another"""
        source_tag = get_object_or_404(PortfolioTag, id=source_tag_id)
        target_tag = get_object_or_404(PortfolioTag, id=target_tag_id)
        
        # Move all portfolios from source to target
        portfolios = source_tag.portfolio_tags.all()
        for portfolio in portfolios:
            # Remove from source
            portfolio.tags.remove(source_tag)
            # Add to target (if not already)
            if not portfolio.tags.filter(id=target_tag_id).exists():
                portfolio.tags.add(target_tag)
        
        # Delete source tag
        source_tag.delete()
        
        # Clear caches
        cache.delete(f'portfolio_tag_{source_tag_id}')
        cache.delete(f'portfolio_tag_{target_tag_id}')
        cache.delete('popular_tags')
        
        return target_tag

