from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from src.ai.models import AIProvider, AIModel, AdminProviderSettings
from src.ai.services.cache_service import AICacheService


@receiver([post_save, post_delete], sender=AIProvider)
def invalidate_provider_cache(sender, instance, **kwargs):
    AICacheService.clear_provider(instance.slug)
    AICacheService.clear_all_providers()


@receiver([post_save, post_delete], sender=AIModel)
def invalidate_model_cache(sender, instance, **kwargs):
    AICacheService.clear_all_models()


@receiver([post_save, post_delete], sender=AdminProviderSettings)
def invalidate_settings_cache(sender, instance, **kwargs):
    AICacheService.clear_admin_settings(instance.admin_id)
