import os
import mimetypes
import hashlib
import uuid
from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone
from src.core.models.base import BaseModel

# Media type constants
MEDIA_TYPE_CHOICES = [
    ('image', 'Image'),
    ('video', 'Video'),
    ('pdf', 'PDF'),
    ('audio', 'Audio'),
]

# File size limits from environment variables
def get_file_size_limit(media_type):
    """Get file size limit based on media type from environment variables"""
    import os
    size_limits = {
        'image': int(os.getenv('MEDIA_IMAGE_SIZE_LIMIT', 5242880)),  # 5MB default
        'video': int(os.getenv('MEDIA_VIDEO_SIZE_LIMIT', 157286400)),  # 150MB default
        'audio': int(os.getenv('MEDIA_AUDIO_SIZE_LIMIT', 20971520)),  # 20MB default
        'pdf': int(os.getenv('MEDIA_PDF_SIZE_LIMIT', 10485760)),  # 10MB default
    }
    return size_limits.get(media_type, 10 * 1024 * 1024)  # 10MB default fallback


# File extension validation
ALLOWED_EXTENSIONS = {
    'image': os.getenv('MEDIA_IMAGE_EXTENSIONS', 'jpg,jpeg,webp,png,svg,gif').split(','),
    'video': os.getenv('MEDIA_VIDEO_EXTENSIONS', 'mp4,webm,mov').split(','),
    'pdf': os.getenv('MEDIA_PDF_EXTENSIONS', 'pdf').split(','),
    'audio': os.getenv('MEDIA_AUDIO_EXTENSIONS', 'mp3,ogg,aac,m4a').split(','),
}


def upload_media_path(instance, filename):
    """Generate upload path for media files"""
    name, ext = os.path.splitext(filename)
    ext = ext.lower()

    # Create path based on media type and current date
    today = timezone.now().date()
    return f"media/{instance.media_type}/{today.year}/{today.month:02d}/{today.day:02d}/{instance.public_id}{ext}"


class Media(BaseModel):
    """
    مدل مدیا با پشتیبانی از انواع فایل‌ها و بهینه‌سازی برای API
    """
    media_type = models.CharField(
        choices=MEDIA_TYPE_CHOICES,
        max_length=10,
        db_index=True,  # اضافه کردن ایندکس برای بهبود جستجو
        verbose_name="Media Type",
        help_text="Type of media file"
    )

    file = models.FileField(
        upload_to=upload_media_path,
        # حذف FileExtensionValidator چون در clean() بررسی می‌کنیم و انعطاف بیشتری داریم
        verbose_name="File",
        help_text="Uploaded media file"
    )

    file_size = models.PositiveIntegerField(
        null=True,
        blank=True,
        editable=False,
        verbose_name="File Size (bytes)",
        help_text="Size of the file in bytes"
    )

    mime_type = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        editable=False,
        verbose_name="MIME Type",
        help_text="Media file MIME type"
    )

    cover_image = models.ForeignKey(
        'self',  # Reference to another Media object
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Cover Image",
        help_text="Cover image for non-image media types",
        related_name='covered_media'
    )

    title = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        verbose_name="Title"
    )

    alt_text = models.CharField(
        max_length=255,
        blank=True,
        verbose_name="ALT Text",
        help_text="Alternative text for accessibility and SEO"
    )

    # افزودن فیلد کنترل درخواست‌های همزمان برای فایل‌های بزرگ
    etag = models.CharField(
        max_length=40,
        null=True,
        blank=True,
        editable=False,
        verbose_name="ETag",
        help_text="Used for HTTP caching"
    )

    def clean(self):
        """اعتبارسنجی فایل آپلود شده"""
        if not self.file:
            return

        # بررسی پسوند فایل
        filename = self.file.name
        ext = filename.split('.')[-1].lower()
        valid_extensions = ALLOWED_EXTENSIONS.get(self.media_type, [])

        if ext not in valid_extensions:
            allowed_exts = ", ".join(valid_extensions)
            raise ValidationError(f"Invalid file extension. Allowed extensions for {self.media_type}: {allowed_exts}")

        # بررسی حجم فایل
        max_size = get_file_size_limit(self.media_type)
        if self.file.size > max_size:
            max_size_mb = max_size / (1024 * 1024)
            raise ValidationError(f"File size cannot exceed {max_size_mb} MB for {self.media_type} files")

        # Cover image validation for non-image media types
        if self.media_type != 'image' and self.cover_image:
            # Check that the cover image is actually an image
            if self.cover_image.media_type != 'image':
                raise ValidationError("Cover image must be an image media type")

            # Check cover image size limits
            max_cover_size = get_file_size_limit('image')
            if self.cover_image.file_size and self.cover_image.file_size > max_cover_size:
                raise ValidationError("Cover image size cannot exceed 5MB")

        # اجرای اعتبارسنجی‌های پدر
        super().clean()

    def save(self, *args, **kwargs):
        """ذخیره بهینه شده - فقط در صورت تغییر فایل محاسبات انجام می‌شود"""
        # بررسی آیا فایل جدید است یا تغییر کرده
        is_new_file = False
        if self.pk:
            try:
                old_obj = Media.objects.get(pk=self.pk)
                if old_obj.file != self.file or old_obj.cover_image != self.cover_image:
                    is_new_file = True
            except Media.DoesNotExist:
                is_new_file = True
        else:
            is_new_file = True

        # اعتبارسنجی فقط برای فایل جدید
        if is_new_file:
            self.full_clean()

        # محاسبات فقط برای فایل جدید
        if self.file and is_new_file:
            self.file_size = self.file.size

            # MIME type detection
            content_type, _ = mimetypes.guess_type(self.file.name)
            if content_type:
                self.mime_type = content_type

            # ETag سریع بدون I/O
            hash_string = f"{self.file.name}_{self.file_size}_{timezone.now().timestamp()}"
            self.etag = hashlib.md5(hash_string.encode()).hexdigest()

        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        """حذف فایل‌های مربوطه پس از حذف مدل"""
        if self.file:
            if hasattr(self.file, 'path') and os.path.isfile(self.file.path):
                try:
                    os.remove(self.file.path)
                except (FileNotFoundError, PermissionError, OSError):
                    # نگذار حذف مدل به خاطر مشکل فایل فیزیکی شکست بخورد
                    pass

        if self.cover_image:
            if hasattr(self.cover_image, 'path') and os.path.isfile(self.cover_image.path):
                try:
                    os.remove(self.cover_image.path)
                except (FileNotFoundError, PermissionError, OSError):
                    pass

        super().delete(*args, **kwargs)

    def get_absolute_url(self):
        """دریافت آدرس دانلود فایل"""
        if self.file:
            return self.file.url
        return None

    def get_public_url(self):
        """دریافت آدرس عمومی مدیا با استفاده از public_id"""
        return f"/media/{self.public_id}/"

    class Meta(BaseModel.Meta):
        db_table = 'media'
        indexes = BaseModel.Meta.indexes + [
            # فقط ضروری‌ترین indexes برای سرعت بالا
            models.Index(fields=['media_type', 'is_active']),  # اصلی‌ترین query
            models.Index(fields=['created_at']),  # مرتب‌سازی
        ]
        verbose_name = "Media"
        verbose_name_plural = "Media"