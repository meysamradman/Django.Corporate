"""✅ Populate AI Providers Script

این اسکریپت Provider های AI رو به دیتابیس اضافه می‌کنه و همچنین Default Model ها را
برای هر capability (chat/content/image/audio) داخل جدول `AIModel` seed می‌کند.

استفاده:
    python manage.py shell < scripts/populate_ai_providers.py
یا:
    python manage.py runscript populate_ai_providers
"""
import os
import sys
import django
from decimal import Decimal

# Setup Django
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.django.base')
django.setup()

from src.ai.models import AIProvider, AICapabilityModel
from src.ai.providers.capabilities import get_default_model


def populate_providers():
    """
    اضافه کردن Provider های AI به دیتابیس
    
    ✅ Provider هایی که در Registry ثبت شده‌اند:
    - gemini: Google Gemini (chat, content, image)
    - openai: OpenAI (chat, content, image, audio)
    - openrouter: OpenRouter (chat, content, image) - Dynamic Models
    - deepseek: DeepSeek AI (chat, content)
    - huggingface: Hugging Face (chat, content, image) - Dynamic Models
    - groq: Groq (chat, content) - Dynamic Models
    
    ⚠️ مهم: 
    - Model ها باید از طریق `python manage.py sync_ai_models` sync شوند
    - Provider های دینامیک (OpenRouter, Groq, HuggingFace) مدل‌هایشان از API می‌آید
    - Provider های استاتیک (Gemini, OpenAI, DeepSeek) مدل‌هایشان در capabilities.py تعریف شده
    """
    providers_data = [
        {
            'name': 'OpenAI',
            'slug': 'openai',
            'display_name': 'OpenAI (ChatGPT, DALL-E)',
            'website': 'https://openai.com',
            'api_base_url': 'https://api.openai.com/v1',
            'description': 'GPT-4, GPT-3.5, DALL-E, Whisper, TTS',
            'provider_class': 'src.ai.providers.openai.OpenAIProvider',
            'capabilities': {
                'chat': {
                    'supported': True,
                    'has_dynamic_models': False,
                    'models': ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo', 'o1', 'o1-mini'],
                    'default_model': 'gpt-4o'
                },
                'content': {
                    'supported': True,
                    'has_dynamic_models': False,
                    'models': ['gpt-4o', 'gpt-4o-mini'],
                    'default_model': 'gpt-4o-mini'
                },
                'image': {
                    'supported': True,
                    'has_dynamic_models': False,
                    'models': ['dall-e-3', 'dall-e-2'],
                    'default_model': 'dall-e-3'
                },
                'audio': {
                    'supported': True,
                    'has_dynamic_models': False,
                    'models': ['tts-1', 'tts-1-hd', 'whisper-1'],
                    'default_model': 'tts-1'
                }
            },
            'allow_personal_keys': True,
            'allow_shared_for_normal_admins': False,
            'is_active': False,  # ⚠️ پیش‌فرض غیرفعال - Super Admin باید فعال کنه
            'sort_order': 1,
        },
        {
            'name': 'Google',
            'slug': 'gemini',
            'display_name': 'Google Gemini',
            'website': 'https://ai.google.dev',
            'api_base_url': 'https://generativelanguage.googleapis.com/v1',
            'description': 'Gemini Pro, Gemini Flash',
            'provider_class': 'src.ai.providers.gemini.GeminiProvider',
            'capabilities': {
                'chat': {
                    'supported': True,
                    'has_dynamic_models': False,
                    'models': ['gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-1.5-flash'],
                    'default_model': 'gemini-2.0-flash-exp'
                },
                'content': {
                    'supported': True,
                    'has_dynamic_models': False,
                    'models': ['gemini-2.0-flash-exp', 'gemini-1.5-pro'],
                    'default_model': 'gemini-1.5-pro'
                },
                'image': {
                    'supported': True,
                    'has_dynamic_models': False,
                    'models': ['imagen-3'],
                    'default_model': 'imagen-3'
                },
                'audio': {
                    'supported': False
                }
            },
            'allow_personal_keys': True,
            'allow_shared_for_normal_admins': False,
            'is_active': False,  # ⚠️ پیش‌فرض غیرفعال
            'sort_order': 2,
        },
        {
            'name': 'OpenRouter',
            'slug': 'openrouter',
            'display_name': 'OpenRouter (60+ Providers)',
            'website': 'https://openrouter.ai',
            'api_base_url': 'https://openrouter.ai/api/v1',
            'description': 'دسترسی به 60+ مدل از Provider های مختلف (Anthropic, Groq, و...)',
            'provider_class': 'src.ai.providers.openrouter.OpenRouterProvider',
            'capabilities': {
                'chat': {
                    'supported': True,
                    'has_dynamic_models': True,  # مدل‌ها از API می‌آیند
                    'description': 'دسترسی به 400+ مدل chat'
                },
                'content': {
                    'supported': True,
                    'has_dynamic_models': True,
                    'description': 'تولید محتوا با مدل‌های مختلف'
                },
                'image': {
                    'supported': True,
                    'has_dynamic_models': True,
                    'description': 'تولید تصویر با DALL-E, Flux, Stable Diffusion'
                },
                'audio': {
                    'supported': False
                }
            },
            'allow_personal_keys': True,
            'allow_shared_for_normal_admins': True,
            'is_active': False,  # ⚠️ پیش‌فرض غیرفعال
            'sort_order': 3,
        },
        {
            'name': 'DeepSeek',
            'slug': 'deepseek',
            'display_name': 'DeepSeek AI',
            'website': 'https://deepseek.com',
            'api_base_url': 'https://api.deepseek.com',
            'description': 'DeepSeek R1, V3 (کم‌هزینه و قوی)',
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
                    'models': ['deepseek-chat'],
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
            'is_active': False,  # ⚠️ پیش‌فرض غیرفعال
            'sort_order': 4,
        },
        {
            'name': 'Hugging Face',
            'slug': 'huggingface',
            'display_name': 'Hugging Face',
            'website': 'https://huggingface.co',
            'api_base_url': 'https://api-inference.huggingface.co',
            'description': 'دسترسی به هزاران مدل Open Source (Image, Text, Audio)',
            'provider_class': 'src.ai.providers.huggingface.HuggingFaceProvider',
            'capabilities': {
                'chat': {
                    'supported': True,
                    'has_dynamic_models': True,
                    'description': 'هزاران مدل text generation'
                },
                'content': {
                    'supported': True,
                    'has_dynamic_models': True
                },
                'image': {
                    'supported': True,
                    'has_dynamic_models': True,
                    'description': 'Stable Diffusion, FLUX, و ...'
                },
                'audio': {
                    'supported': False
                }
            },
            'allow_personal_keys': True,
            'allow_shared_for_normal_admins': True,
            'is_active': False,  # ⚠️ پیش‌فرض غیرفعال
            'sort_order': 5,
        },
        {
            'name': 'Groq',
            'slug': 'groq',
            'display_name': 'Groq (Fast & Free)',
            'website': 'https://groq.com',
            'api_base_url': 'https://api.groq.com/openai/v1',
            'description': 'مدل‌های سریع و رایگان (Llama, Mixtral, Gemma)',
            'provider_class': 'src.ai.providers.groq.GroqProvider',
            'capabilities': {
                'chat': {
                    'supported': True,
                    'has_dynamic_models': True,
                    'description': 'مدل‌های سریع (300+ tokens/sec)'
                },
                'content': {
                    'supported': True,
                    'has_dynamic_models': True
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
            'is_active': False,  # ⚠️ پیش‌فرض غیرفعال
            'sort_order': 6,
        },
    ]
    
    created_count = 0
    updated_count = 0
    
    # لیست slug های Provider هایی که باید وجود داشته باشند
    valid_slugs = {p['slug'] for p in providers_data}
    
    for provider_data in providers_data:
        provider, created = AIProvider.objects.update_or_create(
            slug=provider_data['slug'],
            defaults=provider_data
        )
        
        if created:
            created_count += 1
            print(f"✅ Created: {provider.display_name}")
        else:
            updated_count += 1
            print(f"🔄 Updated: {provider.display_name}")
    
    # ✅ غیرفعال کردن Provider هایی که در اسکریپت نیستند (اما حذف نمی‌کنیم)
    invalid_providers = AIProvider.objects.exclude(slug__in=valid_slugs)
    deactivated_count = 0
    for provider in invalid_providers:
        if provider.is_active:
            provider.is_active = False
            provider.save()
            deactivated_count += 1
            print(f"⚠️ Deactivated: {provider.display_name} (not in script)")
    
    print(f"\n✅ Providers: {created_count} created, {updated_count} updated, {deactivated_count} deactivated")
    return created_count, updated_count, deactivated_count


def populate_capability_defaults():
    """
    تنظیم مدل‌های پیش‌فرض برای هر Capability بر اساس تنظیمات Script.
    
    این تابع:
    1. برای هر Provider و Capability، اگر `default_model` تعریف شده باشد، آن را در `AICapabilityModel` ثبت می‌کند.
    2. اگر هیچ مدل فعالی برای یک capability وجود نداشته باشد، مدل OpenAI را (اگر موجود باشد) فعال می‌کند.
    """
    print("\n⚙️  Applying Hardcoded Capability Defaults...")
    
    capabilities = ['chat', 'content', 'image', 'audio']
    preferred_default_provider = {
        'chat': 'openai',
        'content': 'openai',
        'image': 'openai',
        'audio': 'openai',
    }

    created = 0
    updated = 0

    providers = list(AIProvider.objects.all())
    
    for provider in providers:
        prov_caps = provider.capabilities or {}
        
        for capability in capabilities:
            if not provider.supports_capability(capability):
                continue
            
            cap_config = prov_caps.get(capability, {})
            desired_model_id = cap_config.get('default_model')
            
            if not desired_model_id:
                desired_model_id = get_default_model(provider.slug, capability)
            if not desired_model_id:
                static_models = cap_config.get('models', [])
                if isinstance(static_models, list) and static_models:
                    desired_model_id = static_models[0]
            
            if not desired_model_id:
                continue

            any_active_exists = AICapabilityModel.objects.filter(capability=capability, is_active=True).exists()
            should_activate = (not any_active_exists) and (preferred_default_provider.get(capability) == provider.slug)

            defaults = {
                'model_id': desired_model_id,
                'display_name': desired_model_id,
                'config': {},
                'sort_order': 0,
            }
            if should_activate:
                defaults['is_active'] = True
            
            obj, was_created = AICapabilityModel.objects.update_or_create(
                capability=capability,
                provider=provider,
                defaults=defaults
            )
            
            if should_activate and not obj.is_active:
                obj.is_active = True
                obj.save(update_fields=['is_active'])

            if was_created:
                created += 1
            else:
                updated += 1
                
    print(f"✅ Capability defaults applied: {created} created, {updated} updated")
    return created, updated


def run():
    """Main function"""
    print("=" * 60)
    print("🚀 Populating AI Providers and Models")
    print("=" * 60)
    
    print("\n📦 Step 1: Creating/Updating Providers...")
    providers_created, providers_updated, providers_deactivated = populate_providers()
    
    print("\n📦 Step 2: Seeding capability defaults...")
    cap_created, cap_updated = populate_capability_defaults()
    
    print("\n" + "=" * 60)
    print("✅ DONE!")
    print(f"   Providers: {providers_created} created, {providers_updated} updated, {providers_deactivated} deactivated")
    print(f"   Default Models: {cap_created} created, {cap_updated} updated")
    print("=" * 60)
    print("\n💡 مراحل بعدی (در صورت نیاز):")
    print("   - Sync مدل‌های دینامیک (اختیاری): python manage.py sync_ai_models")
    print("=" * 60)


if __name__ == '__main__':
    run()
