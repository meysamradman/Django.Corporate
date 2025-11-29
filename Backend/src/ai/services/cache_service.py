from django.core.cache import cache
from typing import List, Dict, Any, Optional
import logging

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
        key = cls._get_key(cls.PREFIX_PROVIDER, slug)
        return cache.get(key)
    
    @classmethod
    def set_provider(cls, slug: str, data: Any):
        key = cls._get_key(cls.PREFIX_PROVIDER, slug)
        cache.set(key, data, cls.PROVIDER_TTL)
        logger.debug(f"✅ Cached provider: {slug}")
    
    @classmethod
    def get_active_providers(cls):
        key = f"{cls.PREFIX_PROVIDER}_active"
        return cache.get(key)
    
    @classmethod
    def set_active_providers(cls, data: List):
        key = f"{cls.PREFIX_PROVIDER}_active"
        cache.set(key, data, cls.PROVIDER_TTL)
        logger.debug(f"✅ Cached {len(data)} active providers")
    
    @classmethod
    def clear_provider(cls, slug: str):
        key = cls._get_key(cls.PREFIX_PROVIDER, slug)
        cache.delete(key)
        logger.debug(f"🗑️ Cleared provider cache: {slug}")
    
    @classmethod
    def clear_all_providers(cls):
        try:
            cache.delete_pattern(f"{cls.PREFIX_PROVIDER}_*")
            logger.info("🗑️ Cleared all provider cache")
        except (AttributeError, NotImplementedError):
            # Fallback if delete_pattern not available
            cache.delete(f"{cls.PREFIX_PROVIDER}_active")
            logger.warning("delete_pattern not available, cleared active providers only")
    
    # ========================================
    # Model Cache
    # ========================================
    
    @classmethod
    def get_models_by_provider(cls, provider_slug: str, capability: Optional[str] = None):
        key = cls._get_key(cls.PREFIX_MODEL, "by_provider", provider_slug, capability or "all")
        return cache.get(key)
    
    @classmethod
    def set_models_by_provider(cls, provider_slug: str, capability: Optional[str], data: List):
        key = cls._get_key(cls.PREFIX_MODEL, "by_provider", provider_slug, capability or "all")
        cache.set(key, data, cls.MODEL_TTL)
        logger.debug(f"✅ Cached models for provider {provider_slug}, capability={capability}")
    
    @classmethod
    def get_models_by_capability(cls, capability: str):
        key = cls._get_key(cls.PREFIX_MODEL, "by_capability", capability)
        return cache.get(key)
    
    @classmethod
    def set_models_by_capability(cls, capability: str, data: List):
        key = cls._get_key(cls.PREFIX_MODEL, "by_capability", capability)
        cache.set(key, data, cls.MODEL_TTL)
        logger.debug(f"✅ Cached models for capability {capability}")
    
    @classmethod
    def get_models_bulk(cls, provider_slugs: List[str]):
        key = cls._get_key(cls.PREFIX_BULK, "models", "_".join(sorted(provider_slugs)))
        return cache.get(key)
    
    @classmethod
    def set_models_bulk(cls, provider_slugs: List[str], data: Dict):
        key = cls._get_key(cls.PREFIX_BULK, "models", "_".join(sorted(provider_slugs)))
        cache.set(key, data, cls.MODEL_TTL)
        logger.debug(f"✅ Cached bulk models for {len(provider_slugs)} providers")
    
    @classmethod
    def clear_all_models(cls):
        try:
            cache.delete_pattern(f"{cls.PREFIX_MODEL}_*")
            cache.delete_pattern(f"{cls.PREFIX_BULK}_*")
            logger.info("🗑️ Cleared all model cache")
        except (AttributeError, NotImplementedError):
            logger.warning("delete_pattern not available")
    
    # ========================================
    # Admin Settings Cache
    # ========================================
    
    @classmethod
    def get_admin_settings(cls, admin_id: int, provider_id: int):
        key = cls._get_key(cls.PREFIX_SETTINGS, admin_id, provider_id)
        return cache.get(key)
    
    @classmethod
    def set_admin_settings(cls, admin_id: int, provider_id: int, data: Any):
        key = cls._get_key(cls.PREFIX_SETTINGS, admin_id, provider_id)
        cache.set(key, data, cls.SETTINGS_TTL)
        logger.debug(f"✅ Cached settings for admin {admin_id}, provider {provider_id}")
    
    @classmethod
    def clear_admin_settings(cls, admin_id: int):
        try:
            cache.delete_pattern(f"{cls.PREFIX_SETTINGS}_{admin_id}_*")
            logger.debug(f"🗑️ Cleared settings cache for admin {admin_id}")
        except (AttributeError, NotImplementedError):
            logger.warning("delete_pattern not available")
    
    # ========================================
    # Utility Methods
    # ========================================
    
    @classmethod
    def clear_all(cls):
        cls.clear_all_providers()
        cls.clear_all_models()
        logger.info("🗑️ Cleared all AI cache")
    
    @classmethod
    def get_stats(cls) -> Dict[str, int]:
        # Note: This is approximate and depends on Redis configuration
        return {
            "providers_cached": 1,  # Placeholder
            "models_cached": 1,     # Placeholder
            "settings_cached": 1,   # Placeholder
        }
