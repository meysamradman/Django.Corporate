from django.core.cache import cache
from src.core.cache import CacheKeyBuilder, CacheService

class AICacheKeys:
    
    @staticmethod
    def provider(slug: str):
        return CacheKeyBuilder.ai_provider(slug)
    
    @staticmethod
    def providers_active():
        return CacheKeyBuilder.ai_providers_active()
    
    @staticmethod
    def models_by_provider(provider_slug: str, capability: str | None = None):
        return CacheKeyBuilder.ai_models_by_provider(provider_slug, capability)
    
    @staticmethod
    def provider_models(provider_name: str, filter_value: str | None = None):
        if filter_value:
            return f"{provider_name}_models_{filter_value}"
        return f"{provider_name}_models_all"
    
    @staticmethod
    def models_bulk(provider_slugs: list[str]):
        sorted_slugs = '_'.join(sorted(provider_slugs))
        return f"ai_models_bulk_{sorted_slugs}"
    
    @staticmethod
    def models_by_capability(capability: str, include_inactive: bool = True):
        return CacheKeyBuilder.ai_models_by_capability(capability, include_inactive)
    
    @staticmethod
    def admin_settings(admin_id: int, provider_id: int):
        return CacheKeyBuilder.ai_admin_settings(admin_id, provider_id)
    
    @staticmethod
    def providers_pattern():
        return "ai_provider_*"
    
    @staticmethod
    def models_pattern():
        return "ai_models_*"
    
    @staticmethod
    def bulk_pattern():
        return "ai_bulk_*"
    
    @staticmethod
    def settings_pattern(admin_id: int | None = None):
        if admin_id:
            return f"ai_settings_{admin_id}_*"
        return "ai_settings_*"

class AICacheManager:
    
    @staticmethod
    def invalidate_provider(slug: str):
        return CacheService.clear_ai_provider(slug)
    
    @staticmethod
    def invalidate_providers():
        return CacheService.clear_ai_providers()
    
    @staticmethod
    def invalidate_models_by_provider(provider_slug: str):
        return CacheService.delete_pattern(f"ai_models_provider_{provider_slug}_*")
    
    @staticmethod
    def invalidate_models():
        return CacheService.clear_ai_models()
    
    @staticmethod
    def invalidate_admin_settings(admin_id: int):
        return CacheService.delete_pattern(AICacheKeys.settings_pattern(admin_id))
    
    @staticmethod
    def invalidate_all():
        AICacheManager.invalidate_providers()
        AICacheManager.invalidate_models()
        return CacheService.delete_pattern(AICacheKeys.settings_pattern())

