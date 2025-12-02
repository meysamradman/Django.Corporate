from django.db import models
from django.core.cache import cache
from src.core.models import BaseModel
from src.chatbot.utils.cache import ChatbotCacheKeys, ChatbotCacheManager


class ChatbotSettings(BaseModel):
    is_enabled = models.BooleanField(default=True, db_index=True, verbose_name="Is Enabled")
    welcome_message = models.CharField(max_length=500, default="سلام! چطور می‌تونم کمکتون کنم؟", verbose_name="Welcome Message")
    default_message = models.CharField(max_length=500, default="متأسفانه متوجه نشدم. لطفاً سوال خود را واضح‌تر بپرسید.", verbose_name="Default Message")
    rate_limit_per_minute = models.IntegerField(default=5, verbose_name="Rate Limit Per Minute")
    
    class Meta:
        verbose_name = "Chatbot Settings"
        verbose_name_plural = "Chatbot Settings"
        indexes = [
            models.Index(fields=['is_enabled'], name='chatbot_settings_enabled_idx'),
        ]
    
    def __str__(self):
        return "Chatbot Settings"
    
    def save(self, *args, **kwargs):
        if not self.pk:
            ChatbotSettings.objects.all().delete()
        super().save(*args, **kwargs)
        # ✅ Use Cache Manager for standardized cache invalidation
        ChatbotCacheManager.invalidate_settings()
    
    @classmethod
    def get_settings(cls):
        # ✅ Use standardized cache key from ChatbotCacheKeys
        cache_key = ChatbotCacheKeys.settings()
        settings = cache.get(cache_key)
        if settings is None:
            settings = cls.objects.first()
            if not settings:
                settings = cls.objects.create()
            cache.set(cache_key, settings, 3600)
        return settings
