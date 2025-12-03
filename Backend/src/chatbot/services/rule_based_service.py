import re
from typing import Optional, Dict, List
from django.core.cache import cache
from src.chatbot.models.faq import FAQ
from src.chatbot.models.settings import ChatbotSettings
from src.chatbot.utils.cache import ChatbotCacheKeys, ChatbotCacheManager


class RuleBasedChatService:
    CACHE_TIMEOUT = 3600
    
    @classmethod
    def _get_cached_faqs(cls) -> List[FAQ]:
        cache_key = ChatbotCacheKeys.faqs_active()
        faqs = cache.get(cache_key)
        if faqs is None:
            faqs = list(FAQ.objects.filter(is_active=True).order_by('order').only('id', 'question', 'answer', 'keywords', 'patterns'))
            cache.set(cache_key, faqs, cls.CACHE_TIMEOUT)
        return faqs
    
    @classmethod
    def find_answer(cls, message: str) -> Optional[Dict]:
        message_lower = message.lower().strip()
        if not message_lower:
            return None
        
        faqs = cls._get_cached_faqs()
        
        for faq in faqs:
            if faq.question.lower() == message_lower:
                return {'answer': faq.answer, 'faq_id': faq.id, 'source': 'exact_match'}
        
        for faq in faqs:
            if faq.keywords:
                keywords = [k.strip().lower() for k in faq.keywords.split(',') if k.strip()]
                if keywords and all(keyword in message_lower for keyword in keywords):
                    return {'answer': faq.answer, 'faq_id': faq.id, 'source': 'keywords_all'}
                elif keywords and any(keyword in message_lower for keyword in keywords):
                    return {'answer': faq.answer, 'faq_id': faq.id, 'source': 'keywords_any'}
        
        for faq in faqs:
            if faq.patterns:
                patterns = [p.strip() for p in faq.patterns.split('\n') if p.strip()]
                for pattern in patterns:
                    regex_pattern = cls._pattern_to_regex(pattern.lower())
                    if re.search(regex_pattern, message_lower):
                        return {'answer': faq.answer, 'faq_id': faq.id, 'source': 'pattern'}
        
        for faq in faqs:
            if faq.question.lower() in message_lower or message_lower in faq.question.lower():
                return {'answer': faq.answer, 'faq_id': faq.id, 'source': 'substring'}
        
        return None
    
    @classmethod
    def _pattern_to_regex(cls, pattern: str) -> str:
        pattern = pattern.replace('*', '.*')
        pattern = re.escape(pattern)
        pattern = pattern.replace(r'\.\*', '.*')
        return pattern
    
    @classmethod
    def get_settings(cls) -> ChatbotSettings:
        return ChatbotSettings.get_settings()
    
    @classmethod
    def clear_cache(cls):
        ChatbotCacheManager.invalidate_all()
