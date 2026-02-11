from django.db import migrations, models
import django.db.models


class Migration(migrations.Migration):

    dependencies = [
        ('ai', '0005_enforce_single_active_model_per_provider'),
    ]

    operations = [
        migrations.CreateModel(
            name='AICapabilityModel',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Created At')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Updated At')),
                ('is_active', models.BooleanField(db_index=True, default=True, help_text='Is active?', verbose_name='Active')),
                ('capability', models.CharField(choices=[('chat', 'Chat'), ('content', 'Content'), ('image', 'Image'), ('audio', 'Audio')], db_index=True, help_text='Feature capability this model is used for', max_length=20)),
                ('model_id', models.CharField(help_text="API model identifier (e.g., 'gpt-4o', 'dall-e-3')", max_length=200)),
                ('display_name', models.CharField(help_text='Human-readable model name', max_length=200)),
                ('config', models.JSONField(blank=True, default=dict, help_text='Optional per-capability model config passed to provider')),
                ('sort_order', models.IntegerField(db_index=True, default=0, help_text='Ordering within capability (lower is preferred)')),
                ('provider', models.ForeignKey(db_index=True, on_delete=django.db.models.deletion.CASCADE, related_name='capability_models', to='ai.aiprovider')),
            ],
            options={
                'verbose_name': 'AI Capability Model',
                'verbose_name_plural': 'AI Capability Models',
                'db_table': 'ai_capability_models',
                'ordering': ['capability', 'sort_order', 'id'],
            },
        ),
        migrations.AlterUniqueTogether(
            name='aicapabilitymodel',
            unique_together={('capability', 'provider', 'model_id')},
        ),
        migrations.AddConstraint(
            model_name='aicapabilitymodel',
            constraint=models.UniqueConstraint(condition=django.db.models.Q(('is_active', True)), fields=('capability',), name='ai_unique_active_model_per_capability'),
        ),
    ]
