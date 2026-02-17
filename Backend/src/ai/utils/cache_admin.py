from src.core.cache import CacheKeyBuilder, CacheService

from .cache_shared import hash_sorted_slugs


class AICacheAdminKeys:
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
        suffix = filter_value or "all"
        return f"ai:model:catalog:{provider_name}:{suffix}"

    @staticmethod
    def provider_models_pattern(provider_name: str):
        return f"ai:model:catalog:{provider_name}:*"

    @staticmethod
    def models_bulk(provider_slugs: list[str]):
        digest = hash_sorted_slugs(provider_slugs)
        return f"ai:model:bulk:{digest}"

    @staticmethod
    def active_provider_model(provider_slug: str, capability: str | None = None):
        scope = capability or "any"
        return f"ai:model:active:{provider_slug}:{scope}"

    @staticmethod
    def active_capability_model(capability: str):
        return f"ai:model:active:capability:{capability}"

    @staticmethod
    def models_by_capability(capability: str, include_inactive: bool = True):
        return CacheKeyBuilder.ai_models_by_capability(capability, include_inactive)

    @staticmethod
    def admin_settings(admin_id: int, provider_id: int):
        return CacheKeyBuilder.ai_admin_settings(admin_id, provider_id)

    @staticmethod
    def providers_pattern():
        return "ai:provider:*"

    @staticmethod
    def models_pattern():
        return "ai:model:*"

    @staticmethod
    def bulk_pattern():
        return "ai:model:bulk:*"

    @staticmethod
    def settings_pattern(admin_id: int | None = None):
        if admin_id:
            return f"ai:provider:settings:{admin_id}:*"
        return "ai:provider:settings:*"


class AICacheAdminManager:
    @staticmethod
    def invalidate_provider(slug: str):
        return CacheService.clear_ai_provider(slug)

    @staticmethod
    def invalidate_providers():
        return CacheService.clear_ai_providers()

    @staticmethod
    def invalidate_models_by_provider(provider_slug: str):
        deleted = CacheService.delete_pattern(f"ai:model:provider:{provider_slug}:*")
        deleted += CacheService.delete_pattern(AICacheAdminKeys.provider_models_pattern(provider_slug))
        deleted += int(bool(CacheService.delete(AICacheAdminKeys.active_provider_model(provider_slug))))
        deleted += CacheService.delete_pattern(f"ai:model:active:{provider_slug}:*")
        return deleted

    @staticmethod
    def invalidate_models():
        deleted = CacheService.clear_ai_models()
        deleted += CacheService.delete_pattern(AICacheAdminKeys.bulk_pattern())
        deleted += CacheService.delete_pattern("ai:model:catalog:*")
        deleted += CacheService.delete_pattern("ai:model:active:*")
        return deleted

    @staticmethod
    def invalidate_admin_settings(admin_id: int):
        deleted = CacheService.delete_pattern(AICacheAdminKeys.settings_pattern(admin_id))
        deleted += CacheService.delete_pattern(f"ai_settings_{admin_id}_*")
        return deleted

    @staticmethod
    def invalidate_all():
        AICacheAdminManager.invalidate_providers()
        AICacheAdminManager.invalidate_models()
        deleted = CacheService.delete_pattern(AICacheAdminKeys.settings_pattern())
        deleted += CacheService.delete_pattern("ai_settings_*")
        return deleted
