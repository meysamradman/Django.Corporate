# -*- coding: utf-8 -*-
"""
AI Provider Capabilities Configuration
تنظیمات قابلیت‌های هر Provider - مرکزی و بدون تکرار
"""

# Complete capabilities of each Provider
PROVIDER_CAPABILITIES = {
    'openrouter': {
        'supports_chat': True,
        'supports_content': True,
        'supports_image': True,
        'supports_audio': False,  # OpenRouter doesn't have TTS
        'has_dynamic_models': True,  # Models are fetched from API
        'models': {
            'chat': 'dynamic',  # Fetched from API /openrouter-models
            'content': 'dynamic',
            'image': 'dynamic',
            'audio': [],
        },
        'default_models': {
            'chat': 'google/gemini-2.0-flash-exp',
            'content': 'google/gemini-2.0-flash-exp',
            'image': 'openai/dall-e-3',
            'audio': None,
        }
    },
    'gemini': {
        'supports_chat': True,
        'supports_content': True,
        'supports_image': True,
        'supports_audio': False,  # Gemini doesn't have TTS
        'has_dynamic_models': False,  # Models are fixed
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
            'audio': [],
        },
        'default_models': {
            'chat': 'gemini-2.0-flash-exp',
            'content': 'gemini-2.0-flash-exp',
            'image': 'imagen-3.0-generate-001',
            'audio': None,
        }
    },
    'openai': {
        'supports_chat': True,
        'supports_content': True,
        'supports_image': True,
        'supports_audio': True,  # OpenAI has TTS
        'has_dynamic_models': False,  # Models are fixed
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
            'audio': [
                'tts-1',
                'tts-1-hd',
            ],
        },
        'default_models': {
            'chat': 'gpt-4o-mini',
            'content': 'gpt-4o-mini',
            'image': 'dall-e-3',
            'audio': 'tts-1',
        }
    },
    'deepseek': {
        'supports_chat': True,
        'supports_content': True,
        'supports_image': False,  # DeepSeek doesn't have image generation
        'supports_audio': False,  # DeepSeek doesn't have TTS
        'has_dynamic_models': False,  # Models are fixed
        'models': {
            'chat': [
                'deepseek-chat',
                'deepseek-coder',
            ],
            'content': [
                'deepseek-chat',
                'deepseek-coder',
            ],
            'image': [],
            'audio': [],
        },
        'default_models': {
            'chat': 'deepseek-chat',
            'content': 'deepseek-chat',
            'image': None,
            'audio': None,
        }
    },
    'groq': {
        'supports_chat': True,
        'supports_content': True,
        'supports_image': False,  # Groq doesn't have image generation
        'supports_audio': False,  # Groq doesn't have TTS (only Whisper STT)
        'has_dynamic_models': True,  # Models are fetched from API
        'models': {
            'chat': 'dynamic',
            'content': 'dynamic',
            'image': [],
            'audio': [],
        },
        'default_models': {
            'chat': 'llama-3.3-70b-versatile',
            'content': 'llama-3.3-70b-versatile',
            'image': None,
            'audio': None,
        }
    },
    'huggingface': {
        'supports_chat': False,  # Hugging Face doesn't have Chat API (limitation)
        'supports_content': False,
        'supports_image': True,  # Only Image Generation
        'supports_audio': False,  # HuggingFace has TTS but needs implementation
        'has_dynamic_models': False,  # Models are fixed
        'models': {
            'chat': [],
            'content': [],
            'image': [
                'stabilityai/stable-diffusion-xl-base-1.0',
                'stabilityai/stable-diffusion-2-1',
                'runwayml/stable-diffusion-v1-5',
            ],
            'audio': [],
        },
        'default_models': {
            'chat': None,
            'content': None,
            'image': 'stabilityai/stable-diffusion-xl-base-1.0',
            'audio': None,
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
    
    # If 'dynamic', must be fetched from Provider API
    if models == 'dynamic':
        return 'dynamic'  # For OpenRouter, fetched from API
    
    return models


def supports_feature(provider_name: str, feature: str) -> bool:
    """
    بررسی اینکه آیا Provider یه قابلیت رو داره یا نه
    
    Args:
        provider_name: نام Provider
        feature: 'chat', 'content', 'image', 'audio'
    
    Returns:
        True/False
    """
    caps = get_provider_capabilities(provider_name)
    return caps.get(f'supports_{feature}', False)


def get_default_model(provider_name: str, model_type: str) -> str:
    """دریافت مدل پیش‌فرض برای یک Provider"""
    caps = get_provider_capabilities(provider_name)
    return caps.get('default_models', {}).get(model_type)


# Central Provider Manager - no duplication and optimized
class ProviderAvailabilityManager:
    """
    مدیریت مرکزی Provider های موجود
    یه جا برای همه چیز - بدون تکرار در service ها
    """
    
    @staticmethod
    def get_providers_by_capability(capability: str) -> list:
        """
        دریافت Provider هایی که یه قابلیت خاص رو دارن
        
        Args:
            capability: 'chat', 'content', 'image', 'audio'
        
        Returns:
            لیست provider_slug هایی که این قابلیت رو دارن
        """
        result = []
        for provider_slug, caps in PROVIDER_CAPABILITIES.items():
            if caps.get(f'supports_{capability}', False):
                result.append(provider_slug)
        return result
    
    @staticmethod
    def get_available_providers(capability: str, include_api_based: bool = True) -> list:
        """
        دریافت Provider های فعال برای یک قابلیت
        ✅ مرکزی - یه جا برای همه service ها
        
        Args:
            capability: 'chat', 'content', 'image', 'audio'
            include_api_based: آیا provider های API-based رو هم شامل بشه
        
        Returns:
            لیست provider ها با فرمت صحیح برای فرانت
        """
        from src.ai.models import AIProvider
        
        # Central display names - one place for everywhere
        PROVIDER_DISPLAY_NAMES = {
            'openai': 'OpenAI (ChatGPT, DALL-E)',
            'gemini': 'Google Gemini',
            'openrouter': 'OpenRouter (60+ Providers)',
            'deepseek': 'DeepSeek AI',
            'groq': 'Groq (Fast & Free)',
            'huggingface': 'Hugging Face',
        }
        
        # 1. Providers that have active models in DB
        # For content, we need to check 'chat' capability
        db_capability = 'chat' if capability == 'content' else capability
        
        providers_with_models = AIProvider.objects.filter(
            is_active=True,
            models__capabilities__contains=db_capability,
            models__is_active=True
        ).distinct().values('id', 'slug')
        
        providers_list = list(providers_with_models)
        existing_ids = {p['id'] for p in providers_list}
        
        # 2. API-based providers (models come from API not DB)
        if include_api_based:
            api_based_providers = ProviderAvailabilityManager._get_api_based_providers(capability)
            
            for provider_slug in api_based_providers:
                api_provider = AIProvider.objects.filter(
                    slug=provider_slug,
                    is_active=True
                ).values('id', 'slug').first()
                
                if api_provider and api_provider['id'] not in existing_ids:
                    providers_list.append(api_provider)
                    existing_ids.add(api_provider['id'])
        
        # 3. Proper format for frontend (AvailableProvider type)
        result = []
        for provider in providers_list:
            # Only providers that actually have this capability
            if supports_feature(provider['slug'], capability):
                result.append({
                    'id': provider['id'],
                    'provider_name': provider['slug'],
                    'display_name': PROVIDER_DISPLAY_NAMES.get(provider['slug'], provider['slug'].title()),
                    'is_active': True,
                    'can_generate': True,
                })
        
        return result
    
    @staticmethod
    def _get_api_based_providers(capability: str) -> list:
        """
        دریافت provider های API-based برای یک capability
        این provider ها مدل‌هاشون رو از API دریافت می‌کنن نه DB
        """
        api_based_map = {
            'chat': ['openrouter', 'groq'],
            'content': ['openrouter', 'groq'],
            'image': ['openrouter', 'huggingface'],
            'audio': [],  # No API-based provider for audio
        }
        
        # Only providers that actually have this capability
        candidates = api_based_map.get(capability, [])
        return [p for p in candidates if supports_feature(p, capability)]
    
    @staticmethod
    def validate_provider_capability(provider_name: str, capability: str) -> tuple[bool, str]:
        """
        بررسی اینکه provider می‌تونه این capability رو ارائه بده یا نه
        
        Returns:
            (is_valid, error_message)
        """
        if not supports_feature(provider_name, capability):
            capability_names = {
                'chat': 'چت',
                'content': 'تولید محتوا',
                'image': 'تولید تصویر',
                'audio': 'تولید صدا (TTS)',
            }
            
            error_msg = (
                f"❌ {provider_name} از {capability_names.get(capability, capability)} پشتیبانی نمی‌کند.\n"
                f"لطفاً Provider دیگری انتخاب کنید."
            )
            return False, error_msg
        
        return True, ""
