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

توجه: تمام prompts به صورت generic هستند و نام provider در آن‌ها نمی‌آید.
"""

# Content prompts
from .content import (
    CONTENT_PROMPT,
    SEO_PROMPT,
    get_content_prompt,
    get_seo_prompt
)

# Image prompts
from .image import (
    IMAGE_PROMPT,
    NEGATIVE_PROMPT,
    get_image_prompt,
    get_negative_prompt,
    enhance_image_prompt
)

# Audio prompts
from .audio import (
    PODCAST_PROMPT,
    AUDIO_SIMPLE_PROMPT,
    INTERVIEW_PROMPT,
    get_audio_prompt,
    calculate_word_count,
    estimate_duration
)

# Chat prompts
from .chat import (
    CHAT_PROMPTS,
    get_chat_system_message
)

__all__ = [
    # Content
    'CONTENT_PROMPT',
    'SEO_PROMPT',
    'get_content_prompt',
    'get_seo_prompt',
    # Image
    'IMAGE_PROMPT',
    'NEGATIVE_PROMPT',
    'get_image_prompt',
    'get_negative_prompt',
    'enhance_image_prompt',
    # Audio
    'PODCAST_PROMPT',
    'AUDIO_SIMPLE_PROMPT',
    'INTERVIEW_PROMPT',
    'get_audio_prompt',
    'calculate_word_count',
    'estimate_duration',
    # Chat
    'CHAT_PROMPTS',
    'get_chat_system_message',
]
