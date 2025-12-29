from django.db import models
from src.core.models import BaseModel
from src.chatbot.utils.cache import ChatbotCacheManager


class FAQ(BaseModel):

    question = models.CharField(
        max_length=500,
        db_index=True,
        verbose_name="Question",
        help_text="Frequently asked question"
    )
    
    # 3. Description Fields
    answer = models.TextField(
        verbose_name="Answer",
        help_text="Answer to the question"
    )
    keywords = models.CharField(
        max_length=500,
        blank=True,
        verbose_name="Keywords",
        help_text="Keywords for matching user queries"
    )
    patterns = models.TextField(
        blank=True,
        verbose_name="Patterns",
        help_text="Patterns for matching user queries"
    )
    
    # Order Field
    order = models.PositiveIntegerField(
        default=0,
        db_index=True,
        verbose_name="Display Order",
        help_text="Display order in FAQ list (lower numbers appear first)"
    )
    
    class Meta(BaseModel.Meta):
        db_table = 'chatbot_faqs'
        verbose_name = "FAQ"
        verbose_name_plural = "FAQs"
        ordering = ['order', 'created_at']
        indexes = [
            models.Index(fields=['is_active', 'order']),
        ]
    
    def __str__(self):
        return self.question
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        ChatbotCacheManager.invalidate_faqs()
    
    def delete(self, *args, **kwargs):
        super().delete(*args, **kwargs)
        ChatbotCacheManager.invalidate_faqs()
