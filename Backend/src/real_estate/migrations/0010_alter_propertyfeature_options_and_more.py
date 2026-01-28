
import django.db.models.deletion
from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('core', '0001_initial'),
        ('media', '0001_initial'),
        ('real_estate', '0009_remove_agency_is_verified'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='propertyfeature',
            options={'ordering': ['group', 'title'], 'verbose_name': 'Property Feature', 'verbose_name_plural': 'Property Features'},
        ),
        migrations.RemoveIndex(
            model_name='propertyfeature',
            name='real_estate_is_acti_627f23_idx',
        ),
        migrations.AddField(
            model_name='propertyfeature',
            name='group',
            field=models.CharField(blank=True, db_index=True, help_text='Feature group (e.g., Interior, Exterior, Amenities, Security)', max_length=50, verbose_name='Group'),
        ),
        migrations.AddField(
            model_name='propertyfeature',
            name='image',
            field=models.ForeignKey(blank=True, help_text='Feature image or icon (SVG/PNG recommended)', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='feature_images', to='media.imagemedia', verbose_name='Image/Icon'),
        ),
        migrations.AddIndex(
            model_name='property',
            index=models.Index(fields=['is_active', '-created_at', 'id'], name='idx_admin_list_order'),
        ),
        migrations.AddIndex(
            model_name='propertyfeature',
            index=models.Index(fields=['is_active', 'group', 'title'], name='real_estate_is_acti_4cb869_idx'),
        ),
        migrations.RemoveField(
            model_name='propertyfeature',
            name='category',
        ),
    ]
