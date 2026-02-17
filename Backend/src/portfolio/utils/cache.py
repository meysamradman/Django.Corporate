from django.core.cache import cache
from src.core.cache import CacheKeyBuilder, CacheService

class PortfolioCacheKeys:
    
    @staticmethod
    def portfolio(portfolio_id):
        return CacheKeyBuilder.portfolio_detail(portfolio_id)
    
    @staticmethod
    def list_admin(params):
        return CacheKeyBuilder.portfolio_list_admin(params)
    
    @staticmethod
    def main_image(portfolio_id):
        return CacheKeyBuilder.portfolio_main_image(portfolio_id)
    
    @staticmethod
    def seo_data(portfolio_id):
        return CacheKeyBuilder.portfolio_seo_data(portfolio_id)
    
    @staticmethod
    def seo_preview(portfolio_id):
        return CacheKeyBuilder.portfolio_seo_preview(portfolio_id)
    
    @staticmethod
    def seo_completeness(portfolio_id):
        return CacheKeyBuilder.portfolio_seo_completeness(portfolio_id)
    
    @staticmethod
    def structured_data(portfolio_id):
        return CacheKeyBuilder.portfolio_structured_data(portfolio_id)
    
    @staticmethod
    def seo_report():
        return f"{CacheKeyBuilder.portfolio_seo()}:report"
    
    @staticmethod
    def all_keys(portfolio_id):
        return CacheKeyBuilder.portfolio_all_keys(portfolio_id)

class PortfolioCacheManager:
    
    @staticmethod
    def invalidate_portfolio(portfolio_id):
        return CacheService.clear_portfolio_cache(portfolio_id)
    
    @staticmethod
    def invalidate_portfolios(portfolio_ids):
        return CacheService.clear_portfolios_cache(portfolio_ids)
    
    @staticmethod
    def invalidate_all_lists():
        return CacheService.clear_portfolio_lists()

    @staticmethod
    def invalidate_seo_report():
        return CacheService.delete(PortfolioCacheKeys.seo_report())

class CategoryCacheKeys:
    
    @staticmethod
    def root_categories():
        return "portfolio_root_categories"
    
    @staticmethod
    def tree_admin():
        return "portfolio_category_tree_admin"
    
    @staticmethod
    def statistics():
        return "portfolio_category_statistics"
    
    @staticmethod
    def popular(limit):
        return f"portfolio_popular_categories_{limit}"
    
    @staticmethod
    def list_admin(params):
        import hashlib
        import json
        params_str = json.dumps(params, sort_keys=True)
        params_hash = hashlib.md5(params_str.encode()).hexdigest()[:8]
        return f"portfolio_category_list_admin:{params_hash}"
    
    @staticmethod
    def all_keys():
        return [
            CategoryCacheKeys.root_categories(),
            CategoryCacheKeys.tree_admin(),
            CategoryCacheKeys.statistics(),
        ]
    
    @staticmethod
    def all_popular_keys(limits=None):
        if limits is None:
            limits = [5, 10, 15, 20]
        return [CategoryCacheKeys.popular(limit) for limit in limits]

class CategoryCacheManager:
    
    @staticmethod
    def invalidate_all():
        all_keys = CategoryCacheKeys.all_keys()
        all_keys.extend(CategoryCacheKeys.all_popular_keys())
        if all_keys:
            cache.delete_many(all_keys)
        return CacheService.delete_pattern("portfolio_category_list_admin:*")
    
    @staticmethod
    def invalidate_popular():
        popular_keys = CategoryCacheKeys.all_popular_keys()
        if popular_keys:
            cache.delete_many(popular_keys)

class TagCacheKeys:
    
    @staticmethod
    def tag(tag_id):
        return f"portfolio_tag_{tag_id}"
    
    @staticmethod
    def popular():
        return "portfolio_popular_tags"
    
    @staticmethod
    def all_keys(tag_ids=None):
        keys = [TagCacheKeys.popular()]
        if tag_ids:
            keys.extend([TagCacheKeys.tag(tid) for tid in tag_ids])
        return keys

class TagCacheManager:
    
    @staticmethod
    def invalidate_tag(tag_id):
        cache.delete(TagCacheKeys.tag(tag_id))
        cache.delete(TagCacheKeys.popular())
    
    @staticmethod
    def invalidate_tags(tag_ids):
        keys = TagCacheKeys.all_keys(tag_ids)
        if keys:
            cache.delete_many(keys)
    
    @staticmethod
    def invalidate_all():
        cache.delete(TagCacheKeys.popular())

class OptionCacheKeys:
    
    @staticmethod
    def option(option_id):
        return f"portfolio_option_{option_id}"
    
    @staticmethod
    def popular():
        return "portfolio_popular_options"
    
    @staticmethod
    def all_keys(option_ids=None):
        keys = [OptionCacheKeys.popular()]
        if option_ids:
            keys.extend([OptionCacheKeys.option(oid) for oid in option_ids])
        return keys

class OptionCacheManager:
    
    @staticmethod
    def invalidate_option(option_id):
        cache.delete(OptionCacheKeys.option(option_id))
        cache.delete(OptionCacheKeys.popular())
    
    @staticmethod
    def invalidate_options(option_ids):
        keys = OptionCacheKeys.all_keys(option_ids)
        if keys:
            cache.delete_many(keys)
    
    @staticmethod
    def invalidate_all():
        cache.delete(OptionCacheKeys.popular())