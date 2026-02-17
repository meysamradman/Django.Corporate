import re
from typing import Optional, Dict, List
from src.core.cache import CacheService

from src.chatbot.models.faq import FAQ
from src.chatbot.models.settings import ChatbotSettings
from src.chatbot.utils.cache_public import ChatbotPublicCacheKeys, ChatbotPublicCacheManager
from src.chatbot.utils.cache_admin import ChatbotAdminCacheManager
from src.chatbot.utils.cache_ttl import ChatbotCacheTTL

class RuleBasedChatService:
    @classmethod
    def _get_cached_faqs(cls) -> List[Dict]:
        cache_key = ChatbotPublicCacheKeys.faqs_active()
        faqs = CacheService.get(cache_key)
        if faqs is None:
            faqs = list(
                FAQ.objects.filter(is_active=True)
                .order_by('order')
                .values('id', 'question', 'answer', 'keywords', 'patterns')
            )
            CacheService.set(cache_key, faqs, ChatbotCacheTTL.PUBLIC_FAQS)
        return faqs

    @classmethod
    def find_answer(cls, message: str) -> Optional[Dict]:
        message_lower = message.lower().strip()
        if not message_lower:
            return None

        faqs = cls._get_cached_faqs()

        for faq in faqs:
            question = (faq.get('question') or '').lower()
            if question == message_lower:
                return {'answer': faq.get('answer') or '', 'faq_id': faq.get('id'), 'source': 'exact_match'}

        for faq in faqs:
            raw_keywords = faq.get('keywords')
            if raw_keywords:
                keywords = [k.strip().lower() for k in raw_keywords.split(',') if k.strip()]
                if keywords and all(keyword in message_lower for keyword in keywords):
                    return {'answer': faq.get('answer') or '', 'faq_id': faq.get('id'), 'source': 'keywords_all'}
                elif keywords and any(keyword in message_lower for keyword in keywords):
                    return {'answer': faq.get('answer') or '', 'faq_id': faq.get('id'), 'source': 'keywords_any'}

        for faq in faqs:
            raw_patterns = faq.get('patterns')
            if raw_patterns:
                patterns = [p.strip() for p in raw_patterns.split('\n') if p.strip()]
                for pattern in patterns:
                    regex_pattern = cls._pattern_to_regex(pattern.lower())
                    if re.search(regex_pattern, message_lower):
                        return {'answer': faq.get('answer') or '', 'faq_id': faq.get('id'), 'source': 'pattern'}

        for faq in faqs:
            question = (faq.get('question') or '').lower()
            if question and (question in message_lower or message_lower in question):
                return {'answer': faq.get('answer') or '', 'faq_id': faq.get('id'), 'source': 'substring'}

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
        ChatbotAdminCacheManager.invalidate_all()
        ChatbotPublicCacheManager.invalidate_faqs()
        ChatbotPublicCacheManager.invalidate_settings()

__all__ = [
    'RuleBasedChatService',
]
