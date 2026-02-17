
import django.core.validators
import django.db.models.deletion
import django.utils.timezone
import uuid
from django.conf import settings
from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('media', '0002_audiomedia_created_by_documentmedia_created_by_and_more'),
        ('user', '0002_adminprofile_created_by_adminrole_created_by_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='AdminProfileSocialMedia',
            fields=[
                ('id', models.AutoField(editable=False, help_text='Primary key identifier', primary_key=True, serialize=False, verbose_name='ID')),
                ('public_id', models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, help_text='Unique identifier for public-facing operations', unique=True, verbose_name='Public ID')),
                ('is_active', models.BooleanField(db_index=True, default=True, help_text='Designates whether this record should be treated as active', verbose_name='Active Status')),
                ('created_at', models.DateTimeField(db_index=True, default=django.utils.timezone.now, editable=False, help_text='Date and time when the record was created', verbose_name='Created At')),
                ('updated_at', models.DateTimeField(auto_now=True, help_text='Date and time when the record was last updated', verbose_name='Updated At')),
                ('name', models.CharField(db_index=True, help_text='Social media name (e.g., Instagram, Telegram, LinkedIn)', max_length=100, verbose_name='Social Media Name')),
                ('url', models.URLField(help_text='Full social media page link', max_length=300, validators=[django.core.validators.URLValidator()], verbose_name='URL')),
                ('order', models.PositiveIntegerField(db_index=True, default=0, help_text='Display order in list (lower numbers appear first)', verbose_name='Display Order')),
                ('admin_profile', models.ForeignKey(help_text='Related admin profile', on_delete=django.db.models.deletion.CASCADE, related_name='social_media', to='user.adminprofile', verbose_name='Admin Profile')),
                ('created_by', models.ForeignKey(blank=True, help_text='User who created this record', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(app_label)s_%(class)s_created', to=settings.AUTH_USER_MODEL, verbose_name='Created By')),
                ('icon', models.ForeignKey(blank=True, help_text='Social media icon or image', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='admin_profile_social_media_icons', to='media.imagemedia', verbose_name='Icon')),
            ],
            options={
                'verbose_name': 'Admin Profile Social Media',
                'verbose_name_plural': 'Admin Profile Social Media',
                'db_table': 'admin_profile_social_media',
                'ordering': ['order', '-created_at'],
                'abstract': False,
                'indexes': [models.Index(fields=['admin_profile', 'is_active', 'order'], name='admin_profi_admin_p_e2484e_idx')],
            },
        ),
        migrations.CreateModel(
            name='UserProfileSocialMedia',
            fields=[
                ('id', models.AutoField(editable=False, help_text='Primary key identifier', primary_key=True, serialize=False, verbose_name='ID')),
                ('public_id', models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, help_text='Unique identifier for public-facing operations', unique=True, verbose_name='Public ID')),
                ('is_active', models.BooleanField(db_index=True, default=True, help_text='Designates whether this record should be treated as active', verbose_name='Active Status')),
                ('created_at', models.DateTimeField(db_index=True, default=django.utils.timezone.now, editable=False, help_text='Date and time when the record was created', verbose_name='Created At')),
                ('updated_at', models.DateTimeField(auto_now=True, help_text='Date and time when the record was last updated', verbose_name='Updated At')),
                ('name', models.CharField(db_index=True, help_text='Social media name (e.g., Instagram, Telegram, LinkedIn)', max_length=100, verbose_name='Social Media Name')),
                ('url', models.URLField(help_text='Full social media page link', max_length=300, validators=[django.core.validators.URLValidator()], verbose_name='URL')),
                ('order', models.PositiveIntegerField(db_index=True, default=0, help_text='Display order in list (lower numbers appear first)', verbose_name='Display Order')),
                ('created_by', models.ForeignKey(blank=True, help_text='User who created this record', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(app_label)s_%(class)s_created', to=settings.AUTH_USER_MODEL, verbose_name='Created By')),
                ('icon', models.ForeignKey(blank=True, help_text='Social media icon or image', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='user_profile_social_media_icons', to='media.imagemedia', verbose_name='Icon')),
                ('user_profile', models.ForeignKey(help_text='Related user profile', on_delete=django.db.models.deletion.CASCADE, related_name='social_media', to='user.userprofile', verbose_name='User Profile')),
            ],
            options={
                'verbose_name': 'User Profile Social Media',
                'verbose_name_plural': 'User Profile Social Media',
                'db_table': 'user_profile_social_media',
                'ordering': ['order', '-created_at'],
                'abstract': False,
                'indexes': [models.Index(fields=['user_profile', 'is_active', 'order'], name='user_profil_user_pr_01a5e7_idx')],
            },
        ),
    ]
