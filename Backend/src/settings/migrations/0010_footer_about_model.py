import django.db.models.deletion
import django.utils.timezone
import uuid
from django.conf import settings
from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('settings', '0009_footer_models'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.RemoveField(
            model_name='generalsettings',
            name='footer_about',
        ),
        migrations.CreateModel(
            name='FooterAbout',
            fields=[
                ('id', models.AutoField(editable=False, help_text='Primary key identifier', primary_key=True, serialize=False, verbose_name='ID')),
                ('public_id', models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, help_text='Unique identifier for public-facing operations', unique=True, verbose_name='Public ID')),
                ('is_active', models.BooleanField(db_index=True, default=True, help_text='Designates whether this record should be treated as active', verbose_name='Active Status')),
                ('created_at', models.DateTimeField(db_index=True, default=django.utils.timezone.now, editable=False, help_text='Date and time when the record was created', verbose_name='Created At')),
                ('updated_at', models.DateTimeField(auto_now=True, help_text='Date and time when the record was last updated', verbose_name='Updated At')),
                ('title', models.CharField(default='درباره ما', max_length=120, verbose_name='title')),
                ('text', models.TextField(blank=True, verbose_name='text')),
                ('created_by', models.ForeignKey(blank=True, help_text='User who created this record', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(app_label)s_%(class)s_created', to=settings.AUTH_USER_MODEL, verbose_name='Created By')),
            ],
            options={
                'verbose_name': 'footer about',
                'verbose_name_plural': 'footer about',
                'ordering': ['-created_at'],
            },
        ),
    ]
