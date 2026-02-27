from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('media', '0001_initial'),
        ('settings', '0011_rename_settings_foo_section_9b3d44_idx_settings_fo_section_af18b1_idx'),
    ]

    operations = [
        migrations.AddField(
            model_name='slider',
            name='video_cover',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='sliders_video_cover',
                to='media.imagemedia',
                verbose_name='video cover',
            ),
        ),
    ]
