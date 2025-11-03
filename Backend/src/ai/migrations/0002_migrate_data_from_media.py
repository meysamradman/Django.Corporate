# Generated manually to migrate AIImageProvider data from media to ai app

from django.db import migrations


def migrate_ai_provider_data(apps, schema_editor):
    """
    Migrate AIImageProvider data from media app to ai app
    """
    # Get old model from media app
    OldAIImageProvider = apps.get_model('media', 'AIImageProvider')
    # Get new model from ai app
    NewAIImageProvider = apps.get_model('ai', 'AIImageProvider')
    
    # Migrate all data
    for old_provider in OldAIImageProvider.objects.all():
        # Check if provider with same provider_name already exists in ai app
        if not NewAIImageProvider.objects.filter(provider_name=old_provider.provider_name).exists():
            NewAIImageProvider.objects.create(
                provider_name=old_provider.provider_name,
                api_key=old_provider.api_key,
                is_active=old_provider.is_active,
                config=old_provider.config,
                usage_count=old_provider.usage_count,
                last_used_at=old_provider.last_used_at,
                created_at=old_provider.created_at,
                updated_at=old_provider.updated_at,
                public_id=old_provider.public_id,
            )


def reverse_migrate(apps, schema_editor):
    """
    Reverse migration - not needed as data is moved
    """
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('ai', '0001_initial'),
        ('media', '0008_alter_aiimageprovider_provider_name'),  # Ensure old model exists
    ]

    operations = [
        migrations.RunPython(
            migrate_ai_provider_data,
            reverse_migrate
        ),
    ]

