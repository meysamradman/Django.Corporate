import os
import mimetypes
import hashlib
import time
import uuid
from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.conf import settings
from src.core.models.base import BaseModel
from src.media.messages.messages import MEDIA_ERRORS

MEDIA_TYPE_CHOICES = [
    ('image', 'Image'),
    ('video', 'Video'),
    ('audio', 'Audio'),
    ('pdf', 'PDF'),
]

def get_file_size_limit(media_type):
    return settings.MEDIA_FILE_SIZE_LIMITS.get(media_type, 10 * 1024 * 1024)

ALLOWED_EXTENSIONS = settings.MEDIA_ALLOWED_EXTENSIONS

def detect_media_type_from_extension(file_ext):
    file_ext = file_ext.lower().strip('.') if file_ext else ''
    
    for media_type, allowed_exts in ALLOWED_EXTENSIONS.items():
        if file_ext in allowed_exts:
            return media_type
    
    return 'image'

def upload_media_path(instance, filename):
    name, ext = os.path.splitext(filename)
    ext = ext.lower()
    today = timezone.now().date()
    
    model_name = instance._meta.model_name
    if model_name == 'imagemedia':
        folder_name = 'image'
    elif model_name == 'videomedia':
        folder_name = 'video'
    elif model_name == 'audiomedia':
        folder_name = 'audio'
    elif model_name == 'documentmedia':
        folder_name = 'document'
    else:
        folder_name = model_name.replace('media', '')
    
    if instance.pk is None:
        identifier = str(uuid.uuid4())[:8]
    else:
        identifier = str(instance.pk)
    
    return f"{folder_name}/{today.year}/{today.month:02d}/{today.day:02d}/{identifier}{ext}"

class AbstractMedia(BaseModel):

    file = models.FileField(upload_to=upload_media_path)
    file_size = models.PositiveIntegerField(editable=False, null=True, blank=True)
    mime_type = models.CharField(max_length=100, editable=False, blank=True)
    title = models.CharField(max_length=100, blank=True, db_index=True)
    alt_text = models.CharField(max_length=255, blank=True)
    etag = models.CharField(max_length=40, editable=False, blank=True)

    class Meta(BaseModel.Meta):
        abstract = True
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['created_at']),
            models.Index(fields=['is_active', 'created_at']),
            models.Index(fields=['title']),
        ]

    def clean(self):
        super().clean()

    def save(self, *args, **kwargs):
        if self.file and (not self.file_size or not self.etag):
            self.file_size = self.file.size
            self.mime_type, _ = mimetypes.guess_type(self.file.name)
            unique_str = f"{self.file.name}_{self.file_size}_{time.time()}"
            self.etag = hashlib.md5(unique_str.encode()).hexdigest()

        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        storage = getattr(self.file, "storage", None)
        name = getattr(self.file, "name", None)
        super().delete(*args, **kwargs)
        if storage and name:
            try:
                storage.delete(name)
            except Exception:
                pass

    def get_absolute_url(self):
        return self.file.url if self.file else None

class AbstractImageMedia(AbstractMedia):
    file = models.ImageField(upload_to=upload_media_path)

    class Meta(AbstractMedia.Meta):
        abstract = True

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

    def clean(self):
        super().clean()
        if not self.file:
            return
        
        ext = self.file.name.split('.')[-1].lower()
        if ext not in ALLOWED_EXTENSIONS['image']:
            raise ValidationError(MEDIA_ERRORS['invalid_image_extension'].format(extensions=', '.join(ALLOWED_EXTENSIONS['image'])))
        
        max_size = get_file_size_limit('image')
        if self.file.size > max_size:
            max_size_mb = max_size / (1024 * 1024)
            raise ValidationError(MEDIA_ERRORS['image_too_large'].format(max_size=f"{max_size_mb:.1f}"))

