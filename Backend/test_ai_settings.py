"""
Test AI Settings API
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.django.base')
django.setup()

from src.ai.serializers.ai_provider_serializer import AdminProviderSettingsUpdateSerializer
from src.ai.models.ai_provider import AIProvider

# Test data که frontend میفرسته
test_data = {
    'provider_name': 'OpenAI',
    'use_shared_api': True,
    'is_active': True,
}

print("\n" + "="*60)
print("🧪 Testing AdminProviderSettingsUpdateSerializer")
print("="*60)

# بررسی که provider وجود داره
try:
    provider = AIProvider.objects.get(name='OpenAI', is_active=True)
    print(f"✅ Provider found: {provider.name} (ID: {provider.id})")
except AIProvider.DoesNotExist:
    print("❌ Provider 'OpenAI' not found!")
    exit(1)

# Test serializer validation
serializer = AdminProviderSettingsUpdateSerializer(data=test_data)
print(f"\n📝 Input data: {test_data}")

if serializer.is_valid():
    print("\n✅ Validation PASSED!")
    print(f"📦 Validated data: {serializer.validated_data}")
else:
    print("\n❌ Validation FAILED!")
    print(f"🔴 Errors: {serializer.errors}")

print("\n" + "="*60)
