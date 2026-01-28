
from django.db import migrations, models
from django.contrib.postgres.indexes import GinIndex

class Migration(migrations.Migration):

    dependencies = [
        ('portfolio', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='portfolio',
            name='extra_attributes',
            field=models.JSONField(
                blank=True,
                default=dict,
                help_text='Flexible attributes for custom fields (price, brand, specifications, etc.)',
                verbose_name='Extra Attributes'
            ),
        ),
        migrations.AddIndex(
            model_name='portfolio',
            index=GinIndex(
                fields=['extra_attributes'],
                name='idx_portfolio_gin_extra_attrs'
            ),
        ),
    ]

