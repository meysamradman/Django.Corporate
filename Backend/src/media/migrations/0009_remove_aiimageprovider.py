# Generated manually to remove AIImageProvider from media app

from django.db import migrations


def migrate_ai_providers_to_ai_app(apps, schema_editor):
    """
    Migrate AIImageProvider data from media app to ai app if needed
    Note: This migration only removes the model from media app.
    Data should be migrated separately if needed.
    """
    pass


def reverse_migrate(apps, schema_editor):
    """
    Reverse migration - not implemented as model is moved to ai app
    """
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('media', '0008_alter_aiimageprovider_provider_name'),
        # Removed dependency on deleted AI migrations
    ]

    operations = [
        migrations.RunPython(
            migrate_ai_providers_to_ai_app,
            reverse_migrate
        ),
        migrations.DeleteModel(
            name='AIImageProvider',
        ),
    ]

