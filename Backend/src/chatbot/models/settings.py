from django.db import models
from src.core.cache import CacheService
from src.core.models import BaseModel
from src.chatbot.utils.cache import ChatbotCacheManager
from src.chatbot.utils.cache_public import ChatbotPublicCacheKeys
from src.chatbot.utils.cache_ttl import ChatbotCacheTTL
from src.chatbot.messages.messages import CHATBOT_DEFAULTS

class ChatbotSettings(BaseModel):

    is_enabled = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name="Is Enabled",
        help_text="Whether the chatbot is enabled"
    )
    
    welcome_message = models.CharField(
        max_length=500,
        default=CHATBOT_DEFAULTS['welcome_message'],
        verbose_name="Welcome Message",
        help_text="Message displayed when chatbot starts"
    )
    default_message = models.CharField(
        max_length=500,
        default=CHATBOT_DEFAULTS['default_message'],
        verbose_name="Default Message",
        help_text="Message displayed when chatbot doesn't understand the query"
    )
    
    rate_limit_per_minute = models.IntegerField(
        default=5,
        verbose_name="Rate Limit Per Minute",
        help_text="Maximum number of requests per minute per user"
    )
    
    class Meta(BaseModel.Meta):
        db_table = 'chatbot_settings'
        verbose_name = "Chatbot Settings"
        verbose_name_plural = "Chatbot Settings"
        ordering = ['-created_at']
        indexes = [
        ]
    
    def __str__(self):
        return "Chatbot Settings"
    
    def save(self, *args, **kwargs):
        if not self.pk:
            ChatbotSettings.objects.all().delete()
        super().save(*args, **kwargs)
        ChatbotCacheManager.invalidate_settings()
    
    @classmethod
    def get_settings(cls):
        cache_key = ChatbotPublicCacheKeys.settings_id()
        settings_id = CacheService.get(cache_key)
        if settings_id:
            settings = cls.objects.filter(id=settings_id).first()
            if settings:
                return settings

        settings = cls.objects.first()
        if not settings:
            settings = cls.objects.create(
                welcome_message=CHATBOT_DEFAULTS['welcome_message'],
                default_message=CHATBOT_DEFAULTS['default_message'],
            )

        CacheService.set(cache_key, settings.id, ChatbotCacheTTL.PUBLIC_SETTINGS_ID)
        return settings
