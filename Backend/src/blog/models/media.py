from django.db import models
from django.core.exceptions import ValidationError
from src.core.models.base import BaseModel
from src.blog.models.blog import Blog
from src.media.models.media import ImageMedia, VideoMedia, AudioMedia, DocumentMedia


class BlogImage(BaseModel):
    blog = models.ForeignKey(
        Blog,
        on_delete=models.CASCADE,
        related_name="images",
        db_index=True,
        verbose_name="Blog",
        help_text="Blog post this image belongs to"
    )
    image = models.ForeignKey(
        ImageMedia,
        on_delete=models.CASCADE,
        related_name="blog_links",
        db_index=True,
        verbose_name="Image File",
        help_text="Image media file"
    )
    
    is_main = models.BooleanField(
        default=False,
        db_index=True,
        verbose_name="Main Image",
        help_text="Designates whether this is the main image for the blog post"
    )
    
    order = models.PositiveIntegerField(
        default=0,
        db_index=True,
        verbose_name="Display Order",
        help_text="Order in which this image should be displayed"
    )

    class Meta(BaseModel.Meta):
        db_table = "blog_images"
        verbose_name = "Blog Image"
        verbose_name_plural = "Blog Images"
        ordering = ["order", "-created_at"]
        indexes = [
            models.Index(fields=["blog", "is_main"]),
            models.Index(fields=["blog", "order"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['blog', 'image'],
                name='unique_blog_image'
            ),
        ]

    def clean(self):
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
    blog = models.ForeignKey(
        Blog,
        on_delete=models.CASCADE,
        related_name="videos",
        db_index=True,
        verbose_name="Blog",
        help_text="Blog post this video belongs to"
    )
    video = models.ForeignKey(
        VideoMedia,
        on_delete=models.CASCADE,
        related_name="blog_links",
        db_index=True,
        verbose_name="Video File",
        help_text="Video media file"
    )
    cover_image = models.ForeignKey(
        ImageMedia,
        on_delete=models.SET_NULL,
        related_name="blog_video_covers",
        null=True,
        blank=True,
        db_index=True,
        verbose_name="Cover Image",
        help_text="Cover image for this video"
    )
    
    order = models.PositiveIntegerField(
        default=0,
        db_index=True,
        verbose_name="Display Order",
        help_text="Order in which this video should be displayed"
    )
    
    autoplay = models.BooleanField(
        default=False,
        verbose_name="Autoplay",
        help_text="Whether the video should autoplay"
    )
    mute = models.BooleanField(
        default=True,
        verbose_name="Mute",
        help_text="Whether the video should be muted by default"
    )
    show_cover = models.BooleanField(
        default=True,
        verbose_name="Show Cover",
        help_text="Whether to show the cover image before playback"
    )

    class Meta(BaseModel.Meta):
        db_table = "blog_videos"
        verbose_name = "Blog Video"
        verbose_name_plural = "Blog Videos"
        ordering = ["order", "-created_at"]
        indexes = [
            models.Index(fields=["blog", "order"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['blog', 'video'],
                name='unique_blog_video'
            ),
        ]

    def get_cover_image(self):
        return self.cover_image if self.cover_image else (self.video.cover_image if self.video else None)
    
    def __str__(self):
        return f"{self.blog.title} - Video {self.video.title or self.video.file.name}"


class BlogAudio(BaseModel):
    blog = models.ForeignKey(
        Blog,
        on_delete=models.CASCADE,
        related_name="audios",
        db_index=True,
        verbose_name="Blog",
        help_text="Blog post this audio belongs to"
    )
    audio = models.ForeignKey(
        AudioMedia,
        on_delete=models.CASCADE,
        related_name="blog_links",
        db_index=True,
        verbose_name="Audio File",
        help_text="Audio media file"
    )
    cover_image = models.ForeignKey(
        ImageMedia,
        on_delete=models.SET_NULL,
        related_name="blog_audio_covers",
        null=True,
        blank=True,
        db_index=True,
        verbose_name="Cover Image",
        help_text="Cover image for this audio"
    )
    
    order = models.PositiveIntegerField(
        default=0,
        db_index=True,
        verbose_name="Display Order",
        help_text="Order in which this audio should be displayed"
    )
    
    autoplay = models.BooleanField(
        default=False,
        verbose_name="Autoplay",
        help_text="Whether the audio should autoplay"
    )
    loop = models.BooleanField(
        default=False,
        verbose_name="Loop",
        help_text="Whether the audio should loop"
    )

    class Meta(BaseModel.Meta):
        db_table = "blog_audios"
        verbose_name = "Blog Audio"
        verbose_name_plural = "Blog Audios"
        ordering = ["order", "-created_at"]
        indexes = [
            models.Index(fields=["blog", "order"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['blog', 'audio'],
                name='unique_blog_audio'
            ),
        ]

    def get_cover_image(self):
        return self.cover_image if self.cover_image else (self.audio.cover_image if self.audio else None)
    
    def __str__(self):
        return f"{self.blog.title} - Audio {self.audio.title or self.audio.file.name}"


class BlogDocument(BaseModel):
    blog = models.ForeignKey(
        Blog,
        on_delete=models.CASCADE,
        related_name="documents",
        db_index=True,
        verbose_name="Blog",
        help_text="Blog post this document belongs to"
    )
    document = models.ForeignKey(
        DocumentMedia,
        on_delete=models.CASCADE,
        related_name="blog_links",
        db_index=True,
        verbose_name="Document File",
        help_text="Document media file"
    )
    cover_image = models.ForeignKey(
        ImageMedia,
        on_delete=models.SET_NULL,
        related_name="blog_document_covers",
        null=True,
        blank=True,
        db_index=True,
        verbose_name="Cover Image",
        help_text="Cover image for this document"
    )
    
    title = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="Title",
        help_text="Custom title for this document (optional)"
    )
    
    order = models.PositiveIntegerField(
        default=0,
        db_index=True,
        verbose_name="Display Order",
        help_text="Order in which this document should be displayed"
    )

    class Meta(BaseModel.Meta):
        db_table = "blog_documents"
        verbose_name = "Blog Document"
        verbose_name_plural = "Blog Documents"
        ordering = ["order", "-created_at"]
        indexes = [
            models.Index(fields=["blog", "order"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['blog', 'document'],
                name='unique_blog_document'
            ),
        ]

    def get_cover_image(self):
        return self.cover_image if self.cover_image else (self.document.cover_image if self.document else None)
    
    def __str__(self):
        return f"{self.blog.title} - Document {self.document.title or self.document.file.name}"