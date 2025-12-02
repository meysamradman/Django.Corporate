from django.core.cache import cache
from typing import List, Dict, Any, Optional
import logging
from src.ai.utils.cache import AICacheKeys, AICacheManager

logger = logging.getLogger(__name__)


class AICacheService:
    
    # Cache TTL (seconds)
    PROVIDER_TTL = 300  # 5 minutes
    MODEL_TTL = 300     # 5 minutes
    SETTINGS_TTL = 300  # 5 minutes
    
    # Cache key prefixes
    PREFIX_PROVIDER = "ai_provider"
    PREFIX_MODEL = "ai_model"
    PREFIX_SETTINGS = "ai_settings"
    PREFIX_BULK = "ai_bulk"
    
    @classmethod
    def _get_key(cls, prefix: str, *args) -> str:
        parts = [prefix] + [str(arg) for arg in args]
        return "_".join(parts)
    
    # ========================================
    # Provider Cache
    # ========================================
    
    @classmethod
    def get_provider(cls, slug: str):
        # ✅ Use standardized cache key from AICacheKeys
        return cache.get(AICacheKeys.provider(slug))
    
    @classmethod
    def set_provider(cls, slug: str, data: Any):
        # ✅ Use standardized cache key from AICacheKeys
        cache.set(AICacheKeys.provider(slug), data, cls.PROVIDER_TTL)
        logger.debug(f"✅ Cached provider: {slug}")
    
    @classmethod
    def get_active_providers(cls):
        # ✅ Use standardized cache key from AICacheKeys
        return cache.get(AICacheKeys.providers_active())
    
    @classmethod
    def set_active_providers(cls, data: List):
        # ✅ Use standardized cache key from AICacheKeys
        cache.set(AICacheKeys.providers_active(), data, cls.PROVIDER_TTL)
        logger.debug(f"✅ Cached {len(data)} active providers")
    
    @classmethod
    def clear_provider(cls, slug: str):
        # ✅ Use Cache Manager for standardized cache invalidation (Redis)
        AICacheManager.invalidate_provider(slug)
        logger.debug(f"🗑️ Cleared provider cache: {slug}")
    
    @classmethod
    def clear_all_providers(cls):
        # ✅ Use Cache Manager for standardized cache invalidation (Redis)
        AICacheManager.invalidate_providers()
        logger.info("🗑️ Cleared all provider cache")
    
    # ========================================
    # Model Cache
    # ========================================
    
    @classmethod
    def get_models_by_provider(cls, provider_slug: str, capability: Optional[str] = None):
        # ✅ Use standardized cache key from AICacheKeys
        return cache.get(AICacheKeys.models_by_provider(provider_slug, capability))
    
    @classmethod
    def set_models_by_provider(cls, provider_slug: str, capability: Optional[str], data: List):
        # ✅ Use standardized cache key from AICacheKeys
        cache.set(AICacheKeys.models_by_provider(provider_slug, capability), data, cls.MODEL_TTL)
        logger.debug(f"✅ Cached models for provider {provider_slug}, capability={capability}")
    
    @classmethod
    def get_models_by_capability(cls, capability: str):
        # ✅ Use standardized cache key from AICacheKeys
        return cache.get(AICacheKeys.models_by_capability(capability))
    
    @classmethod
    def set_models_by_capability(cls, capability: str, data: List):
        # ✅ Use standardized cache key from AICacheKeys
        cache.set(AICacheKeys.models_by_capability(capability), data, cls.MODEL_TTL)
        logger.debug(f"✅ Cached models for capability {capability}")
    
    @classmethod
    def get_models_bulk(cls, provider_slugs: List[str]):
        # ✅ Use standardized cache key from AICacheKeys
        return cache.get(AICacheKeys.models_bulk(provider_slugs))
    
    @classmethod
    def set_models_bulk(cls, provider_slugs: List[str], data: Dict):
        # ✅ Use standardized cache key from AICacheKeys
        cache.set(AICacheKeys.models_bulk(provider_slugs), data, cls.MODEL_TTL)
        logger.debug(f"✅ Cached bulk models for {len(provider_slugs)} providers")
    
    @classmethod
    def clear_all_models(cls):
        # ✅ Use Cache Manager for standardized cache invalidation (Redis)
        AICacheManager.invalidate_models()
        logger.info("🗑️ Cleared all model cache")
    
    # ========================================
    # Admin Settings Cache
    # ========================================
    
    @classmethod
    def get_admin_settings(cls, admin_id: int, provider_id: int):
        # ✅ Use standardized cache key from AICacheKeys
        return cache.get(AICacheKeys.admin_settings(admin_id, provider_id))
    
    @classmethod
    def set_admin_settings(cls, admin_id: int, provider_id: int, data: Any):
        # ✅ Use standardized cache key from AICacheKeys
        cache.set(AICacheKeys.admin_settings(admin_id, provider_id), data, cls.SETTINGS_TTL)
        logger.debug(f"✅ Cached settings for admin {admin_id}, provider {provider_id}")
    
    @classmethod
    def clear_admin_settings(cls, admin_id: int):
        # ✅ Use Cache Manager for standardized cache invalidation (Redis)
        AICacheManager.invalidate_admin_settings(admin_id)
        logger.debug(f"🗑️ Cleared settings cache for admin {admin_id}")
    
    # ========================================
    # Utility Methods
    # ========================================
    
    @classmethod
    def clear_all(cls):
        # ✅ Use Cache Manager for standardized cache invalidation (Redis)
        AICacheManager.invalidate_all()
        logger.info("🗑️ Cleared all AI cache")
    
    @classmethod
    def get_stats(cls) -> Dict[str, int]:
        # Note: This is approximate and depends on Redis configuration
        return {
            "providers_cached": 1,  # Placeholder
            "models_cached": 1,     # Placeholder
            "settings_cached": 1,   # Placeholder
        }
