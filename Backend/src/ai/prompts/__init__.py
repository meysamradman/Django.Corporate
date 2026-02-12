"""
AI Prompts Module
=================
این ماژول شامل تمام prompts مورد استفاده در سیستم AI است.

ساختار:
- base.py: پیکربندی‌های پایه و مشترک
- content.py: prompts برای تولید محتوا
- image.py: prompts برای تولید تصویر
- audio.py: prompts برای تولید پادکست
- chat.py: prompts برای چت
"""

from .content import CONTENT_PROMPTS, SEO_PROMPTS
from .image import IMAGE_PROMPTS
from .audio import AUDIO_PROMPTS
from .chat import CHAT_PROMPTS

__all__ = [
    'CONTENT_PROMPTS',
    'SEO_PROMPTS',
    'IMAGE_PROMPTS',
    'AUDIO_PROMPTS',
    'CHAT_PROMPTS',
]
