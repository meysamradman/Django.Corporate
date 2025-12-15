# Generated manually for Feature Flag model
import uuid
import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='FeatureFlag',
            fields=[
                ('id', models.AutoField(editable=False, primary_key=True, serialize=False, verbose_name='ID')),
                ('public_id', models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, help_text='Unique identifier for public-facing operations', unique=True, verbose_name='Public ID')),
                ('is_active', models.BooleanField(db_index=True, default=True, help_text='Whether this feature is currently active', verbose_name='Is Active')),
                ('created_at', models.DateTimeField(db_index=True, default=django.utils.timezone.now, editable=False, help_text='Date and time when the record was created', verbose_name='Created At')),
                ('updated_at', models.DateTimeField(auto_now=True, help_text='Date and time when the record was last updated', verbose_name='Updated At')),
                ('key', models.CharField(db_index=True, help_text="Unique identifier for the feature (e.g., 'portfolio', 'blog')", max_length=50, unique=True, verbose_name='Key')),
                ('description', models.TextField(blank=True, help_text='Optional description of what this feature flag controls', null=True, verbose_name='Description')),
            ],
            options={
                'verbose_name': 'Feature Flag',
                'verbose_name_plural': 'Feature Flags',
                'db_table': 'core_feature_flag',
                'ordering': ['key'],
            },
        ),
        migrations.AddIndex(
            model_name='featureflag',
            index=models.Index(fields=['is_active', 'created_at'], name='core_featur_is_acti_created_idx'),
        ),
        migrations.AddIndex(
            model_name='featureflag',
            index=models.Index(fields=['key', 'is_active'], name='core_featur_key_is_a_idx'),
        ),
    ]

