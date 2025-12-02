"""
Cache key utilities and cache management for AI app
Standardized cache keys to avoid conflicts
Compatible with AICacheService
"""
from django.core.cache import cache


class AICacheKeys:
    """Standardized cache keys for AI app"""
    
    # Provider cache keys
    @staticmethod
    def provider(slug: str):
        """Cache key for a specific provider"""
        return f"ai_provider_{slug}"
    
    @staticmethod
    def providers_active():
        """Cache key for active providers list"""
        return "ai_providers_active"
    
    # Model cache keys
    @staticmethod
    def models_by_provider(provider_slug: str, capability: str | None = None):
        """Cache key for models by provider and capability"""
        cap = capability or 'all'
        return f"ai_models_provider_{provider_slug}_{cap}"
    
    @staticmethod
    def provider_models(provider_name: str, filter_value: str | None = None):
        """Cache key for provider-specific models (e.g., openrouter_models_all, huggingface_models_text-generation)"""
        if filter_value:
            return f"{provider_name}_models_{filter_value}"
        return f"{provider_name}_models_all"
    
    @staticmethod
    def models_bulk(provider_slugs: list[str]):
        """Cache key for bulk models query"""
        sorted_slugs = '_'.join(sorted(provider_slugs))
        return f"ai_models_bulk_{sorted_slugs}"
    
    @staticmethod
    def models_by_capability(capability: str, include_inactive: bool = True):
        """Cache key for models by capability"""
        status = 'all' if include_inactive else 'active'
        return f"ai_models_capability_{capability}_{status}"
    
    # Settings cache keys (used by AICacheService)
    @staticmethod
    def admin_settings(admin_id: int, provider_id: int):
        """Cache key for admin provider settings"""
        return f"ai_settings_{admin_id}_{provider_id}"
    
    # Pattern for bulk operations
    @staticmethod
    def providers_pattern():
        """Pattern for all provider cache keys"""
        return "ai_provider_*"
    
    @staticmethod
    def models_pattern():
        """Pattern for all model cache keys"""
        return "ai_models_*"
    
    @staticmethod
    def bulk_pattern():
        """Pattern for all bulk cache keys"""
        return "ai_bulk_*"
    
    @staticmethod
    def settings_pattern(admin_id: int | None = None):
        """Pattern for settings cache keys"""
        if admin_id:
            return f"ai_settings_{admin_id}_*"
        return "ai_settings_*"


class AICacheManager:
    """Cache management utilities for AI operations"""
    
    @staticmethod
    def invalidate_provider(slug: str):
        """Invalidate cache for a specific provider"""
        cache.delete(AICacheKeys.provider(slug))
        cache.delete(AICacheKeys.providers_active())
    
    @staticmethod
    def invalidate_providers():
        """Invalidate all provider cache"""
        try:
            cache.delete_pattern(AICacheKeys.providers_pattern())
        except (AttributeError, NotImplementedError):
            cache.delete(AICacheKeys.providers_active())
    
    @staticmethod
    def invalidate_models_by_provider(provider_slug: str):
        """Invalidate models cache for a specific provider"""
        try:
            cache.delete_pattern(f"ai_models_provider_{provider_slug}_*")
            # Also invalidate provider-specific cache (e.g., openrouter_models_*)
            cache.delete_pattern(f"{provider_slug}_models_*")
        except (AttributeError, NotImplementedError):
            pass
    
    @staticmethod
    def invalidate_models():
        """Invalidate all model cache"""
        try:
            cache.delete_pattern(AICacheKeys.models_pattern())
            cache.delete_pattern(AICacheKeys.bulk_pattern())
        except (AttributeError, NotImplementedError):
            pass
    
    @staticmethod
    def invalidate_admin_settings(admin_id: int):
        """Invalidate admin settings cache"""
        try:
            cache.delete_pattern(AICacheKeys.settings_pattern(admin_id))
        except (AttributeError, NotImplementedError):
            pass
    
    @staticmethod
    def invalidate_all():
        """Invalidate all AI cache"""
        AICacheManager.invalidate_providers()
        AICacheManager.invalidate_models()
        try:
            cache.delete_pattern(AICacheKeys.settings_pattern())
        except (AttributeError, NotImplementedError):
            pass

