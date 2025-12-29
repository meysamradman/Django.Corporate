from django.db import models
from django.core.cache import cache
from src.core.models import BaseModel
from src.chatbot.utils.cache import ChatbotCacheKeys, ChatbotCacheManager


class ChatbotSettings(BaseModel):

    is_enabled = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name="Is Enabled",
        help_text="Whether the chatbot is enabled"
    )
    
    # 2. Primary Content Fields
    welcome_message = models.CharField(
        max_length=500,
        default="Hello! How can I help you?",
        verbose_name="Welcome Message",
        help_text="Message displayed when chatbot starts"
    )
    default_message = models.CharField(
        max_length=500,
        default="Sorry, I didn't understand. Please ask your question more clearly.",
        verbose_name="Default Message",
        help_text="Message displayed when chatbot doesn't understand the query"
    )
    
    # Configuration Fields
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
            # Note: is_enabled already has db_index=True (automatic index)
            # BaseModel already provides indexes for public_id, is_active, created_at
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
        cache_key = ChatbotCacheKeys.settings()
        settings = cache.get(cache_key)
        if settings is None:
            settings = cls.objects.first()
            if not settings:
                settings = cls.objects.create()
            cache.set(cache_key, settings, 3600)
        return settings
