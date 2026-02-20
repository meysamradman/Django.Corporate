from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('real_estate', '0021_propertyfeature_slug_parent_two_level'),
    ]

    operations = [
        migrations.AddField(
            model_name='propertystate',
            name='short_description',
            field=models.CharField(
                blank=True,
                default='',
                help_text='Short summary text for this property state',
                max_length=255,
                verbose_name='Short Description',
            ),
        ),
    ]
