from django.db import models
from src.core.models import BaseModel
from src.chatbot.utils.cache import ChatbotCacheManager


class FAQ(BaseModel):
    question = models.CharField(max_length=500, verbose_name="Question")
    answer = models.TextField(verbose_name="Answer")
    keywords = models.CharField(max_length=500, blank=True, verbose_name="Keywords")
    patterns = models.TextField(blank=True, verbose_name="Patterns")
    order = models.IntegerField(default=0, verbose_name="Order")
    
    class Meta:
        verbose_name = "FAQ"
        verbose_name_plural = "FAQs"
        ordering = ['order', 'created_at']
        indexes = [
            models.Index(fields=['is_active', 'order'], name='chatbot_faq_active_order_idx'),
            models.Index(fields=['question'], name='chatbot_faq_question_idx'),
        ]
    
    def __str__(self):
        return self.question
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        ChatbotCacheManager.invalidate_faqs()
    
    def delete(self, *args, **kwargs):
        super().delete(*args, **kwargs)
        ChatbotCacheManager.invalidate_faqs()
