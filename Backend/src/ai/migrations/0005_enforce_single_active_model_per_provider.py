from django.db import migrations, models
from django.db.models import Q


def normalize_active_models(apps, schema_editor):
    AIModel = apps.get_model('ai', 'AIModel')

    # For each provider, keep the most recently updated active model (fallback to highest id)
    provider_ids = (
        AIModel.objects.filter(is_active=True)
        .values_list('provider_id', flat=True)
        .distinct()
    )

    for provider_id in provider_ids:
        active_qs = AIModel.objects.filter(provider_id=provider_id, is_active=True)

        keep = (
            active_qs.order_by('-updated_at', '-id').first()
            if hasattr(AIModel, 'updated_at')
            else active_qs.order_by('-id').first()
        )
        if not keep:
            continue

        (
            active_qs.exclude(id=keep.id)
            .update(is_active=False)
        )


class Migration(migrations.Migration):

    dependencies = [
        ('ai', '0004_alter_aiprovider_capabilities'),
    ]

    operations = [
        migrations.RunPython(normalize_active_models, migrations.RunPython.noop),
        migrations.AddConstraint(
            model_name='aimodel',
            constraint=models.UniqueConstraint(
                fields=('provider',),
                condition=Q(is_active=True),
                name='ai_unique_active_model_per_provider',
            ),
        ),
    ]
