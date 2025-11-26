# -*- coding: utf-8 -*-
"""
AI Provider Capabilities Configuration
تنظیمات قابلیت‌های هر Provider
"""

# ✅ مدل‌های هر Provider برای هر نوع کار
PROVIDER_CAPABILITIES = {
    'openrouter': {
        'supports_chat': True,
        'supports_content': True,
        'supports_image': True,
        'has_dynamic_models': True,  # ✅ مدل‌ها از API دریافت می‌شوند
        'models': {
            'chat': 'dynamic',  # از API /openrouter-models دریافت میشه
            'content': 'dynamic',
            'image': 'dynamic',
        },
        'default_models': {
            'chat': 'google/gemini-2.0-flash-exp',
            'content': 'google/gemini-2.0-flash-exp',
            'image': 'openai/dall-e-3',
        }
    },
    'gemini': {
        'supports_chat': True,
        'supports_content': True,
        'supports_image': True,
        'has_dynamic_models': False,  # مدل‌ها ثابت هستند
        'models': {
            'chat': [
                'gemini-2.0-flash-exp',
                'gemini-1.5-pro',
                'gemini-1.5-flash',
                'gemini-1.0-pro',
            ],
            'content': [
                'gemini-2.0-flash-exp',
                'gemini-1.5-pro',
                'gemini-1.5-flash',
                'gemini-1.0-pro',
            ],
            'image': [
                'imagen-3.0-generate-001',
                'imagen-3.0-fast-generate-001',
            ],
        },
        'default_models': {
            'chat': 'gemini-2.0-flash-exp',
            'content': 'gemini-2.0-flash-exp',
            'image': 'imagen-3.0-generate-001',
        }
    },
    'openai': {
        'supports_chat': True,
        'supports_content': True,
        'supports_image': True,
        'has_dynamic_models': False,  # مدل‌ها ثابت هستند
        'models': {
            'chat': [
                'gpt-4o',
                'gpt-4o-mini',
                'gpt-4-turbo',
                'gpt-4',
                'gpt-3.5-turbo',
            ],
            'content': [
                'gpt-4o',
                'gpt-4o-mini',
                'gpt-4-turbo',
                'gpt-4',
                'gpt-3.5-turbo',
            ],
            'image': [
                'dall-e-3',
                'dall-e-2',
            ],
        },
        'default_models': {
            'chat': 'gpt-4o-mini',
            'content': 'gpt-4o-mini',
            'image': 'dall-e-3',
        }
    },
    'deepseek': {
        'supports_chat': True,
        'supports_content': True,
        'supports_image': False,  # ❌ DeepSeek تولید تصویر نداره
        'has_dynamic_models': False,  # مدل‌ها ثابت هستند
        'models': {
            'chat': [
                'deepseek-chat',
                'deepseek-coder',
            ],
            'content': [
                'deepseek-chat',
                'deepseek-coder',
            ],
            'image': [],  # خالی
        },
        'default_models': {
            'chat': 'deepseek-chat',
            'content': 'deepseek-chat',
            'image': None,
        }
    },
    'huggingface': {
        'supports_chat': False,  # ❌ Hugging Face Chat API نداره (محدودیت)
        'supports_content': False,
        'supports_image': True,  # ✅ فقط Image Generation
        'has_dynamic_models': False,  # مدل‌ها ثابت هستند
        'models': {
            'chat': [],
            'content': [],
            'image': [
                'stabilityai/stable-diffusion-xl-base-1.0',
                'stabilityai/stable-diffusion-2-1',
                'runwayml/stable-diffusion-v1-5',
            ],
        },
        'default_models': {
            'chat': None,
            'content': None,
            'image': 'stabilityai/stable-diffusion-xl-base-1.0',
        }
    },
}


def get_provider_capabilities(provider_name: str) -> dict:
    """دریافت قابلیت‌های یک Provider"""
    return PROVIDER_CAPABILITIES.get(provider_name, {
        'supports_chat': False,
        'supports_content': False,
        'supports_image': False,
        'models': {'chat': [], 'content': [], 'image': []},
        'default_models': {'chat': None, 'content': None, 'image': None},
    })


def get_available_models(provider_name: str, model_type: str):
    """
    دریافت لیست مدل‌های موجود برای یک Provider
    
    Args:
        provider_name: نام Provider (مثلاً 'gemini')
        model_type: نوع مدل ('chat', 'content', 'image')
    
    Returns:
        لیست مدل‌ها (اگه dynamic باشه، باید از API دریافت بشه) - str یا list
    """
    caps = get_provider_capabilities(provider_name)
    models = caps.get('models', {}).get(model_type, [])
    
    # اگه 'dynamic' بود، باید از API Provider دریافت بشه
    if models == 'dynamic':
        return 'dynamic'  # برای OpenRouter از API دریافت میشه
    
    return models


def supports_feature(provider_name: str, feature: str) -> bool:
    """
    بررسی اینکه آیا Provider یه قابلیت رو داره یا نه
    
    Args:
        provider_name: نام Provider
        feature: 'chat', 'content', 'image'
    
    Returns:
        True/False
    """
    caps = get_provider_capabilities(provider_name)
    return caps.get(f'supports_{feature}', False)


def get_default_model(provider_name: str, model_type: str) -> str:
    """دریافت مدل پیش‌فرض برای یک Provider"""
    caps = get_provider_capabilities(provider_name)
    return caps.get('default_models', {}).get(model_type)
