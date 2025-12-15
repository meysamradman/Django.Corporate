# Generated migration for adding dynamic provider fields

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ai', '0001_initial'),  # آخرین migration موجود
    ]

    operations = [
        migrations.AddField(
            model_name='aiprovider',
            name='provider_class',
            field=models.CharField(
                blank=True,
                help_text='Python class path (e.g., src.ai.providers.openai.OpenAIProvider)',
                max_length=200,
                verbose_name='Provider Class Path'
            ),
        ),
        migrations.AddField(
            model_name='aiprovider',
            name='capabilities',
            field=models.JSONField(
                blank=True,
                default=dict,
                help_text='\n        Provider capabilities configuration:\n        {\n            "chat": {"supported": true, "has_dynamic_models": false, "models": [...]},\n            "content": {"supported": true, "has_dynamic_models": false},\n            "image": {"supported": true, "has_dynamic_models": true},\n            "audio": {"supported": false}\n        }\n        ',
                verbose_name='Capabilities'
            ),
        ),
    ]
