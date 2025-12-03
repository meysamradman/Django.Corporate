from django.db.models import Count, Q
from django.core.cache import cache
from django.core.exceptions import ValidationError
from src.portfolio.models.option import PortfolioOption
from src.portfolio.utils.cache import OptionCacheKeys, OptionCacheManager
from src.portfolio.messages.messages import OPTION_ERRORS


class PortfolioOptionAdminService:
    
    @staticmethod
    def get_option_queryset(filters=None, search=None):
        queryset = PortfolioOption.objects.with_portfolio_counts()
        
        if filters:
            if filters.get('is_active') is not None:
                queryset = queryset.filter(is_active=filters['is_active'])
            if filters.get('name'):
                queryset = queryset.filter(name=filters['name'])
        
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search)
            )
        
        return queryset.order_by('-portfolio_count', 'name')
    
    @staticmethod
    def get_option_by_id(option_id):
        cache_key = OptionCacheKeys.option(option_id)
        option = cache.get(cache_key)
        
        if option is None:
            try:
                option = PortfolioOption.objects.annotate(
                    portfolio_count=Count('portfolio_options')
                ).get(id=option_id)
                cache.set(cache_key, option, 3600)
            except PortfolioOption.DoesNotExist:
                return None
        
        return option

    @staticmethod
    def create_option(validated_data, created_by=None):
        name = validated_data.get('name')
        
        if name:
            existing = PortfolioOption.objects.filter(
                name=name
            ).first()
            
            if existing:
                raise ValidationError(OPTION_ERRORS["option_name_exists"].format(name=name))
        
        option = PortfolioOption.objects.create(**validated_data)
        
        OptionCacheManager.invalidate_all()
        
        return option

    @staticmethod
    def update_option_by_id(option_id, validated_data):
        try:
            option = PortfolioOption.objects.get(id=option_id)
        except PortfolioOption.DoesNotExist:
            raise PortfolioOption.DoesNotExist(OPTION_ERRORS["option_not_found"])
        
        name = validated_data.get('name')
        
        if name:
            existing = PortfolioOption.objects.filter(
                name=name
            ).exclude(id=option_id).first()
            
            if existing:
                raise ValidationError(OPTION_ERRORS["option_name_exists"].format(name=name))
        
        for field, value in validated_data.items():
            setattr(option, field, value)
        
        option.save()
        
        OptionCacheManager.invalidate_option(option_id)
        
        return option

    @staticmethod
    def delete_option_by_id(option_id):
        try:
            option = PortfolioOption.objects.get(id=option_id)
        except PortfolioOption.DoesNotExist:
            raise PortfolioOption.DoesNotExist(OPTION_ERRORS["option_not_found"])
        
        portfolio_count = option.portfolio_options.count()
        if portfolio_count > 0:
            raise ValidationError(OPTION_ERRORS["option_has_portfolios"].format(count=portfolio_count))
        
        option.delete()
        
        OptionCacheManager.invalidate_option(option_id)
    
    @staticmethod
    def bulk_delete_options(option_ids):
        used_options = PortfolioOption.objects.filter(
            id__in=option_ids,
            portfolio_options__isnull=False
        ).distinct().values_list('id', 'name')
        
        if used_options:
            used_names = [f'{name}' for _, name in used_options]
            raise ValidationError(OPTION_ERRORS["options_in_use"].format(names=', '.join(used_names)))
        
        deleted_count = PortfolioOption.objects.filter(id__in=option_ids).delete()[0]
        
        OptionCacheManager.invalidate_options(option_ids)
        
        return deleted_count
    
    @staticmethod
    def get_options_by_key(key):
        return PortfolioOption.objects.filter(
            name=key, is_active=True
        ).order_by('name')
    
    @staticmethod
    def get_popular_options(limit=10):
        cache_key = OptionCacheKeys.popular()
        options = cache.get(cache_key)
        
        if options is None:
            options = list(PortfolioOption.objects.annotate(
                usage_count=Count('portfolio_options')
            ).filter(
                usage_count__gt=0
            ).order_by('-usage_count')[:limit].values(
                'id', 'name', 'usage_count'
            ))
            cache.set(cache_key, options, 3600)
        
        return options
    
    @staticmethod
    def get_unique_keys():
        return PortfolioOption.objects.values_list(
            'name', flat=True
        ).distinct().order_by('name')

