from django.db import models
from django.core.exceptions import ValidationError

from src.core.models.base import BaseModel
from src.blog.models.blog import Blog
from src.media.models.media import ImageMedia, VideoMedia, AudioMedia, DocumentMedia

class BlogImage(BaseModel):
    """تصاویر مربوط به نمونه‌کار (گالری تصاویر)"""

    blog = models.ForeignKey(
        Blog,
        on_delete=models.CASCADE,
        related_name="images",
        db_index=True,
        verbose_name="Blog",
        help_text="نمونه‌کاری که این تصویر به آن تعلق دارد."
    )
    image = models.ForeignKey(
        ImageMedia,
        on_delete=models.CASCADE,
        related_name="blog_links",
        db_index=True,
        verbose_name="Image File",
        help_text="فایل تصویر مربوط به نمونه‌کار."
    )
    is_main = models.BooleanField(
        default=False,
        db_index=True,
        verbose_name="Main Image",
        help_text="فقط یک تصویر می‌تواند تصویر اصلی نمونه‌کار باشد."
    )
    order = models.PositiveIntegerField(default=0, db_index=True)

    class Meta:
        db_table = "blog_images"
        ordering = ["order", "-created_at"]
        verbose_name = "Blog Image"
        verbose_name_plural = "Blog Images"
        indexes = [
            models.Index(fields=["blog", "is_main"]),
            models.Index(fields=["blog", "order"]),
        ]

    def clean(self):
        """فقط یک تصویر اصلی مجاز است"""
        if self.is_main:
            exists = BlogImage.objects.filter(
                blog=self.blog,
                is_main=True
            ).exclude(pk=self.pk).exists()
            if exists:
                raise ValidationError("Only one main image is allowed per blog.")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.blog.title} - {self.image.title or self.image.file.name}"


class BlogVideo(BaseModel):
    """ویدیوهای مربوط به نمونه‌کار"""

    blog = models.ForeignKey(
        Blog,
        on_delete=models.CASCADE,
        related_name="videos",
        db_index=True
    )
    video = models.ForeignKey(
        VideoMedia,
        on_delete=models.CASCADE,
        related_name="blog_links",
        db_index=True
    )
    cover_image = models.ForeignKey(
        ImageMedia,
        on_delete=models.SET_NULL,
        related_name="blog_video_covers",
        null=True,
        blank=True,
        db_index=True,
        verbose_name="Cover Image",
        help_text="کاور خاص برای این ویدیو در این نمونه‌کار. اگر تنظیم نشود، از کاور ویدیو استفاده می‌شود."
    )
    order = models.PositiveIntegerField(default=0, db_index=True)
    autoplay = models.BooleanField(default=False)
    mute = models.BooleanField(default=True)
    show_cover = models.BooleanField(default=True)

    class Meta:
        db_table = "blog_videos"
        ordering = ["order"]
        verbose_name = "Blog Video"
        verbose_name_plural = "Blog Videos"
        indexes = [models.Index(fields=["blog", "order"])]

    def get_cover_image(self):
        """Get cover image: blog-specific or fallback to media default"""
        return self.cover_image if self.cover_image else (self.video.cover_image if self.video else None)
    
    def __str__(self):
        return f"{self.blog.title} - Video {self.video.title or self.video.file.name}"


class BlogAudio(BaseModel):
    """فایل‌های صوتی مربوط به نمونه‌کار"""

    blog = models.ForeignKey(
        Blog,
        on_delete=models.CASCADE,
        related_name="audios",
        db_index=True
    )
    audio = models.ForeignKey(
        AudioMedia,
        on_delete=models.CASCADE,
        related_name="blog_links",
        db_index=True
    )
    cover_image = models.ForeignKey(
        ImageMedia,
        on_delete=models.SET_NULL,
        related_name="blog_audio_covers",
        null=True,
        blank=True,
        db_index=True,
        verbose_name="Cover Image",
        help_text="کاور خاص برای این فایل صوتی در این نمونه‌کار. اگر تنظیم نشود، از کاور فایل صوتی استفاده می‌شود."
    )
    order = models.PositiveIntegerField(default=0, db_index=True)
    autoplay = models.BooleanField(default=False)
    loop = models.BooleanField(default=False)

    class Meta:
        db_table = "blog_audios"
        ordering = ["order"]
        verbose_name = "Blog Audio"
        verbose_name_plural = "Blog Audios"
        indexes = [models.Index(fields=["blog", "order"])]

    def get_cover_image(self):
        """Get cover image: blog-specific or fallback to media default"""
        return self.cover_image if self.cover_image else (self.audio.cover_image if self.audio else None)
    
    def __str__(self):
        return f"{self.blog.title} - Audio {self.audio.title or self.audio.file.name}"


class BlogDocument(BaseModel):
    """اسناد (PDFها) مربوط به نمونه‌کار"""

    blog = models.ForeignKey(
        Blog,
        on_delete=models.CASCADE,
        related_name="documents",
        db_index=True
    )
    document = models.ForeignKey(
        DocumentMedia,
        on_delete=models.CASCADE,
        related_name="blog_links",
        db_index=True
    )
    cover_image = models.ForeignKey(
        ImageMedia,
        on_delete=models.SET_NULL,
        related_name="blog_document_covers",
        null=True,
        blank=True,
        db_index=True,
        verbose_name="Cover Image",
        help_text="کاور خاص برای این سند در این نمونه‌کار. اگر تنظیم نشود، از کاور سند استفاده می‌شود."
    )
    order = models.PositiveIntegerField(default=0, db_index=True)
    title = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        db_table = "blog_documents"
        ordering = ["order"]
        verbose_name = "Blog Document"
        verbose_name_plural = "Blog Documents"
        indexes = [models.Index(fields=["blog", "order"])]

    def get_cover_image(self):
        """Get cover image: blog-specific or fallback to media default"""
        return self.cover_image if self.cover_image else (self.document.cover_image if self.document else None)
    
    def __str__(self):
        return f"{self.blog.title} - Document {self.document.title or self.document.file.name}"