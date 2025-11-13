import os
import mimetypes
import hashlib
import time
import uuid
from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone
from src.core.models.base import BaseModel

# -----------------------------
# 📦 تنظیمات پایه و ابزارها
# -----------------------------

MEDIA_TYPE_CHOICES = [
    ('image', 'Image'),
    ('video', 'Video'),
    ('audio', 'Audio'),
    ('pdf', 'PDF'),
]

# اندازه مجاز فایل‌ها از ENV
def get_file_size_limit(media_type):
    """دریافت محدودیت حجم فایل از متغیرهای محیطی"""
    size_limits = {
        'image': int(os.getenv('MEDIA_IMAGE_SIZE_LIMIT', 5 * 1024 * 1024)),   # 5MB
        'video': int(os.getenv('MEDIA_VIDEO_SIZE_LIMIT', 150 * 1024 * 1024)), # 150MB
        'audio': int(os.getenv('MEDIA_AUDIO_SIZE_LIMIT', 20 * 1024 * 1024)),  # 20MB
        'pdf': int(os.getenv('MEDIA_PDF_SIZE_LIMIT', 10 * 1024 * 1024)),      # 10MB
    }
    return size_limits.get(media_type, 10 * 1024 * 1024)

# پسوندهای مجاز
ALLOWED_EXTENSIONS = {
    'image': os.getenv('MEDIA_IMAGE_EXTENSIONS', 'jpg,jpeg,png,webp,gif,svg').split(','),
    'video': os.getenv('MEDIA_VIDEO_EXTENSIONS', 'mp4,webm,mov').split(','),
    'audio': os.getenv('MEDIA_AUDIO_EXTENSIONS', 'mp3,ogg,aac,m4a').split(','),
    'pdf': os.getenv('MEDIA_PDF_EXTENSIONS', 'pdf').split(','),
}

# مسیر آپلود داینامیک
def upload_media_path(instance, filename):
    """ساخت مسیر آپلود داینامیک بر اساس نوع و تاریخ"""
    name, ext = os.path.splitext(filename)
    ext = ext.lower()
    today = timezone.now().date()
    
    # Use simpler folder names based on media type (without 'media/' prefix)
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
        # For other media types, remove 'media' from the name
        folder_name = model_name.replace('media', '')
    
    # Use a UUID for temporary files until the instance is saved
    if instance.pk is None:
        identifier = str(uuid.uuid4())[:8]  # Short UUID for temp files
    else:
        identifier = str(instance.pk)
    
    # Return path without 'media/' prefix since Django's MEDIA_URL already includes it
    return f"{folder_name}/{today.year}/{today.month:02d}/{today.day:02d}/{identifier}{ext}"

# -----------------------------
# 🧱 کلاس پایه Abstract
# -----------------------------

class AbstractMedia(BaseModel):
    """کلاس پایه abstract برای همه‌ی مدیاها"""

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

    # -----------------------------
    # 🧩 Validation
    # -----------------------------
    def clean(self):
        # Validation moved to child classes
        super().clean()

    # -----------------------------
    # 💾 Save
    # -----------------------------
    def save(self, *args, **kwargs):
        if self.file and (not self.file_size or not self.etag):
            self.file_size = self.file.size
            self.mime_type, _ = mimetypes.guess_type(self.file.name)
            # ETag سریع برای caching
            unique_str = f"{self.file.name}_{self.file_size}_{time.time()}"
            self.etag = hashlib.md5(unique_str.encode()).hexdigest()

        super().save(*args, **kwargs)

    # -----------------------------
    # 🗑️ Delete
    # -----------------------------
    def delete(self, *args, **kwargs):
        storage = getattr(self.file, "storage", None)
        name = getattr(self.file, "name", None)
        super().delete(*args, **kwargs)
        if storage and name:
            try:
                storage.delete(name)
            except Exception:
                pass  # حذف فایل بدون خطای بحرانی

    # -----------------------------
    # 🔗 آدرس فایل
    # -----------------------------
    def get_absolute_url(self):
        return self.file.url if self.file else None

# -----------------------------
# 🖼️ مدل پایه برای تصاویر
# -----------------------------
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
            raise ValidationError(f"Invalid image extension. Allowed: {', '.join(ALLOWED_EXTENSIONS['image'])}")
        
        max_size = get_file_size_limit('image')
        if self.file.size > max_size:
            raise ValidationError(f"Image too large. Max: {max_size / (1024 * 1024):.1f} MB")

# -----------------------------
# 🎞️ مدل پایه برای ویدیو
# -----------------------------
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
            raise ValidationError(f"Invalid video extension. Allowed: {', '.join(ALLOWED_EXTENSIONS['video'])}")
        
        max_size = get_file_size_limit('video')
        if self.file.size > max_size:
            raise ValidationError(f"Video too large. Max: {max_size / (1024 * 1024):.1f} MB")
        
        # بررسی cover_image برای ویدیوها
        if self.cover_image and not isinstance(self.cover_image, ImageMedia):
            raise ValidationError("Cover must be an ImageMedia instance.")

# -----------------------------
# 🎧 مدل پایه برای صوت
# -----------------------------
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
            raise ValidationError(f"Invalid audio extension. Allowed: {', '.join(ALLOWED_EXTENSIONS['audio'])}")
        
        max_size = get_file_size_limit('audio')
        if self.file.size > max_size:
            raise ValidationError(f"Audio too large. Max: {max_size / (1024 * 1024):.1f} MB")
        
        # بررسی cover_image برای صوت‌ها
        if self.cover_image and not isinstance(self.cover_image, ImageMedia):
            raise ValidationError("Cover must be an ImageMedia instance.")

# -----------------------------
# 📄 مدل پایه برای اسناد
# -----------------------------
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
            raise ValidationError(f"Invalid document extension. Allowed: {', '.join(ALLOWED_EXTENSIONS['pdf'])}")

# -----------------------------
# 📦 مدل‌های Concrete اصلی
# -----------------------------

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