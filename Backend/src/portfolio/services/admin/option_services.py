from django.shortcuts import get_object_or_404
from django.db.models import Count, Q
from django.core.cache import cache
from src.portfolio.models.option import PortfolioOption


class PortfolioOptionAdminService:
    """Enhanced Option service for admin with caching and bulk operations"""
    
    @staticmethod
    def get_option_queryset(filters=None, search=None):
        """Get optimized option queryset for admin"""
        queryset = PortfolioOption.objects.with_portfolio_counts()
        
        # Apply filters
        if filters:
            if filters.get('is_active') is not None:
                queryset = queryset.filter(is_active=filters['is_active'])
            if filters.get('key'):
                queryset = queryset.filter(key=filters['key'])
        
        if search:
            queryset = queryset.filter(
                Q(key__icontains=search) |
                Q(value__icontains=search) |
                Q(description__icontains=search)
            )
        
        # Order by usage count and key
        return queryset.order_by('-portfolio_count', 'key')
    
    @staticmethod
    def get_option_by_id(option_id):
        """Get option by ID with caching"""
        cache_key = f"portfolio_option_{option_id}"
        option = cache.get(cache_key)
        
        if option is None:
            try:
                option = PortfolioOption.objects.annotate(
                    portfolio_count=Count('portfolio_options')
                ).get(id=option_id)
                cache.set(cache_key, option, 3600)  # 1 hour cache
            except PortfolioOption.DoesNotExist:
                return None
        
        return option

    @staticmethod
    def create_option(validated_data, created_by=None):
        """Create option with validation"""
        # Check for duplicate key-value pairs
        key = validated_data.get('key')
        value = validated_data.get('value')
        
        if key and value:
            existing = PortfolioOption.objects.filter(
                key=key, value=value
            ).first()
            
            if existing:
                return {
                    'success': False,
                    'error': f'Option with key "{key}" and value "{value}" already exists.',
                    'existing_option': existing
                }
        
        option = PortfolioOption.objects.create(**validated_data)
        
        # Clear related caches
        cache.delete('popular_options')
        
        return {
            'success': True,
            'option': option
        }

    @staticmethod
    def update_option_by_id(option_id, validated_data):
        """Update option with validation and cache clearing"""
        option = get_object_or_404(PortfolioOption, id=option_id)
        
        # Check for duplicate key-value pairs (excluding current option)
        key = validated_data.get('key')
        value = validated_data.get('value')
        
        if key and value:
            existing = PortfolioOption.objects.filter(
                key=key, value=value
            ).exclude(id=option_id).first()
            
            if existing:
                return {
                    'success': False,
                    'error': f'Option with key "{key}" and value "{value}" already exists.',
                    'existing_option': existing
                }
        
        for key, value in validated_data.items():
            setattr(option, key, value)
        
        option.save()
        
        # Clear caches
        cache.delete(f'portfolio_option_{option_id}')
        cache.delete('popular_options')
        
        return {
            'success': True,
            'option': option
        }

    @staticmethod
    def delete_option_by_id(option_id):
        """Delete option with safety checks"""
        option = get_object_or_404(PortfolioOption, id=option_id)
        
        # Check if option is used
        portfolio_count = option.portfolio_options.count()
        if portfolio_count > 0:
            return {
                'success': False,
                'error': f'Cannot delete option. It is used by {portfolio_count} portfolios.'
            }
        
        option.delete()
        
        # Clear caches
        cache.delete(f'portfolio_option_{option_id}')
        cache.delete('popular_options')
        
        return {'success': True}
    
    @staticmethod
    def bulk_delete_options(option_ids):
        """Bulk delete multiple options"""
        # Check usage for all options
        used_options = PortfolioOption.objects.filter(
            id__in=option_ids,
            portfolio_options__isnull=False
        ).distinct().values_list('id', 'key', 'value')
        
        if used_options:
            used_names = [f'{key}:{value}' for _, key, value in used_options]
            return {
                'success': False,
                'error': f'Cannot delete options that are in use: {", ".join(used_names)}'
            }
        
        # Delete unused options
        deleted_count = PortfolioOption.objects.filter(id__in=option_ids).delete()[0]
        
        # Clear caches
        for option_id in option_ids:
            cache.delete(f'portfolio_option_{option_id}')
        cache.delete('popular_options')
        
        return {
            'success': True,
            'deleted_count': deleted_count
        }
    
    @staticmethod
    def get_options_by_key(key):
        """Get all options with specific key"""
        return PortfolioOption.objects.filter(
            key=key, is_active=True
        ).order_by('value')
    
    @staticmethod
    def get_popular_options(limit=10):
        """Get most used options with caching"""
        cache_key = 'popular_options'
        options = cache.get(cache_key)
        
        if options is None:
            options = list(PortfolioOption.objects.annotate(
                usage_count=Count('portfolio_options')
            ).filter(
                usage_count__gt=0
            ).order_by('-usage_count')[:limit].values(
                'id', 'key', 'value', 'usage_count'
            ))
            cache.set(cache_key, options, 3600)  # 1 hour cache
        
        return options
    
    @staticmethod
    def get_unique_keys():
        """Get all unique option keys"""
        return PortfolioOption.objects.values_list(
            'key', flat=True
        ).distinct().order_by('key')

