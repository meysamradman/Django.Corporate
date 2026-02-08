
import django.db.models.deletion
import django.utils.timezone
import uuid
from django.conf import settings
from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('settings', '0004_alter_slider_image_alter_slider_video'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='MapSettings',
            fields=[
                ('id', models.AutoField(editable=False, help_text='Primary key identifier', primary_key=True, serialize=False, verbose_name='ID')),
                ('public_id', models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, help_text='Unique identifier for public-facing operations', unique=True, verbose_name='Public ID')),
                ('is_active', models.BooleanField(db_index=True, default=True, help_text='Designates whether this record should be treated as active', verbose_name='Active Status')),
                ('created_at', models.DateTimeField(db_index=True, default=django.utils.timezone.now, editable=False, help_text='Date and time when the record was created', verbose_name='Created At')),
                ('updated_at', models.DateTimeField(auto_now=True, help_text='Date and time when the record was last updated', verbose_name='Updated At')),
                ('provider', models.CharField(choices=[('leaflet', 'Leaflet / OpenStreetMap'), ('google_maps', 'Google Maps'), ('neshan', 'Neshan (Iranian)'), ('cedarmaps', 'CedarMaps (Iranian)')], default='leaflet', max_length=20, verbose_name='Map Provider')),
                ('google_maps_api_key', models.CharField(blank=True, max_length=255, null=True, verbose_name='Google Maps API Key')),
                ('neshan_api_key', models.CharField(blank=True, max_length=255, null=True, verbose_name='Neshan API Key')),
                ('cedarmaps_api_key', models.CharField(blank=True, max_length=255, null=True, verbose_name='CedarMaps API Key')),
                ('created_by', models.ForeignKey(blank=True, help_text='User who created this record', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(app_label)s_%(class)s_created', to=settings.AUTH_USER_MODEL, verbose_name='Created By')),
            ],
            options={
                'verbose_name': 'Map Settings',
                'verbose_name_plural': 'Map Settings',
                'db_table': 'settings_map',
                'ordering': ['-created_at'],
                'abstract': False,
                'indexes': [models.Index(fields=['is_active', 'created_at'], name='settings_ma_is_acti_7ba64e_idx')],
            },
        ),
    ]
