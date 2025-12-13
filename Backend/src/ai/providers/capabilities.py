from src.ai.models import AIProvider


PROVIDER_CAPABILITIES = {
    'openrouter': {
        'supports_chat': True,
        'supports_content': True,
        'supports_image': True,
        'supports_audio': False,
        'has_dynamic_models': True,
        'models': {
            'chat': 'dynamic',
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
        'supports_audio': False,
        'has_dynamic_models': False,
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
        'supports_audio': True,
        'has_dynamic_models': False,
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
        'supports_image': False,
        'supports_audio': False,
        'has_dynamic_models': False,
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
        'supports_image': False,
        'supports_audio': False,
        'has_dynamic_models': True,
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
        'supports_chat': True,  # HuggingFace واقعاً چت را support می‌کند (text-generation models)
        'supports_content': True,  # HuggingFace واقعاً content را support می‌کند (text-generation models)
        'supports_image': True,
        'supports_audio': False,
        'has_dynamic_models': True,  # مدل‌ها از API دریافت می‌شوند
        'models': {
            'chat': 'dynamic',  # از API دریافت می‌شود
            'content': 'dynamic',  # از API دریافت می‌شود
            'image': [
                'stabilityai/stable-diffusion-xl-base-1.0',
                'stabilityai/stable-diffusion-2-1',
                'runwayml/stable-diffusion-v1-5',
            ],
            'audio': [],
        },
        'default_models': {
            'chat': None,  # از مدل‌های فعال انتخاب می‌شود
            'content': None,  # از مدل‌های فعال انتخاب می‌شود
            'image': 'stabilityai/stable-diffusion-xl-base-1.0',
            'audio': None,
        }
    },
}


def get_provider_capabilities(provider_name: str) -> dict:
    return PROVIDER_CAPABILITIES.get(provider_name, {
        'supports_chat': False,
        'supports_content': False,
        'supports_image': False,
        'models': {'chat': [], 'content': [], 'image': []},
        'default_models': {'chat': None, 'content': None, 'image': None},
    })


def get_available_models(provider_name: str, model_type: str):
    caps = get_provider_capabilities(provider_name)
    models = caps.get('models', {}).get(model_type, [])
    
    if models == 'dynamic':
        return 'dynamic'
    
    return models


def supports_feature(provider_name: str, feature: str) -> bool:
    caps = get_provider_capabilities(provider_name)
    return caps.get(f'supports_{feature}', False)


def get_default_model(provider_name: str, model_type: str) -> str:
    caps = get_provider_capabilities(provider_name)
    return caps.get('default_models', {}).get(model_type)


class ProviderAvailabilityManager:
    
    @staticmethod
    def get_providers_by_capability(capability: str) -> list:
        result = []
        for provider_slug, caps in PROVIDER_CAPABILITIES.items():
            if caps.get(f'supports_{capability}', False):
                result.append(provider_slug)
        return result
    
    @staticmethod
    def get_available_providers(capability: str, include_api_based: bool = True) -> list:
        
        PROVIDER_DISPLAY_NAMES = {
            'openai': 'OpenAI (ChatGPT, DALL-E)',
            'gemini': 'Google Gemini',
            'openrouter': 'OpenRouter (60+ Providers)',
            'deepseek': 'DeepSeek AI',
            'groq': 'Groq (Fast & Free)',
            'huggingface': 'Hugging Face',
        }
        
        db_capability = capability
        
        providers_with_models = AIProvider.objects.filter(
            is_active=True,
            models__capabilities__contains=db_capability,
            models__is_active=True
        ).distinct().values('id', 'slug')
        
        providers_list = list(providers_with_models)
        existing_ids = {p['id'] for p in providers_list}
        
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
        
        result = []
        for provider in providers_list:
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
        api_based_map = {
            'chat': ['openrouter', 'groq', 'huggingface'],  # HuggingFace واقعاً چت را support می‌کند
            'content': ['openrouter', 'groq', 'huggingface'],  # HuggingFace واقعاً content را support می‌کند
            'image': ['openrouter', 'huggingface'],
            'audio': [],
        }
        
        candidates = api_based_map.get(capability, [])
        return [p for p in candidates if supports_feature(p, capability)]
    
    @staticmethod
    def validate_provider_capability(provider_name: str, capability: str) -> tuple[bool, str]:
        if not supports_feature(provider_name, capability):
            error_msg = f"{provider_name} does not support {capability}"
            return False, error_msg
        
        return True, ""
