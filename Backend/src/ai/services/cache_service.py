from django.core.cache import cache
from typing import List, Dict, Any, Optional
from src.ai.utils.cache import AICacheKeys, AICacheManager


class AICacheService:
    
    # Cache TTL (seconds)
    PROVIDER_TTL = 300
    MODEL_TTL = 300
    SETTINGS_TTL = 300
    
    PREFIX_PROVIDER = "ai_provider"
    PREFIX_MODEL = "ai_model"
    PREFIX_SETTINGS = "ai_settings"
    PREFIX_BULK = "ai_bulk"
    
    @classmethod
    def _get_key(cls, prefix: str, *args) -> str:
        parts = [prefix] + [str(arg) for arg in args]
        return "_".join(parts)
    
    @classmethod
    def get_provider(cls, slug: str):
        return cache.get(AICacheKeys.provider(slug))
    
    @classmethod
    def set_provider(cls, slug: str, data: Any):
        cache.set(AICacheKeys.provider(slug), data, cls.PROVIDER_TTL)
    
    @classmethod
    def get_active_providers(cls):
        return cache.get(AICacheKeys.providers_active())
    
    @classmethod
    def set_active_providers(cls, data: List):
        cache.set(AICacheKeys.providers_active(), data, cls.PROVIDER_TTL)
    
    @classmethod
    def clear_provider(cls, slug: str):
        AICacheManager.invalidate_provider(slug)
    
    @classmethod
    def clear_all_providers(cls):
        AICacheManager.invalidate_providers()
    
    @classmethod
    def get_models_by_provider(cls, provider_slug: str, capability: Optional[str] = None):
        return cache.get(AICacheKeys.models_by_provider(provider_slug, capability))
    
    @classmethod
    def set_models_by_provider(cls, provider_slug: str, capability: Optional[str], data: List):
        cache.set(AICacheKeys.models_by_provider(provider_slug, capability), data, cls.MODEL_TTL)
    
    @classmethod
    def get_models_by_capability(cls, capability: str):
        return cache.get(AICacheKeys.models_by_capability(capability))
    
    @classmethod
    def set_models_by_capability(cls, capability: str, data: List):
        cache.set(AICacheKeys.models_by_capability(capability), data, cls.MODEL_TTL)
    
    @classmethod
    def get_models_bulk(cls, provider_slugs: List[str]):
        return cache.get(AICacheKeys.models_bulk(provider_slugs))
    
    @classmethod
    def set_models_bulk(cls, provider_slugs: List[str], data: Dict):
        cache.set(AICacheKeys.models_bulk(provider_slugs), data, cls.MODEL_TTL)
    
    @classmethod
    def clear_all_models(cls):
        AICacheManager.invalidate_models()
    
    @classmethod
    def get_admin_settings(cls, admin_id: int, provider_id: int):
        return cache.get(AICacheKeys.admin_settings(admin_id, provider_id))
    
    @classmethod
    def set_admin_settings(cls, admin_id: int, provider_id: int, data: Any):
        cache.set(AICacheKeys.admin_settings(admin_id, provider_id), data, cls.SETTINGS_TTL)
    
    @classmethod
    def clear_admin_settings(cls, admin_id: int):
        AICacheManager.invalidate_admin_settings(admin_id)
    
    @classmethod
    def clear_all(cls):
        AICacheManager.invalidate_all()
    
    @classmethod
    def get_stats(cls) -> Dict[str, int]:
        return {
            "providers_cached": 1,
            "models_cached": 1,
            "settings_cached": 1,
        }
