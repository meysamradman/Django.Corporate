from src.ai.models import AIProvider

PROVIDER_CAPABILITIES = {
    'openai': {
        'supports_chat': True,
        'supports_content': True,
        'supports_image': True,
        'supports_audio': True,
        'has_dynamic_models': False,
        'models': {
            'chat': [
                # Latest 2026 Series
                'gpt-5',
                'gpt-5-mini',
                'o4-mini',
                'o3-mini',
                # Legacy / 2025 Series
                'o1',
                'gpt-4o', 
                'gpt-4o-mini'
            ],
            'content': [
                'gpt-5',
                'gpt-5-mini', 
                'gpt-4o', 
                'gpt-4o-mini'
            ],
            'image': ['dall-e-3', 'dall-e-4-preview'],
            'audio': ['tts-1', 'tts-1-hd', 'tts-2-preview'],
        },
        'default_models': {
            'chat': 'gpt-5',
            'content': 'gpt-5-mini',
            'image': 'dall-e-3',
            'audio': 'tts-1',
        },
        'provider_class': 'src.ai.providers.openai.OpenAIProvider',
    },
    'google': {
        'supports_chat': True,
        'supports_content': True,
        'supports_image': True,
        'supports_audio': False,
        'has_dynamic_models': False,
        'models': {
            'chat': [
                'gemini-2.0-pro',
                'gemini-2.0-flash',
                'gemini-1.5-pro',
                'gemini-1.5-flash',
            ],
            'content': [
                'gemini-2.0-pro',
                'gemini-2.0-flash',
            ],
            'image': ['imagen-3', 'imagen-3-fast'],
            'audio': [],
        },
        'default_models': {
            'chat': 'gemini-2.0-pro',
            'content': 'gemini-2.0-flash',
            'image': 'imagen-3',
            'audio': None,
        },
        'provider_class': 'src.ai.providers.gemini.GeminiProvider',
    },
    'deepseek': {
        'supports_chat': True,
        'supports_content': True,
        'supports_image': False,
        'supports_audio': False,
        'has_dynamic_models': False,
        'models': {
            'chat': ['deepseek-chat', 'deepseek-reasoner'],
            'content': ['deepseek-chat', 'deepseek-reasoner'],
            'image': [],
            'audio': [],
        },
        'default_models': {
            'chat': 'deepseek-chat',
            'content': 'deepseek-chat',
            'image': None,
            'audio': None,
        },
        'provider_class': 'src.ai.providers.deepseek.DeepSeekProvider',
    },
    'openrouter': {
        'supports_chat': True,
        'supports_content': True,
        'supports_image': False,
        'supports_audio': False,
        'has_dynamic_models': True,
        'models': {
            'chat': [
                'openai/gpt-oss-120b:free',
                'openai/gpt-oss-20b:free',
                'qwen/qwen3-coder:free',
                'deepseek/deepseek-r1-0528:free',
                'meta-llama/llama-3.3-70b-instruct:free',
                'meta-llama/llama-3.2-3b-instruct:free',
                'google/gemma-3-12b-it:free',
            ],
            'content': [
                'openai/gpt-oss-120b:free',
                'openai/gpt-oss-20b:free',
                'qwen/qwen3-coder:free',
                'deepseek/deepseek-r1-0528:free',
                'meta-llama/llama-3.3-70b-instruct:free',
                'meta-llama/llama-3.2-3b-instruct:free',
                'google/gemma-3-12b-it:free',
            ],
            'image': [],
            'audio': [],
        },
        'default_models': {
            'chat': 'openai/gpt-oss-120b:free',
            'content': 'openai/gpt-oss-120b:free',
            'image': None,
            'audio': None,
        },
        'provider_class': 'src.ai.providers.openrouter.OpenRouterProvider',
    },
    'huggingface': {
        'supports_chat': True,
        'supports_content': True,
        'supports_image': False,
        'supports_audio': False,
        'has_dynamic_models': True,
        'models': {
            'chat': [
                'deepseek-ai/DeepSeek-R1-0528',
                'ServiceNow-AI/Apriel-1.6-15b-Thinker',
            ],
            'content': [
                'deepseek-ai/DeepSeek-R1-0528',
                'ServiceNow-AI/Apriel-1.6-15b-Thinker',
            ],
            'image': [],
            'audio': [],
        },
        'default_models': {
            'chat': 'deepseek-ai/DeepSeek-R1-0528',
            'content': 'deepseek-ai/DeepSeek-R1-0528',
            'image': None,
            'audio': None,
        },
        'provider_class': 'src.ai.providers.huggingface.HuggingFaceProvider',
    },
    'groq': {
        'supports_chat': True,
        'supports_content': True,
        'supports_image': False,
        'supports_audio': False,
        'has_dynamic_models': True,
        'models': {
            'chat': [],
            'content': [],
            'image': [],
            'audio': [],
        },
        'default_models': {
            'chat': None,
            'content': None,
            'image': None,
            'audio': None,
        },
        'provider_class': 'src.ai.providers.groq.GroqProvider',
    }
}

def get_provider_capabilities(provider_name: str) -> dict:
    return PROVIDER_CAPABILITIES.get(provider_name, {
        'supports_chat': False,
        'supports_content': False,
        'supports_image': False,
        'supports_audio': False,
        'models': {'chat': [], 'content': [], 'image': [], 'audio': []},
        'default_models': {'chat': None, 'content': None, 'image': None, 'audio': None},
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
        
        # Product rule (2026-02): no DB-managed per-provider model rows.
        # Available providers come from active AIProvider rows filtered by static capability flags.
        providers_list = list(
            AIProvider.objects.filter(is_active=True).order_by('sort_order', 'display_name').values('id', 'slug')
        )
        
        result = []
        for provider in providers_list:
            if not supports_feature(provider['slug'], capability):
                continue

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
        # Kept for backwards compatibility with older callers.
        # With provider-only selection, API-based vs static providers are treated the same.
        api_based_map = {
            'chat': ['openrouter', 'groq', 'huggingface'],
            'content': ['openrouter', 'groq', 'huggingface'],
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
