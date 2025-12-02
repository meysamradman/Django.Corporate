from django.core.cache import cache


class AICacheKeys:
    
    @staticmethod
    def provider(slug: str):
        return f"ai_provider_{slug}"
    
    @staticmethod
    def providers_active():
        return "ai_providers_active"
    
    @staticmethod
    def models_by_provider(provider_slug: str, capability: str | None = None):
        cap = capability or 'all'
        return f"ai_models_provider_{provider_slug}_{cap}"
    
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
        status = 'all' if include_inactive else 'active'
        return f"ai_models_capability_{capability}_{status}"
    
    @staticmethod
    def admin_settings(admin_id: int, provider_id: int):
        return f"ai_settings_{admin_id}_{provider_id}"
    
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
        cache.delete(AICacheKeys.provider(slug))
        cache.delete(AICacheKeys.providers_active())
    
    @staticmethod
    def invalidate_providers():
        try:
            cache.delete_pattern(AICacheKeys.providers_pattern())
        except (AttributeError, NotImplementedError):
            cache.delete(AICacheKeys.providers_active())
    
    @staticmethod
    def invalidate_models_by_provider(provider_slug: str):
        try:
            cache.delete_pattern(f"ai_models_provider_{provider_slug}_*")
            cache.delete_pattern(f"{provider_slug}_models_*")
        except (AttributeError, NotImplementedError):
            pass
    
    @staticmethod
    def invalidate_models():
        try:
            cache.delete_pattern(AICacheKeys.models_pattern())
            cache.delete_pattern(AICacheKeys.bulk_pattern())
        except (AttributeError, NotImplementedError):
            pass
    
    @staticmethod
    def invalidate_admin_settings(admin_id: int):
        try:
            cache.delete_pattern(AICacheKeys.settings_pattern(admin_id))
        except (AttributeError, NotImplementedError):
            pass
    
    @staticmethod
    def invalidate_all():
        AICacheManager.invalidate_providers()
        AICacheManager.invalidate_models()
        try:
            cache.delete_pattern(AICacheKeys.settings_pattern())
        except (AttributeError, NotImplementedError):
            pass

