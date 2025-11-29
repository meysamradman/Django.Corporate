"""
✅ AI Signals - Auto Cache Invalidation (2025)

Automatically clear cache when models change:
- Provider created/updated/deleted → clear provider cache
- Model created/updated/deleted → clear model cache
- Settings created/updated/deleted → clear settings cache
"""
from django.db.models.signals import post_save, post_delete, pre_delete
from django.dispatch import receiver
from src.ai.models import AIProvider, AIModel, AdminProviderSettings
from src.ai.services.cache_service import AICacheService
import logging

logger = logging.getLogger(__name__)


# ========================================
# AIProvider Signals
# ========================================

@receiver([post_save, post_delete], sender=AIProvider)
def invalidate_provider_cache(sender, instance, **kwargs):
    """Clear provider cache when provider changes"""
    logger.info(f"📢 Provider {instance.slug} changed - clearing cache")
    
    # Clear specific provider
    AICacheService.clear_provider(instance.slug)
    
    # Clear active providers list
    AICacheService.clear_all_providers()


# ========================================
# AIModel Signals
# ========================================

@receiver([post_save, post_delete], sender=AIModel)
def invalidate_model_cache(sender, instance, **kwargs):
    """Clear model cache when model changes"""
    logger.info(f"📢 Model {instance.name} changed - clearing cache")
    
    # Clear all model cache (safer approach)
    AICacheService.clear_all_models()


# ========================================
# AdminProviderSettings Signals
# ========================================

@receiver([post_save, post_delete], sender=AdminProviderSettings)
def invalidate_settings_cache(sender, instance, **kwargs):
    """Clear settings cache when settings change"""
    logger.info(f"📢 Settings for admin {instance.admin_id} changed - clearing cache")
    
    # Clear settings for this admin
    AICacheService.clear_admin_settings(instance.admin_id)
