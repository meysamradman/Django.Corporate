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
from src.ai.providers.capabilities import PROVIDER_CAPABILITIES

def populate_providers():
    """
    Populate providers, merging metadata with model lists from capabilities.py
    """
    # Base metadata (The only thing strictly hardcoded here now)
    providers_meta = {
        'openai': {
            'name': 'OpenAI',
            'display_name': 'OpenAI', 
            'website': 'https://openai.com',
            'api_base_url': 'https://api.openai.com/v1',
            'description': 'Flagship: GPT-5, o4-mini | Reasoning: o3/o1',
            'provider_class': 'src.ai.providers.openai.OpenAIProvider',
            'sort_order': 1,
        },
        'google': {
            'name': 'Google Gemini',
            'display_name': 'Google Gemini',
            'website': 'https://ai.google.dev',
            'api_base_url': 'https://generativelanguage.googleapis.com/v1',
            'description': 'Gemini 2.0 Flash/Pro | Imagen 3',
            'provider_class': 'src.ai.providers.gemini.GeminiProvider',
            'sort_order': 2,
        },
        'deepseek': {
            'name': 'DeepSeek',
            'display_name': 'DeepSeek AI',
            'website': 'https://deepseek.com',
            'api_base_url': 'https://api.deepseek.com',
            'description': 'Chat: DeepSeek V3 | Reasoning: R1',
            'provider_class': 'src.ai.providers.deepseek.DeepSeekProvider',
            'sort_order': 3,
        },
        'openrouter': {
            'name': 'OpenRouter',
            'display_name': 'OpenRouter',
            'website': 'https://openrouter.ai',
            'api_base_url': 'https://openrouter.ai/api/v1',
            'description': 'Hub: Claude 3.5/Opus, Grok 2/3, Llama 3/4',
            'provider_class': 'src.ai.providers.openrouter.OpenRouterProvider',
            'sort_order': 4,
        },
        'huggingface': {
            'name': 'Hugging Face',
            'display_name': 'Hugging Face',
            'website': 'https://huggingface.co',
            'api_base_url': 'https://api-inference.huggingface.co',
            'description': 'Open Source Inference API',
            'provider_class': 'src.ai.providers.huggingface.HuggingFaceProvider',
            'sort_order': 5,
        }
    }

    print(f'Populating {len(providers_meta)} Providers from Capabilities...')
    
    valid_slugs = []
    created_count = 0
    updated_count = 0

    for slug, meta in providers_meta.items():
        valid_slugs.append(slug)
        
        # Check for name collision with DIFFERENT slug
        # Because we update_or_create by slug, if slug not found -> tries create -> name unique fails if name exists on another slug.
        try:
            colliding_provider = AIProvider.objects.filter(name=meta['name']).exclude(slug=slug).first()
            if colliding_provider:
                print(f" WARN: Provider '{meta['name']}' exists with different slug '{colliding_provider.slug}'. Deleting collision...")
                colliding_provider.delete()
        except Exception as e:
            print(f" Warning checking collision: {e}")

        # Merge basic meta with the 'capabilities' dict from PROVIDER_CAPABILITIES
        # But wait, PROVIDER_CAPABILITIES structure is flat (supports_chat, models={chat:[]})
        # We need to transform it back to the DB format: capabilities: { chat: { supported: T, models: [] } }
        
        cap_source = PROVIDER_CAPABILITIES.get(slug, {})
        
        # Transform flat structure to DB JSON structure
        db_capabilities = {}
        for cap_type in ['chat', 'content', 'image', 'audio']:
            is_supported = cap_source.get(f'supports_{cap_type}', False)
            model_list = cap_source.get('models', {}).get(cap_type, [])
            default_model = cap_source.get('default_models', {}).get(cap_type)
            
            db_capabilities[cap_type] = {
                'supported': is_supported,
                'has_dynamic_models': cap_source.get('has_dynamic_models', False),
                'models': model_list,
                'default_model': default_model
            }
        
        defaults = meta.copy()
        defaults['slug'] = slug
        defaults['capabilities'] = db_capabilities
        defaults['allow_personal_keys'] = True
        defaults['allow_shared_for_normal_admins'] = (slug != 'openai' and slug != 'google') # Logic from before
        defaults['is_active'] = True

        provider, created = AIProvider.objects.update_or_create(
            slug=slug,
            defaults=defaults
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
