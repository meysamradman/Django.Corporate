"""
Cache key utilities and cache management for portfolio app
"""
from django.core.cache import cache


class PortfolioCacheKeys:
    """Standardized cache keys for portfolio app"""
    
    @staticmethod
    def portfolio(portfolio_id):
        """Cache key for portfolio object"""
        return f"portfolio:{portfolio_id}"
    
    @staticmethod
    def main_image(portfolio_id):
        """Cache key for portfolio main image"""
        return f"portfolio:main_image:{portfolio_id}"
    
    @staticmethod
    def seo_data(portfolio_id):
        """Cache key for portfolio SEO data"""
        return f"portfolio:seo_data:{portfolio_id}"
    
    @staticmethod
    def seo_preview(portfolio_id):
        """Cache key for portfolio SEO preview"""
        return f"portfolio:seo_preview:{portfolio_id}"
    
    @staticmethod
    def seo_completeness(portfolio_id):
        """Cache key for portfolio SEO completeness"""
        return f"portfolio:seo_completeness:{portfolio_id}"
    
    @staticmethod
    def structured_data(portfolio_id):
        """Cache key for portfolio structured data"""
        return f"portfolio:structured_data:{portfolio_id}"
    
    @staticmethod
    def seo_report():
        """Cache key for portfolio SEO report"""
        return "portfolio:seo_report"
    
    @staticmethod
    def all_keys(portfolio_id):
        """Return all cache keys for a portfolio"""
        return [
            PortfolioCacheKeys.portfolio(portfolio_id),
            PortfolioCacheKeys.main_image(portfolio_id),
            PortfolioCacheKeys.seo_data(portfolio_id),
            PortfolioCacheKeys.seo_preview(portfolio_id),
            PortfolioCacheKeys.seo_completeness(portfolio_id),
            PortfolioCacheKeys.structured_data(portfolio_id),
        ]


class PortfolioCacheManager:
    """Cache management utilities for portfolio operations"""
    
    @staticmethod
    def invalidate_portfolio(portfolio_id):
        """Invalidate all cache related to a portfolio"""
        cache_keys = PortfolioCacheKeys.all_keys(portfolio_id)
        cache.delete_many(cache_keys)
    
    @staticmethod
    def invalidate_portfolios(portfolio_ids):
        """Invalidate cache for multiple portfolios"""
        all_keys = []
        for pid in portfolio_ids:
            all_keys.extend(PortfolioCacheKeys.all_keys(pid))
        if all_keys:
            cache.delete_many(all_keys)


class CategoryCacheKeys:
    """Standardized cache keys for category app"""
    
    @staticmethod
    def root_categories():
        """Cache key for root categories"""
        return "portfolio_root_categories"
    
    @staticmethod
    def tree_admin():
        """Cache key for admin category tree"""
        return "portfolio_category_tree_admin"
    
    @staticmethod
    def statistics():
        """Cache key for category statistics"""
        return "category_statistics"
    
    @staticmethod
    def popular(limit):
        """Cache key for popular categories"""
        return f"popular_categories_{limit}"
    
    @staticmethod
    def all_keys():
        """Return all base cache keys for categories"""
        return [
            CategoryCacheKeys.root_categories(),
            CategoryCacheKeys.tree_admin(),
            CategoryCacheKeys.statistics(),
        ]
    
    @staticmethod
    def all_popular_keys(limits=None):
        """Return all popular category cache keys"""
        if limits is None:
            limits = [5, 10, 15, 20]
        return [CategoryCacheKeys.popular(limit) for limit in limits]


class CategoryCacheManager:
    """Cache management utilities for category operations"""
    
    @staticmethod
    def invalidate_all():
        """Invalidate all category-related cache"""
        all_keys = CategoryCacheKeys.all_keys()
        all_keys.extend(CategoryCacheKeys.all_popular_keys())
        if all_keys:
            cache.delete_many(all_keys)
    
    @staticmethod
    def invalidate_popular():
        """Invalidate popular categories cache"""
        popular_keys = CategoryCacheKeys.all_popular_keys()
        if popular_keys:
            cache.delete_many(popular_keys)


class TagCacheKeys:
    """Standardized cache keys for tag app"""
    
    @staticmethod
    def tag(tag_id):
        """Cache key for individual tag"""
        return f"portfolio_tag_{tag_id}"
    
    @staticmethod
    def popular():
        """Cache key for popular tags"""
        return "popular_tags"
    
    @staticmethod
    def all_keys(tag_ids=None):
        """Return all cache keys for tags"""
        keys = [TagCacheKeys.popular()]
        if tag_ids:
            keys.extend([TagCacheKeys.tag(tid) for tid in tag_ids])
        return keys


class TagCacheManager:
    """Cache management utilities for tag operations"""
    
    @staticmethod
    def invalidate_tag(tag_id):
        """Invalidate cache for a specific tag"""
        cache.delete(TagCacheKeys.tag(tag_id))
        cache.delete(TagCacheKeys.popular())
    
    @staticmethod
    def invalidate_tags(tag_ids):
        """Invalidate cache for multiple tags"""
        keys = TagCacheKeys.all_keys(tag_ids)
        if keys:
            cache.delete_many(keys)
    
    @staticmethod
    def invalidate_all():
        """Invalidate all tag-related cache"""
        cache.delete(TagCacheKeys.popular())


class OptionCacheKeys:
    """Standardized cache keys for option app"""
    
    @staticmethod
    def option(option_id):
        """Cache key for individual option"""
        return f"portfolio_option_{option_id}"
    
    @staticmethod
    def popular():
        """Cache key for popular options"""
        return "popular_options"
    
    @staticmethod
    def all_keys(option_ids=None):
        """Return all cache keys for options"""
        keys = [OptionCacheKeys.popular()]
        if option_ids:
            keys.extend([OptionCacheKeys.option(oid) for oid in option_ids])
        return keys


class OptionCacheManager:
    """Cache management utilities for option operations"""
    
    @staticmethod
    def invalidate_option(option_id):
        """Invalidate cache for a specific option"""
        cache.delete(OptionCacheKeys.option(option_id))
        cache.delete(OptionCacheKeys.popular())
    
    @staticmethod
    def invalidate_options(option_ids):
        """Invalidate cache for multiple options"""
        keys = OptionCacheKeys.all_keys(option_ids)
        if keys:
            cache.delete_many(keys)
    
    @staticmethod
    def invalidate_all():
        """Invalidate all option-related cache"""
        cache.delete(OptionCacheKeys.popular())