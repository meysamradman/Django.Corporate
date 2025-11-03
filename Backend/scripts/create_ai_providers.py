"""
اسکریپت standalone برای ایجاد Provider های پیش‌فرض AI
استفاده: python scripts/create_ai_providers.py
"""
import os
import sys
import django

# Setup Django environment
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.django.base')
django.setup()

from src.ai.models.image_generation import AIImageGeneration


def create_ai_providers():
    """ایجاد Provider های پیش‌فرض AI"""
    # استفاده از PROVIDER_CHOICES از مدل (خودکار از model می‌خونه)
    providers = AIImageGeneration.PROVIDER_CHOICES
    
    created_count = 0
    for provider_name, display_name in providers:
        provider, created = AIImageGeneration.objects.get_or_create(
            provider_name=provider_name,
            defaults={
                'is_active': False,
                'api_key': None,
            }
        )
        if created:
            created_count += 1
            print(f'[OK] Provider "{provider_name}" created successfully')
        else:
            print(f'[SKIP] Provider "{provider_name}" already exists')
    
    print(f'\n[SUCCESS] {created_count} new Provider(s) created')


if __name__ == '__main__':
    try:
        create_ai_providers()
    except Exception as e:
        print(f'[ERROR] Error: {str(e)}')
        sys.exit(1)
