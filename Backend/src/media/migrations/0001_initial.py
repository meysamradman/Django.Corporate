
import django.db.models.deletion
import django.utils.timezone
import src.media.models.media
import uuid
from django.db import migrations, models

class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='ImageMedia',
            fields=[
                ('id', models.AutoField(editable=False, help_text='Primary key identifier', primary_key=True, serialize=False, verbose_name='ID')),
                ('public_id', models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, help_text='Unique identifier for public-facing operations', unique=True, verbose_name='Public ID')),
                ('is_active', models.BooleanField(db_index=True, default=True, help_text='Designates whether this record should be treated as active', verbose_name='Active Status')),
                ('created_at', models.DateTimeField(db_index=True, default=django.utils.timezone.now, editable=False, help_text='Date and time when the record was created', verbose_name='Created At')),
                ('updated_at', models.DateTimeField(auto_now=True, help_text='Date and time when the record was last updated', verbose_name='Updated At')),
                ('title', models.CharField(blank=True, db_index=True, help_text='Media file title', max_length=100, verbose_name='Title')),
                ('alt_text', models.CharField(blank=True, help_text='Alternative text for accessibility', max_length=150, verbose_name='Alt Text')),
                ('file_size', models.PositiveIntegerField(blank=True, editable=False, help_text='File size in bytes', null=True, verbose_name='File Size')),
                ('mime_type', models.CharField(blank=True, editable=False, help_text='MIME type of the file', max_length=100, verbose_name='MIME Type')),
                ('etag', models.CharField(blank=True, editable=False, help_text='Entity tag for cache validation', max_length=40, verbose_name='ETag')),
                ('file', models.ImageField(help_text='Image file', upload_to=src.media.models.media.upload_media_path, verbose_name='Image File')),
            ],
            options={
                'verbose_name': 'Image Media',
                'verbose_name_plural': 'Image Media',
                'db_table': 'media_images',
                'ordering': ['-created_at'],
                'abstract': False,
                'indexes': [models.Index(fields=['is_active', '-created_at'], name='media_image_is_acti_e2af4b_idx')],
            },
        ),
        migrations.CreateModel(
            name='DocumentMedia',
            fields=[
                ('id', models.AutoField(editable=False, help_text='Primary key identifier', primary_key=True, serialize=False, verbose_name='ID')),
                ('public_id', models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, help_text='Unique identifier for public-facing operations', unique=True, verbose_name='Public ID')),
                ('is_active', models.BooleanField(db_index=True, default=True, help_text='Designates whether this record should be treated as active', verbose_name='Active Status')),
                ('created_at', models.DateTimeField(db_index=True, default=django.utils.timezone.now, editable=False, help_text='Date and time when the record was created', verbose_name='Created At')),
                ('updated_at', models.DateTimeField(auto_now=True, help_text='Date and time when the record was last updated', verbose_name='Updated At')),
                ('title', models.CharField(blank=True, db_index=True, help_text='Media file title', max_length=100, verbose_name='Title')),
                ('alt_text', models.CharField(blank=True, help_text='Alternative text for accessibility', max_length=150, verbose_name='Alt Text')),
                ('file_size', models.PositiveIntegerField(blank=True, editable=False, help_text='File size in bytes', null=True, verbose_name='File Size')),
                ('mime_type', models.CharField(blank=True, editable=False, help_text='MIME type of the file', max_length=100, verbose_name='MIME Type')),
                ('etag', models.CharField(blank=True, editable=False, help_text='Entity tag for cache validation', max_length=40, verbose_name='ETag')),
                ('file', models.FileField(help_text='Document file', upload_to=src.media.models.media.upload_media_path, verbose_name='Document File')),
                ('cover_image', models.ForeignKey(blank=True, help_text='Cover image for this document', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='covered_documents', to='media.imagemedia', verbose_name='Cover Image')),
            ],
            options={
                'verbose_name': 'Document Media',
                'verbose_name_plural': 'Document Media',
                'db_table': 'media_documents',
                'ordering': ['-created_at'],
                'abstract': False,
                'indexes': [models.Index(fields=['is_active', '-created_at'], name='media_docum_is_acti_c29474_idx')],
            },
        ),
        migrations.CreateModel(
            name='AudioMedia',
            fields=[
                ('id', models.AutoField(editable=False, help_text='Primary key identifier', primary_key=True, serialize=False, verbose_name='ID')),
                ('public_id', models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, help_text='Unique identifier for public-facing operations', unique=True, verbose_name='Public ID')),
                ('is_active', models.BooleanField(db_index=True, default=True, help_text='Designates whether this record should be treated as active', verbose_name='Active Status')),
                ('created_at', models.DateTimeField(db_index=True, default=django.utils.timezone.now, editable=False, help_text='Date and time when the record was created', verbose_name='Created At')),
                ('updated_at', models.DateTimeField(auto_now=True, help_text='Date and time when the record was last updated', verbose_name='Updated At')),
                ('title', models.CharField(blank=True, db_index=True, help_text='Media file title', max_length=100, verbose_name='Title')),
                ('alt_text', models.CharField(blank=True, help_text='Alternative text for accessibility', max_length=150, verbose_name='Alt Text')),
                ('file_size', models.PositiveIntegerField(blank=True, editable=False, help_text='File size in bytes', null=True, verbose_name='File Size')),
                ('mime_type', models.CharField(blank=True, editable=False, help_text='MIME type of the file', max_length=100, verbose_name='MIME Type')),
                ('etag', models.CharField(blank=True, editable=False, help_text='Entity tag for cache validation', max_length=40, verbose_name='ETag')),
                ('file', models.FileField(help_text='Audio file', upload_to=src.media.models.media.upload_media_path, verbose_name='Audio File')),
                ('duration', models.PositiveIntegerField(blank=True, help_text='Audio duration in seconds', null=True, verbose_name='Duration')),
                ('cover_image', models.ForeignKey(blank=True, help_text='Cover image for this audio', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='covered_audios', to='media.imagemedia', verbose_name='Cover Image')),
            ],
            options={
                'verbose_name': 'Audio Media',
                'verbose_name_plural': 'Audio Media',
                'db_table': 'media_audios',
                'ordering': ['-created_at'],
                'abstract': False,
                'indexes': [models.Index(fields=['is_active', '-created_at'], name='media_audio_is_acti_f9f3ee_idx')],
            },
        ),
        migrations.CreateModel(
            name='VideoMedia',
            fields=[
                ('id', models.AutoField(editable=False, help_text='Primary key identifier', primary_key=True, serialize=False, verbose_name='ID')),
                ('public_id', models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, help_text='Unique identifier for public-facing operations', unique=True, verbose_name='Public ID')),
                ('is_active', models.BooleanField(db_index=True, default=True, help_text='Designates whether this record should be treated as active', verbose_name='Active Status')),
                ('created_at', models.DateTimeField(db_index=True, default=django.utils.timezone.now, editable=False, help_text='Date and time when the record was created', verbose_name='Created At')),
                ('updated_at', models.DateTimeField(auto_now=True, help_text='Date and time when the record was last updated', verbose_name='Updated At')),
                ('title', models.CharField(blank=True, db_index=True, help_text='Media file title', max_length=100, verbose_name='Title')),
                ('alt_text', models.CharField(blank=True, help_text='Alternative text for accessibility', max_length=150, verbose_name='Alt Text')),
                ('file_size', models.PositiveIntegerField(blank=True, editable=False, help_text='File size in bytes', null=True, verbose_name='File Size')),
                ('mime_type', models.CharField(blank=True, editable=False, help_text='MIME type of the file', max_length=100, verbose_name='MIME Type')),
                ('etag', models.CharField(blank=True, editable=False, help_text='Entity tag for cache validation', max_length=40, verbose_name='ETag')),
                ('file', models.FileField(help_text='Video file', upload_to=src.media.models.media.upload_media_path, verbose_name='Video File')),
                ('duration', models.PositiveIntegerField(blank=True, help_text='Video duration in seconds', null=True, verbose_name='Duration')),
                ('cover_image', models.ForeignKey(blank=True, help_text='Cover image for this video', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='covered_videos', to='media.imagemedia', verbose_name='Cover Image')),
            ],
            options={
                'verbose_name': 'Video Media',
                'verbose_name_plural': 'Video Media',
                'db_table': 'media_videos',
                'ordering': ['-created_at'],
                'abstract': False,
                'indexes': [models.Index(fields=['is_active', '-created_at'], name='media_video_is_acti_e3716e_idx')],
            },
        ),
    ]
