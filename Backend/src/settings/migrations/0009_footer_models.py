import django.db.models.deletion
import django.utils.timezone
import uuid
from django.conf import settings
from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('settings', '0008_generalsettings_footer_about'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='FooterSection',
            fields=[
                ('id', models.AutoField(editable=False, help_text='Primary key identifier', primary_key=True, serialize=False, verbose_name='ID')),
                ('public_id', models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, help_text='Unique identifier for public-facing operations', unique=True, verbose_name='Public ID')),
                ('is_active', models.BooleanField(db_index=True, default=True, help_text='Designates whether this record should be treated as active', verbose_name='Active Status')),
                ('created_at', models.DateTimeField(db_index=True, default=django.utils.timezone.now, editable=False, help_text='Date and time when the record was created', verbose_name='Created At')),
                ('updated_at', models.DateTimeField(auto_now=True, help_text='Date and time when the record was last updated', verbose_name='Updated At')),
                ('title', models.CharField(max_length=120, verbose_name='title')),
                ('order', models.PositiveIntegerField(default=0, verbose_name='order')),
                ('created_by', models.ForeignKey(blank=True, help_text='User who created this record', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(app_label)s_%(class)s_created', to=settings.AUTH_USER_MODEL, verbose_name='Created By')),
            ],
            options={
                'verbose_name': 'footer section',
                'verbose_name_plural': 'footer sections',
                'ordering': ['order', '-created_at'],
            },
        ),
        migrations.CreateModel(
            name='FooterLink',
            fields=[
                ('id', models.AutoField(editable=False, help_text='Primary key identifier', primary_key=True, serialize=False, verbose_name='ID')),
                ('public_id', models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, help_text='Unique identifier for public-facing operations', unique=True, verbose_name='Public ID')),
                ('is_active', models.BooleanField(db_index=True, default=True, help_text='Designates whether this record should be treated as active', verbose_name='Active Status')),
                ('created_at', models.DateTimeField(db_index=True, default=django.utils.timezone.now, editable=False, help_text='Date and time when the record was created', verbose_name='Created At')),
                ('updated_at', models.DateTimeField(auto_now=True, help_text='Date and time when the record was last updated', verbose_name='Updated At')),
                ('title', models.CharField(max_length=120, verbose_name='title')),
                ('href', models.CharField(help_text='Link URL or relative path (e.g., /about)', max_length=500, verbose_name='href')),
                ('order', models.PositiveIntegerField(default=0, verbose_name='order')),
                ('created_by', models.ForeignKey(blank=True, help_text='User who created this record', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(app_label)s_%(class)s_created', to=settings.AUTH_USER_MODEL, verbose_name='Created By')),
                ('section', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='links', to='settings.footersection', verbose_name='section')),
            ],
            options={
                'verbose_name': 'footer link',
                'verbose_name_plural': 'footer links',
                'ordering': ['order', '-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='footerlink',
            index=models.Index(fields=['section', 'is_active', 'order'], name='settings_foo_section_9b3d44_idx'),
        ),
    ]
