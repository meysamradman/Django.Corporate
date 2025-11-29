"""
✅ Populate AI Providers and Models Script

این اسکریپت Provider ها و Model های پرکاربرد رو به دیتابیس اضافه می‌کنه
بدون نیاز به تغییر کد - همه چیز از دیتابیس خونده میشه!

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

from src.ai.models import AIProvider, AIModel


def populate_providers():
    """اضافه کردن Provider های پرکاربرد"""
    
    # ✅ فقط Provider هایی که واقعاً در بک‌اند استفاده می‌شوند:
    # - chat_service.py: gemini, openai, deepseek, openrouter
    # - content_generation_service.py: gemini, openai, deepseek, openrouter
    # - image_generation_service.py: gemini, openai, huggingface, openrouter
    # 
    # ❌ حذف شده: anthropic, groq (فقط از طریق OpenRouter در دسترس هستند)
    providers_data = [
        {
            'name': 'OpenAI',
            'slug': 'openai',
            'display_name': 'OpenAI (ChatGPT, DALL-E)',
            'website': 'https://openai.com',
            'api_base_url': 'https://api.openai.com/v1',
            'description': 'GPT-4, GPT-3.5, DALL-E, Whisper, TTS',
            'allow_personal_keys': True,
            'allow_shared_for_normal_admins': False,
            'is_active': True,
            'sort_order': 1,
        },
        {
            'name': 'Google',
            'slug': 'gemini',
            'display_name': 'Google Gemini',
            'website': 'https://ai.google.dev',
            'api_base_url': 'https://generativelanguage.googleapis.com/v1',
            'description': 'Gemini Pro, Gemini Flash',
            'allow_personal_keys': True,
            'allow_shared_for_normal_admins': False,
            'is_active': True,
            'sort_order': 2,
        },
        {
            'name': 'OpenRouter',
            'slug': 'openrouter',
            'display_name': 'OpenRouter (60+ Providers)',
            'website': 'https://openrouter.ai',
            'api_base_url': 'https://openrouter.ai/api/v1',
            'description': 'دسترسی به 60+ مدل از Provider های مختلف (Anthropic, Groq, و...)',
            'allow_personal_keys': True,
            'allow_shared_for_normal_admins': True,
            'is_active': True,
            'sort_order': 3,
        },
        {
            'name': 'DeepSeek',
            'slug': 'deepseek',
            'display_name': 'DeepSeek AI',
            'website': 'https://deepseek.com',
            'api_base_url': 'https://api.deepseek.com',
            'description': 'DeepSeek R1, V3 (کم‌هزینه و قوی)',
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
            'description': 'دسترسی به هزاران مدل Open Source (فقط برای Image Generation)',
            'allow_personal_keys': True,
            'allow_shared_for_normal_admins': False,
            'is_active': True,
            'sort_order': 5,
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


def populate_models():
    """
    اضافه کردن Model های پرکاربرد
    
    ✅ فقط برای Provider هایی که مدل‌هایشان در دیتابیس ذخیره می‌شوند:
    - OpenAI: مدل‌ها در دیتابیس ذخیره می‌شوند (برای get_available_providers که از models__capabilities استفاده می‌کند)
    - Gemini: مدل‌ها در دیتابیس ذخیره می‌شوند (برای get_available_providers)
    - DeepSeek: مدل‌ها در دیتابیس ذخیره می‌شوند (برای get_available_providers)
    
    ❌ حذف شده (مدل‌ها از API خودشون می‌آیند - نیازی به ذخیره در دیتابیس نیست):
    - OpenRouter: مدل‌ها از OpenRouter API می‌آیند (endpoint: /api/admin/ai-chat/openrouter-models/)
      → در frontend از OpenRouterModelSelector استفاده می‌شود که مستقیماً از API می‌خواند
    - Hugging Face: مدل‌ها از config یا Hugging Face API می‌آیند
    """
    
    models_data = [
        # OpenAI Models
        {
            'provider_slug': 'openai',
            'name': 'GPT-4o',
            'model_id': 'gpt-4o',
            'display_name': 'GPT-4o (Latest)',
            'description': 'قدرتمندترین مدل OpenAI',
            'capabilities': ['chat', 'vision', 'code'],
            'pricing_input': 5.0,
            'pricing_output': 15.0,
            'max_tokens': 4096,
            'context_window': 128000,
            'is_active': True,
            'sort_order': 1,
        },
        {
            'provider_slug': 'openai',
            'name': 'GPT-4 Turbo',
            'model_id': 'gpt-4-turbo',
            'display_name': 'GPT-4 Turbo',
            'capabilities': ['chat', 'vision', 'code'],
            'pricing_input': 10.0,
            'pricing_output': 30.0,
            'max_tokens': 4096,
            'context_window': 128000,
            'is_active': True,
            'sort_order': 2,
        },
        {
            'provider_slug': 'openai',
            'name': 'GPT-3.5 Turbo',
            'model_id': 'gpt-3.5-turbo',
            'display_name': 'GPT-3.5 Turbo (سریع و ارزان)',
            'capabilities': ['chat', 'code'],
            'pricing_input': 0.5,
            'pricing_output': 1.5,
            'max_tokens': 4096,
            'context_window': 16385,
            'is_active': True,
            'sort_order': 3,
        },
        {
            'provider_slug': 'openai',
            'name': 'DALL-E 3',
            'model_id': 'dall-e-3',
            'display_name': 'DALL-E 3',
            'capabilities': ['image'],
            'is_active': True,
            'sort_order': 4,
        },
        {
            'provider_slug': 'openai',
            'name': 'Whisper',
            'model_id': 'whisper-1',
            'display_name': 'Whisper (Speech to Text)',
            'capabilities': ['audio', 'speech_to_text'],  # ✅ اضافه کردن 'audio' برای هماهنگی با frontend
            'is_active': True,
            'sort_order': 5,
        },
        {
            'provider_slug': 'openai',
            'name': 'TTS-1',
            'model_id': 'tts-1',
            'display_name': 'Text to Speech',
            'capabilities': ['audio', 'text_to_speech'],  # ✅ اضافه کردن 'audio' برای هماهنگی با frontend
            'is_active': True,
            'sort_order': 6,
        },
        
        # ✅ Anthropic و Groq از طریق OpenRouter در دسترس هستند
        # (مدل‌های آن‌ها در OpenRouter API نمایش داده می‌شوند)
        
        # Google Models
        {
            'provider_slug': 'gemini',
            'name': 'Gemini 2.5 Flash',
            'model_id': 'gemini-2.5-flash',
            'display_name': 'Gemini 2.5 Flash',
            'description': 'سریع، قوی، و رایگان!',
            'capabilities': ['chat', 'vision', 'code'],
            'pricing_input': 0.0,
            'pricing_output': 0.0,
            'max_tokens': 8192,
            'context_window': 1000000,
            'is_active': True,
            'sort_order': 1,
        },
        {
            'provider_slug': 'gemini',
            'name': 'Gemini 2.5 Pro',
            'model_id': 'gemini-2.5-pro',
            'display_name': 'Gemini 2.5 Pro',
            'capabilities': ['chat', 'vision', 'code'],
            'pricing_input': 1.25,
            'pricing_output': 5.0,
            'max_tokens': 8192,
            'context_window': 2000000,
            'is_active': True,
            'sort_order': 2,
        },
        
        # DeepSeek Models
        {
            'provider_slug': 'deepseek',
            'name': 'DeepSeek R1',
            'model_id': 'deepseek-reasoner',
            'display_name': 'DeepSeek R1 (Reasoning)',
            'description': 'مدل قدرتمند با قابلیت استدلال',
            'capabilities': ['chat', 'code'],
            'pricing_input': Decimal('0.14'),
            'pricing_output': Decimal('0.28'),
            'is_active': True,
            'sort_order': 1,
        },
        {
            'provider_slug': 'deepseek',
            'name': 'DeepSeek V3',
            'model_id': 'deepseek-chat',
            'display_name': 'DeepSeek V3',
            'capabilities': ['chat', 'code'],
            'pricing_input': Decimal('0.14'),
            'pricing_output': Decimal('0.28'),
            'is_active': True,
            'sort_order': 2,
        },
        
        # ✅ Groq از طریق OpenRouter در دسترس است
        # (مدل‌های آن در OpenRouter API نمایش داده می‌شوند)
    ]
    
    created_count = 0
    updated_count = 0
    skipped_count = 0
    
    for model_data in models_data:
        provider_slug = model_data.pop('provider_slug')
        
        try:
            provider = AIProvider.objects.get(slug=provider_slug)
        except AIProvider.DoesNotExist:
            print(f"⚠️ Skipped: Provider '{provider_slug}' not found for model {model_data['name']}")
            skipped_count += 1
            continue
        
        model, created = AIModel.objects.update_or_create(
            provider=provider,
            model_id=model_data['model_id'],
            defaults=model_data
        )
        
        if created:
            created_count += 1
            print(f"✅ Created: {provider.name} - {model.display_name}")
        else:
            updated_count += 1
            print(f"🔄 Updated: {provider.name} - {model.display_name}")
    
    print(f"\n✅ Models: {created_count} created, {updated_count} updated, {skipped_count} skipped")
    return created_count, updated_count, skipped_count


def run():
    """Main function"""
    print("=" * 60)
    print("🚀 Populating AI Providers and Models")
    print("=" * 60)
    
    print("\n📦 Step 1: Creating/Updating Providers...")
    providers_created, providers_updated, providers_deactivated = populate_providers()
    
    print("\n📦 Step 2: Creating/Updating Models...")
    models_created, models_updated, models_skipped = populate_models()
    
    print("\n" + "=" * 60)
    print("✅ DONE!")
    print(f"   Providers: {providers_created} created, {providers_updated} updated, {providers_deactivated} deactivated")
    print(f"   Models: {models_created} created, {models_updated} updated")
    print("=" * 60)
    print("\n💡 الان می‌تونی از پنل ادمین Provider و Model های جدید اضافه کنی!")
    print("   بدون نیاز به تغییر کد یا Migration! 🎉")


if __name__ == '__main__':
    run()
