"""Check AI System Status"""

from src.ai.models import AIProvider, AICapabilityModel

print('\n' + '='*70)
print('AI SYSTEM STATUS CHECK')
print('='*70)

print('\n--- PROVIDERS WITH CAPABILITIES ---')
for p in AIProvider.objects.filter(is_active=True):
    print(f'\n{p.slug}: {p.display_name}')
    print(f'  Chat: {p.supports_capability("chat")}')
    print(f'  Content: {p.supports_capability("content")}')
    print(f'  Image: {p.supports_capability("image")}')
    print(f'  Audio: {p.supports_capability("audio")}')

print('\n--- CAPABILITY MODELS STATUS ---')
active = AICapabilityModel.objects.filter(is_active=True).count()
inactive = AICapabilityModel.objects.filter(is_active=False).count()
total = AICapabilityModel.objects.count()

print(f'Active: {active}')
print(f'Inactive: {inactive}')
print(f'Total: {total}')

if active == 0:
    print('\n[OK] All models are inactive as expected!')
    print('Admin should select provider for each capability in /ai/models')
else:
    print('\n[WARNING] Some models are still active:')
    for cm in AICapabilityModel.objects.filter(is_active=True):
        print(f'  - {cm.capability}: {cm.provider.slug}/{cm.model_id}')

print('\n' + '='*70)
