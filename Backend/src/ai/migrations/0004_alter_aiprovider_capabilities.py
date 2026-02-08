
from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('ai', '0003_adminprovidersettings_created_by_aimodel_created_by_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='aiprovider',
            name='capabilities',
            field=models.JSONField(blank=True, default=dict, help_text='Provider capabilities options', verbose_name='Capabilities'),
        ),
    ]
