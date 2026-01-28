
import django.core.validators
from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('real_estate', '0003_make_agent_optional'),
    ]

    operations = [
        migrations.AlterField(
            model_name='property',
            name='built_area',
            field=models.DecimalField(blank=True, decimal_places=2, help_text='Built area in square meters (optional)', max_digits=10, null=True, validators=[django.core.validators.MinValueValidator(0)]),
        ),
        migrations.AlterField(
            model_name='property',
            name='land_area',
            field=models.DecimalField(blank=True, decimal_places=2, help_text='Land area in square meters (optional)', max_digits=10, null=True, validators=[django.core.validators.MinValueValidator(0)]),
        ),
    ]