class AbstractVideoMedia(AbstractMedia):
    file = models.FileField(upload_to=upload_media_path)
    duration = models.PositiveIntegerField(null=True, blank=True)
    cover_image = models.ForeignKey(
        'ImageMedia', null=True, blank=True, on_delete=models.SET_NULL,
        related_name='covered_videos', help_text="Cover image for this video"
    )

    class Meta(AbstractMedia.Meta):
        abstract = True

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

    def clean(self):
        super().clean()
        if not self.file:
            return
        
        ext = self.file.name.split('.')[-1].lower()
        if ext not in ALLOWED_EXTENSIONS['video']:
            raise ValidationError(MEDIA_ERRORS['invalid_video_extension'].format(extensions=', '.join(ALLOWED_EXTENSIONS['video'])))
        
        max_size = get_file_size_limit('video')
        if self.file.size > max_size:
            max_size_mb = max_size / (1024 * 1024)
            raise ValidationError(MEDIA_ERRORS['video_too_large'].format(max_size=f"{max_size_mb:.1f}"))
        
        if self.cover_image and not isinstance(self.cover_image, ImageMedia):
            raise ValidationError(MEDIA_ERRORS['cover_must_be_image'])

class AbstractAudioMedia(AbstractMedia):
    file = models.FileField(upload_to=upload_media_path)
    duration = models.PositiveIntegerField(null=True, blank=True)
    cover_image = models.ForeignKey(
        'ImageMedia', null=True, blank=True, on_delete=models.SET_NULL,
        related_name='covered_audios', help_text="Cover image for this audio"
    )

    class Meta(AbstractMedia.Meta):
        abstract = True

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

    def clean(self):
        super().clean()
        if not self.file:
            return
        
        ext = self.file.name.split('.')[-1].lower()
        if ext not in ALLOWED_EXTENSIONS['audio']:
            raise ValidationError(MEDIA_ERRORS['invalid_audio_extension'].format(extensions=', '.join(ALLOWED_EXTENSIONS['audio'])))
        
        max_size = get_file_size_limit('audio')
        if self.file.size > max_size:
            max_size_mb = max_size / (1024 * 1024)
            raise ValidationError(MEDIA_ERRORS['audio_too_large'].format(max_size=f"{max_size_mb:.1f}"))
        
        if self.cover_image and not isinstance(self.cover_image, ImageMedia):
            raise ValidationError(MEDIA_ERRORS['cover_must_be_image'])

class AbstractDocumentMedia(AbstractMedia):
    file = models.FileField(upload_to=upload_media_path)
    cover_image = models.ForeignKey(
        'ImageMedia', null=True, blank=True, on_delete=models.SET_NULL,
        related_name='covered_documents', help_text="Cover image for this document"
    )

    class Meta(AbstractMedia.Meta):
        abstract = True

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

    def clean(self):
        super().clean()
        if not self.file:
            return
        
        ext = self.file.name.split('.')[-1].lower()
        if ext not in ALLOWED_EXTENSIONS['pdf']:
            raise ValidationError(MEDIA_ERRORS['invalid_document_extension'].format(extensions=', '.join(ALLOWED_EXTENSIONS['pdf'])))

class ImageMedia(AbstractImageMedia):
    class Meta(AbstractImageMedia.Meta):
        db_table = 'media_images'
        verbose_name = "Image Media"
        verbose_name_plural = "Image Media"

class VideoMedia(AbstractVideoMedia):
    class Meta(AbstractVideoMedia.Meta):
        db_table = 'media_videos'
        verbose_name = "Video Media"
        verbose_name_plural = "Video Media"

class AudioMedia(AbstractAudioMedia):
    class Meta(AbstractAudioMedia.Meta):
        db_table = 'media_audios'
        verbose_name = "Audio Media"
        verbose_name_plural = "Audio Media"

class DocumentMedia(AbstractDocumentMedia):
    class Meta(AbstractDocumentMedia.Meta):
        db_table = 'media_documents'
        verbose_name = "Document Media"
        verbose_name_plural = "Document Media"