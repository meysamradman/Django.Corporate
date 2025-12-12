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
    # - chat_service.py: gemini, openai, deepseek, openrouter, groq, huggingface
    # - content_generation_service.py: gemini, openai, deepseek, openrouter, groq, huggingface
    # - image_generation_service.py: gemini, openai, huggingface, openrouter
    # - audio_generation_service.py: openai (TTS)
    # 
    # ❌ حذف شده: anthropic (فقط از طریق OpenRouter در دسترس است)
    # 
    # ✅ مدل‌های داینامیک (از API می‌آیند - نیازی به ذخیره در دیتابیس نیست):
    # - OpenRouter: مدل‌ها از OpenRouter API می‌آیند (endpoint: /api/admin/ai-chat/openrouter-models/)
    # - Groq: مدل‌ها از Groq API می‌آیند (endpoint: /api/admin/ai-chat/groq-models/)
    # - Hugging Face: مدل‌ها از Hugging Face API می‌آیند
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
            'description': 'دسترسی به هزاران مدل Open Source (Image, Text, Audio)',
            'allow_personal_keys': True,
            'allow_shared_for_normal_admins': True,
            'is_active': True,
            'sort_order': 5,
        },
        {
            'name': 'Groq',
            'slug': 'groq',
            'display_name': 'Groq (Fast & Free)',
            'website': 'https://groq.com',
            'api_base_url': 'https://api.groq.com/openai/v1',
            'description': 'مدل‌های سریع و رایگان (Llama, Mixtral, Gemma)',
            'allow_personal_keys': True,
            'allow_shared_for_normal_admins': True,
            'is_active': True,
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


def populate_models():
    """
    ⚠️ این تابع دیگر استفاده نمی‌شود!
    
    تمام مدل‌ها باید از پاپ‌آپ انتخاب شوند:
    - OpenRouter: از پاپ‌آپ OpenRouterModelSelector
    - Hugging Face: از پاپ‌آپ HuggingFaceModelSelector
    - Google Gemini: از پاپ‌آپ ModelSelector
    - OpenAI: از پاپ‌آپ ModelSelector
    - DeepSeek: از پاپ‌آپ ModelSelector
    
    این طراحی باعث می‌شود:
    1️⃣ Admin فقط مدل‌هایی رو می‌بینه که خودش انتخاب کرده
    2️⃣ هیچ مدل اضافی یا default نداریم
    3️⃣ تمام مدل‌ها قابل فعال/غیرفعال کردن هستند
    """
    print("⚠️  این تابع دیگر استفاده نمی‌شود - تمام مدل‌ها باید از پاپ‌آپ انتخاب شوند")
    return 0, 0, 0


def clear_existing_models():
    """
    حذف مدل‌های موجود در دیتابیس
    
    این تابع تمام مدل‌های قدیمی (که از populate_models اضافه شده‌اند)
    را پاک می‌کند تا Admin بتواند از پاپ‌آپ مدل‌های جدید انتخاب کند.
    """
    total = AIModel.objects.count()
    
    if total == 0:
        print("✅ هیچ مدلی برای حذف وجود ندارد")
        return 0
    
    print(f"\n🗑️  در حال حذف {total} مدل موجود...")
    
    # نمایش مدل‌ها
    print("\n📋 مدل‌های موجود:")
    for model in AIModel.objects.all()[:10]:
        print(f"   - {model.provider.display_name}: {model.display_name}")
    
    if total > 10:
        print(f"   ... و {total - 10} مدل دیگر")
    
    # حذف
    deleted_count, _ = AIModel.objects.all().delete()
    
    print(f"\n✅ {deleted_count} مدل با موفقیت حذف شد!")
    print("💡 حالا می‌تونی از پنل ادمین مدل‌های مورد نظرت رو انتخاب کنی!\n")
    
    return deleted_count


def run():
    """Main function"""
    print("=" * 60)
    print("🚀 Populating AI Providers and Models")
    print("=" * 60)
    
    print("\n📦 Step 1: Creating/Updating Providers...")
    providers_created, providers_updated, providers_deactivated = populate_providers()
    
    print("\n📦 Step 2: Clearing existing models...")
    models_deleted = clear_existing_models()
    
    print("\n" + "=" * 60)
    print("✅ DONE!")
    print(f"   Providers: {providers_created} created, {providers_updated} updated, {providers_deactivated} deactivated")
    print(f"   Models: {models_deleted} deleted")
    print("=" * 60)
    print("\n💡 الان می‌تونی از پنل ادمین مدل‌های مورد نظرت رو از پاپ‌آپ انتخاب کنی!")
    print("   🔹 OpenRouter: 400+ مدل از 60+ Provider")
    print("   🔹 Hugging Face: هزاران مدل Open Source")
    print("   🔹 Gemini, OpenAI, DeepSeek: به زودی پاپ‌آپ اضافه می‌شه!")
    print("=" * 60)


if __name__ == '__main__':
    run()
