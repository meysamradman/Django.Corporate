from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('settings', '0006_remove_mapsettings_cedarmaps_api_key_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='mapsettings',
            name='provider',
            field=models.CharField(
                choices=[
                    ('leaflet', 'Leaflet / OpenStreetMap'),
                    ('google_maps', 'Google Maps'),
                    ('neshan', 'Neshan (Iranian)'),
                ],
                default='leaflet',
                max_length=20,
                verbose_name='Map Provider',
            ),
        ),
    ]
