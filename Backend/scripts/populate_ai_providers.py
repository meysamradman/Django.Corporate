"""✅ Populate AI Providers Script

This script populates AI Providers in the database with HARDCODED model configurations.

Usage:
    python manage.py shell < scripts/populate_ai_providers.py
    # or
    python manage.py runscript populate_ai_providers
"""
import os
import sys
import django

# Setup Django
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.django.base')
django.setup()

from src.ai.models import AIProvider, AICapabilityModel
from src.ai.providers.capabilities import get_default_model

def populate_providers():
    """
    Populate providers with Hardcoded Default Models.
    UPDATED FOR 2026 CONTEXT (GPT-5, o3/o4, Gemini 2.0, Grok 3)
    """
    providers_data = [
        {
            'name': 'OpenAI',
            'slug': 'openai',
            'display_name': 'OpenAI',
            'website': 'https://openai.com',
            'api_base_url': 'https://api.openai.com/v1',
            'description': 'Flagship: GPT-5, o4-mini | Reasoning: o3/o1',
            'provider_class': 'src.ai.providers.openai.OpenAIProvider',
            'capabilities': {
                'chat': {
                    'supported': True,
                    'has_dynamic_models': False,
                    'models': [
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
                    'default_model': 'gpt-5'
                },
                'content': {
                    'supported': True,
                    'has_dynamic_models': False,
                    'models': ['gpt-5', 'gpt-5-mini', 'gpt-4o'],
                    'default_model': 'gpt-5-mini'
                },
                'image': {
                    'supported': True,
                    'has_dynamic_models': False,
                    'models': ['dall-e-3', 'dall-e-4-preview'],
                    'default_model': 'dall-e-3'
                },
                'audio': {
                    'supported': True,
                    'has_dynamic_models': False,
                    'models': ['tts-1', 'tts-1-hd', 'tts-2-preview'],
                    'default_model': 'tts-1'
                }
            },
            'allow_personal_keys': True,
            'allow_shared_for_normal_admins': False,
            'is_active': True, 
            'sort_order': 1,
        },
        {
            'name': 'Google Gemini',
            'slug': 'gemini',
            'display_name': 'Google Gemini',
            'website': 'https://ai.google.dev',
            'api_base_url': 'https://generativelanguage.googleapis.com/v1',
            'description': 'Gemini 2.0 Flash/Pro | Imagen 3',
            'provider_class': 'src.ai.providers.gemini.GeminiProvider',
            'capabilities': {
                'chat': {
                    'supported': True,
                    'has_dynamic_models': False,
                    'models': [
                        'gemini-2.0-pro',
                        'gemini-2.0-flash',
                        'gemini-1.5-pro', 
                        'gemini-1.5-flash'
                    ],
                    'default_model': 'gemini-2.0-pro'
                },
                'content': {
                    'supported': True,
                    'has_dynamic_models': False,
                    'models': ['gemini-2.0-pro', 'gemini-2.0-flash'],
                    'default_model': 'gemini-2.0-flash'
                },
                'image': {
                    'supported': True,
                    'has_dynamic_models': False,
                    'models': ['imagen-3', 'imagen-3-fast'],
                    'default_model': 'imagen-3'
                },
                'audio': {
                    'supported': False
                }
            },
            'allow_personal_keys': True,
            'allow_shared_for_normal_admins': False,
            'is_active': True,
            'sort_order': 2,
        },
        {
            'name': 'DeepSeek',
            'slug': 'deepseek',
            'display_name': 'DeepSeek AI',
            'website': 'https://deepseek.com',
            'api_base_url': 'https://api.deepseek.com',
            'description': 'Chat: DeepSeek V3 | Reasoning: R1',
            'provider_class': 'src.ai.providers.deepseek.DeepSeekProvider',
            'capabilities': {
                'chat': {
                    'supported': True,
                    'has_dynamic_models': False,
                    'models': ['deepseek-chat', 'deepseek-reasoner'],
                    'default_model': 'deepseek-chat'
                },
                'content': {
                    'supported': True,
                    'has_dynamic_models': False,
                    'models': ['deepseek-chat', 'deepseek-reasoner'],
                    'default_model': 'deepseek-chat'
                },
                'image': {
                    'supported': False
                },
                'audio': {
                    'supported': False
                }
            },
            'allow_personal_keys': True,
            'allow_shared_for_normal_admins': True,
            'is_active': True,
            'sort_order': 3,
        },
        {
            'name': 'OpenRouter',
            'slug': 'openrouter',
            'display_name': 'OpenRouter',
            'website': 'https://openrouter.ai',
            'api_base_url': 'https://openrouter.ai/api/v1',
            'description': 'Hub: Claude 3.5/Opus, Grok 2/3, Llama 3/4',
            'provider_class': 'src.ai.providers.openrouter.OpenRouterProvider',
            'capabilities': {
                'chat': {
                    'supported': True,
                    'has_dynamic_models': True,
                    'models': [
                        # --- Paid / Premium (Best) ---
                        'anthropic/claude-3.7-sonnet',    # Projected 2026/Late 2025
                        'anthropic/claude-3.5-opus',
                        'xai/grok-2',
                        'xai/grok-3-beta',               # Projected 2026
                        'meta-llama/llama-4-70b-instruct', # Projected 2026
                        'google/gemini-2.0-pro-exp:free', # Sometimes free on OR
                        
                        # --- Cost Effective / Free Tier ---
                        'meta-llama/llama-3.2-3b-instruct:free',
                        'microsoft/phi-4-mini:free',
                        'mistralai/mistral-small-24b-instruct-2501'
                    ],
                    'default_model': 'anthropic/claude-3.7-sonnet'
                },
                'content': {
                    'supported': True,
                    'has_dynamic_models': True,
                    'models': [
                        'anthropic/claude-3.7-sonnet',
                        'xai/grok-2',
                        'google/gemini-2.0-flash'
                    ],
                    'default_model': 'anthropic/claude-3.7-sonnet'
                },
                'image': {
                    'supported': True,
                    'has_dynamic_models': True,
                    'models': [
                        'black-forest-labs/flux-1-pro',
                        'stabilityai/stable-diffusion-3.5-large',
                        'openai/dall-e-3'
                    ],
                    'default_model': 'black-forest-labs/flux-1-pro'
                },
                'audio': {
                    'supported': False
                }
            },
            'allow_personal_keys': True,
            'allow_shared_for_normal_admins': True,
            'is_active': True,
            'sort_order': 4,
        },
        {
            'name': 'Hugging Face',
            'slug': 'huggingface',
            'display_name': 'Hugging Face',
            'website': 'https://huggingface.co',
            'api_base_url': 'https://api-inference.huggingface.co',
            'description': 'Open Source Inference API',
            'provider_class': 'src.ai.providers.huggingface.HuggingFaceProvider',
            'capabilities': {
                'chat': {
                    'supported': True,
                    'has_dynamic_models': True,
                    'models': [
                        # Reliable Inference Endpoints
                        'meta-llama/Meta-Llama-3-8B-Instruct',
                        'meta-llama/Llama-3.2-3B-Instruct',
                        'mistralai/Mistral-Nemo-Instruct-2407',
                        'google/gemma-2-27b-it'
                    ],
                    'default_model': 'meta-llama/Meta-Llama-3-8B-Instruct'
                },
                'content': {
                    'supported': True,
                    'has_dynamic_models': True,
                    'models': [
                        'meta-llama/Meta-Llama-3-8B-Instruct',
                        'Qwen/Qwen2.5-7B-Instruct'
                    ],
                    'default_model': 'meta-llama/Meta-Llama-3-8B-Instruct'
                },
                'image': {
                    'supported': True,
                    'has_dynamic_models': True,
                    'models': [
                        'black-forest-labs/FLUX.1-dev',
                        'stabilityai/stable-diffusion-3.5-large'
                    ],
                    'default_model': 'black-forest-labs/FLUX.1-dev'
                },
                'audio': {
                    'supported': False
                }
            },
            'allow_personal_keys': True,
            'allow_shared_for_normal_admins': True,
            'is_active': True,
            'sort_order': 5,
        }
    ]

    print(f'Populating {len(providers_data)} Providers...')
    
    valid_slugs = []
    created_count = 0
    updated_count = 0

    for data in providers_data:
        slug = data['slug']
        valid_slugs.append(slug)
        
        provider, created = AIProvider.objects.update_or_create(
            slug=slug,
            defaults=data
        )
        if created:
            created_count += 1
            print(f' Created: {provider.display_name}')
        else:
            updated_count += 1
            print(f' Updated: {provider.display_name}')

    # Deactive others
    invalid = AIProvider.objects.exclude(slug__in=valid_slugs)
    for p in invalid:
        if p.is_active:
            p.is_active = False
            p.save()
            print(f' Deactivated: {p.display_name}')

    print(f'Done. Created: {created_count}, Updated: {updated_count}')
    populate_capability_defaults()

def populate_capability_defaults():
    print('\\nApplying Hardcoded Defaults to AICapabilityModel...')
    capabilities = ['chat', 'content', 'image', 'audio']
    
    # Iterate all we just touched
    providers = AIProvider.objects.all()

    for provider in providers:
        prov_caps = provider.capabilities or {}
        
        for cap in capabilities:
            cap_config = prov_caps.get(cap)
            if not cap_config or not cap_config.get('supported'):
                continue
            
            # HARDCODED DEFAULT FROM SCRIPT
            default_model = cap_config.get('default_model')
            if default_model:
                # We find the AICapabilityModel for this provider+capability
                # If this provider IS active, we update the model_id to match the hardcoded default
                
                AICapabilityModel.objects.update_or_create(
                    capability=cap,
                    provider=provider,
                    defaults={
                        'model_id': default_model,
                        'display_name': default_model,
                        'config': {},
                        # Do not force is_active=True, user chooses provider
                    }
                )
                print(f'  - Synced default for {provider.slug}/{cap} -> {default_model}')

if __name__ == '__main__':
    populate_providers()
