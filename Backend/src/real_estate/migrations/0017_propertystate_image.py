import django.db.models.deletion
from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('media', '0001_initial'),
        ('real_estate', '0016_alter_property_state_alter_propertystate_usage_type'),
    ]

    operations = [
        migrations.AddField(
            model_name='propertystate',
            name='image',
            field=models.ForeignKey(
                blank=True,
                help_text='Main image for this property state',
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='property_state_images',
                to='media.imagemedia',
                verbose_name='Main Image',
            ),
        ),
    ]
