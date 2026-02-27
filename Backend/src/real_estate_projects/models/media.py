from django.db import models
from django.core.exceptions import ValidationError

from src.core.models.base import BaseModel
from src.media.models.media import ImageMedia, VideoMedia, AudioMedia, DocumentMedia

from .project import RealEstateProject


class RealEstateProjectImage(BaseModel):
    project = models.ForeignKey(
        RealEstateProject,
        on_delete=models.CASCADE,
        related_name="images",
        db_index=True,
        verbose_name="Project",
    )
    image = models.ForeignKey(
        ImageMedia,
        on_delete=models.CASCADE,
        related_name="real_estate_project_links",
        db_index=True,
        verbose_name="Image",
    )
    is_main = models.BooleanField(default=False, db_index=True, verbose_name="Main Image")
    order = models.PositiveIntegerField(default=0, db_index=True, verbose_name="Display Order")

    class Meta(BaseModel.Meta):
        db_table = "real_estate_project_images"
        verbose_name = "Real Estate Project Image"
        verbose_name_plural = "Real Estate Project Images"
        ordering = ["order", "-created_at"]
        indexes = [
            models.Index(fields=["project", "is_main"]),
            models.Index(fields=["project", "order"]),
        ]
        constraints = [
            models.UniqueConstraint(fields=["project", "image"], name="unique_re_project_image"),
        ]

    def clean(self):
        if self.is_main:
            already_has_main = RealEstateProjectImage.objects.filter(
                project=self.project,
                is_main=True,
            ).exclude(pk=self.pk).exists()
            if already_has_main:
                raise ValidationError("Only one main image is allowed per project.")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.project.title} - {self.image.title or self.image.file.name}"


class RealEstateProjectVideo(BaseModel):
    project = models.ForeignKey(
        RealEstateProject,
        on_delete=models.CASCADE,
        related_name="videos",
        db_index=True,
        verbose_name="Project",
    )
    video = models.ForeignKey(
        VideoMedia,
        on_delete=models.CASCADE,
        related_name="real_estate_project_links",
        db_index=True,
        verbose_name="Video",
    )
    cover_image = models.ForeignKey(
        ImageMedia,
        on_delete=models.SET_NULL,
        related_name="real_estate_project_video_covers",
        null=True,
        blank=True,
        db_index=True,
        verbose_name="Cover Image",
    )
    order = models.PositiveIntegerField(default=0, db_index=True, verbose_name="Display Order")
    autoplay = models.BooleanField(default=False, verbose_name="Autoplay")
    mute = models.BooleanField(default=True, verbose_name="Mute")
    show_cover = models.BooleanField(default=True, verbose_name="Show Cover")

    class Meta(BaseModel.Meta):
        db_table = "real_estate_project_videos"
        verbose_name = "Real Estate Project Video"
        verbose_name_plural = "Real Estate Project Videos"
        ordering = ["order", "-created_at"]
        indexes = [
            models.Index(fields=["project", "order"]),
        ]
        constraints = [
            models.UniqueConstraint(fields=["project", "video"], name="unique_re_project_video"),
        ]

    def get_cover_image(self):
        return self.cover_image if self.cover_image else (self.video.cover_image if self.video else None)

    def __str__(self):
        return f"{self.project.title} - {self.video.title or self.video.file.name}"


class RealEstateProjectAudio(BaseModel):
    project = models.ForeignKey(
        RealEstateProject,
        on_delete=models.CASCADE,
        related_name="audios",
        db_index=True,
        verbose_name="Project",
    )
    audio = models.ForeignKey(
        AudioMedia,
        on_delete=models.CASCADE,
        related_name="real_estate_project_links",
        db_index=True,
        verbose_name="Audio",
    )
    cover_image = models.ForeignKey(
        ImageMedia,
        on_delete=models.SET_NULL,
        related_name="real_estate_project_audio_covers",
        null=True,
        blank=True,
        db_index=True,
        verbose_name="Cover Image",
    )
    order = models.PositiveIntegerField(default=0, db_index=True, verbose_name="Display Order")
    autoplay = models.BooleanField(default=False, verbose_name="Autoplay")
    loop = models.BooleanField(default=False, verbose_name="Loop")

    class Meta(BaseModel.Meta):
        db_table = "real_estate_project_audios"
        verbose_name = "Real Estate Project Audio"
        verbose_name_plural = "Real Estate Project Audios"
        ordering = ["order", "-created_at"]
        indexes = [
            models.Index(fields=["project", "order"]),
        ]
        constraints = [
            models.UniqueConstraint(fields=["project", "audio"], name="unique_re_project_audio"),
        ]

    def get_cover_image(self):
        return self.cover_image if self.cover_image else (self.audio.cover_image if self.audio else None)

    def __str__(self):
        return f"{self.project.title} - {self.audio.title or self.audio.file.name}"


class RealEstateProjectDocument(BaseModel):
    project = models.ForeignKey(
        RealEstateProject,
        on_delete=models.CASCADE,
        related_name="documents",
        db_index=True,
        verbose_name="Project",
    )
    document = models.ForeignKey(
        DocumentMedia,
        on_delete=models.CASCADE,
        related_name="real_estate_project_links",
        db_index=True,
        verbose_name="Document",
    )
    cover_image = models.ForeignKey(
        ImageMedia,
        on_delete=models.SET_NULL,
        related_name="real_estate_project_document_covers",
        null=True,
        blank=True,
        db_index=True,
        verbose_name="Cover Image",
    )
    title = models.CharField(max_length=255, blank=True, null=True, verbose_name="Title")
    order = models.PositiveIntegerField(default=0, db_index=True, verbose_name="Display Order")

    class Meta(BaseModel.Meta):
        db_table = "real_estate_project_documents"
        verbose_name = "Real Estate Project Document"
        verbose_name_plural = "Real Estate Project Documents"
        ordering = ["order", "-created_at"]
        indexes = [
            models.Index(fields=["project", "order"]),
        ]
        constraints = [
            models.UniqueConstraint(fields=["project", "document"], name="unique_re_project_document"),
        ]

    def get_cover_image(self):
        return self.cover_image if self.cover_image else (self.document.cover_image if self.document else None)

    def __str__(self):
        return f"{self.project.title} - {self.title or self.document.title or self.document.file.name}"
