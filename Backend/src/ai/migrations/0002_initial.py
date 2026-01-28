
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models

class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('ai', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='adminprovidersettings',
            name='admin',
            field=models.ForeignKey(help_text='Admin user these settings belong to', on_delete=django.db.models.deletion.CASCADE, related_name='ai_provider_settings', to=settings.AUTH_USER_MODEL, verbose_name='Admin User'),
        ),
        migrations.AddIndex(
            model_name='aiprovider',
            index=models.Index(fields=['slug', 'is_active'], name='ai_provider_slug_bef250_idx'),
        ),
        migrations.AddIndex(
            model_name='aiprovider',
            index=models.Index(fields=['is_active', 'sort_order'], name='ai_provider_is_acti_28c1fb_idx'),
        ),
        migrations.AddIndex(
            model_name='aiprovider',
            index=models.Index(fields=['allow_shared_for_normal_admins', 'is_active'], name='ai_provider_allow_s_cefcb5_idx'),
        ),
        migrations.AddField(
            model_name='aimodel',
            name='provider',
            field=models.ForeignKey(help_text='AI provider that owns this model', on_delete=django.db.models.deletion.CASCADE, related_name='models', to='ai.aiprovider', verbose_name='Provider'),
        ),
        migrations.AddField(
            model_name='adminprovidersettings',
            name='provider',
            field=models.ForeignKey(help_text='AI provider these settings are for', on_delete=django.db.models.deletion.CASCADE, related_name='admin_settings', to='ai.aiprovider', verbose_name='Provider'),
        ),
        migrations.AddIndex(
            model_name='aimodel',
            index=models.Index(fields=['provider', 'is_active', 'sort_order'], name='ai_models_provide_2d3f36_idx'),
        ),
        migrations.AlterUniqueTogether(
            name='aimodel',
            unique_together={('provider', 'model_id')},
        ),
        migrations.AddIndex(
            model_name='adminprovidersettings',
            index=models.Index(fields=['admin', 'provider'], name='ai_admin_pr_admin_i_62e2a2_idx'),
        ),
        migrations.AddIndex(
            model_name='adminprovidersettings',
            index=models.Index(fields=['admin', 'is_active'], name='ai_admin_pr_admin_i_f5b9cb_idx'),
        ),
        migrations.AddIndex(
            model_name='adminprovidersettings',
            index=models.Index(fields=['use_shared_api', 'is_active'], name='ai_admin_pr_use_sha_74fe66_idx'),
        ),
        migrations.AlterUniqueTogether(
            name='adminprovidersettings',
            unique_together={('admin', 'provider')},
        ),
    ]
