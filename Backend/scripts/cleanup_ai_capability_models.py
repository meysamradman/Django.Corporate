"""
Cleanup & Reset AI Capability Models

This script:
1. Deactivates all existing capability models
2. Sets up hardcoded default models for each provider/capability
3. Ensures only one model is active per capability

Run: python manage.py shell -c "exec(open('scripts/cleanup_ai_capability_models.py').read())"
"""

from src.ai.models import AIProvider, AICapabilityModel

def cleanup_and_reset():
    print('\n' + '='*70)
    print('CLEANUP & RESET AI CAPABILITY MODELS')
    print('='*70)
    
    # Step 1: Deactivate all existing models
    print('\nStep 1: Deactivating all models...')
    deactivated = AICapabilityModel.objects.filter(is_active=True).count()
    AICapabilityModel.objects.all().update(is_active=False)
    print(f'   OK Deactivated {deactivated} models')
    
    # Step 2: Delete duplicates and keep only hardcoded defaults
    print('\nStep 2: Cleaning duplicates...')
    from django.db.models import Count
    
    # Find capabilities with multiple models from same provider
    duplicates = AICapabilityModel.objects.values('capability', 'provider').annotate(
        count=Count('id')
    ).filter(count__gt=1)
    
    deleted_count = 0
    for dup in duplicates:
        # Keep only one (the most recent)
        models = AICapabilityModel.objects.filter(
            capability=dup['capability'],
            provider_id=dup['provider']
        ).order_by('-updated_at')
        
        # Delete all except the first one
        for model in models[1:]:
            print(f'   - Removing duplicate: {model.capability}/{model.provider.slug}/{model.model_id}')
            model.delete()
            deleted_count += 1
    
    print(f'   OK Deleted {deleted_count} duplicates')
    
    # Step 3: Ensure all providers have their hardcoded models
    print('\nStep 3: Setting hardcoded defaults...')
    
    providers = AIProvider.objects.filter(is_active=True)
    created_count = 0
    updated_count = 0
    
    for provider in providers:
        caps = provider.capabilities or {}
        
        for capability in ['chat', 'content', 'image', 'audio']:
            cap_config = caps.get(capability, {})
            
            if not cap_config.get('supported'):
                continue
                
            default_model = cap_config.get('default_model')
            model_list = cap_config.get('models', [])
            
            if not default_model:
                continue
            
            # Create/Update the hardcoded model
            obj, created = AICapabilityModel.objects.update_or_create(
                capability=capability,
                provider=provider,
                defaults={
                    'model_id': default_model,
                    'display_name': default_model,
                    'config': {},
                    'is_active': False,  # Not active by default
                    'sort_order': 0,
                }
            )
            
            if created:
                created_count += 1
                print(f'   + Created: {provider.slug}/{capability} -> {default_model}')
            else:
                updated_count += 1
                print(f'   * Updated: {provider.slug}/{capability} -> {default_model}')
    
    print(f'\n   OK Created: {created_count}, Updated: {updated_count}')
    
    # Step 4: Show current state
    print('\nCurrent State:')
    print('='*70)
    
    all_models = AICapabilityModel.objects.select_related('provider').order_by('capability', 'provider__slug')
    
    current_cap = None
    for model in all_models:
        if model.capability != current_cap:
            current_cap = model.capability
            print(f'\n{current_cap.upper()}:')
        
        status = '[ACTIVE]' if model.is_active else '[inactive]'
        print(f'   {status} {model.provider.slug}: {model.model_id}')
    
    print('\n' + '='*70)
    print('CLEANUP COMPLETE')
    print('Now select a provider for each capability in /ai/models')
    print('='*70 + '\n')

# Run the cleanup
cleanup_and_reset()
