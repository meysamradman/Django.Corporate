from django.db import models
from django.core.exceptions import ValidationError
from src.core.models.base import BaseModel
from src.store.models.product import Product
from src.media.models.media import ImageMedia, VideoMedia, AudioMedia, DocumentMedia


class ProductImage(BaseModel):
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="images",
        db_index=True,
        verbose_name="Product",
        help_text="Product this image belongs to"
    )
    image = models.ForeignKey(
        ImageMedia,
        on_delete=models.CASCADE,
        related_name="store_product_links",
        db_index=True,
        verbose_name="Image File",
        help_text="Image media file"
    )
    
    is_main = models.BooleanField(
        default=False,
        db_index=True,
        verbose_name="Main Image",
        help_text="Designates whether this is the main image for the product"
    )
    
    order = models.PositiveIntegerField(
        default=0,
        db_index=True,
        verbose_name="Display Order",
        help_text="Order in which this image should be displayed"
    )

    class Meta(BaseModel.Meta):
        db_table = "store_product_images"
        verbose_name = "Product Image"
        verbose_name_plural = "Product Images"
        ordering = ["order", "-created_at"]
        indexes = [
            models.Index(fields=["product", "is_main"]),
            models.Index(fields=["product", "order"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['product', 'image'],
                name='unique_product_image'
            ),
        ]

    def clean(self):
        if self.is_main:
            exists = ProductImage.objects.filter(
                product=self.product,
                is_main=True
            ).exclude(pk=self.pk).exists()
            if exists:
                raise ValidationError("Only one main image is allowed per product.")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.product.title} - {self.image.title or self.image.file.name}"


class ProductVideo(BaseModel):
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="videos",
        db_index=True,
        verbose_name="Product",
        help_text="Product this video belongs to"
    )
    video = models.ForeignKey(
        VideoMedia,
        on_delete=models.CASCADE,
        related_name="store_product_links",
        db_index=True,
        verbose_name="Video File",
        help_text="Video media file"
    )
    cover_image = models.ForeignKey(
        ImageMedia,
        on_delete=models.SET_NULL,
        related_name="store_product_video_covers",
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
        db_table = "store_product_videos"
        verbose_name = "Product Video"
        verbose_name_plural = "Product Videos"
        ordering = ["order", "-created_at"]
        indexes = [
            models.Index(fields=["product", "order"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['product', 'video'],
                name='unique_product_video'
            ),
        ]

    def get_cover_image(self):
        return self.cover_image if self.cover_image else (self.video.cover_image if self.video else None)
    
    def __str__(self):
        return f"{self.product.title} - Video {self.video.title or self.video.file.name}"


class ProductAudio(BaseModel):
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="audios",
        db_index=True,
        verbose_name="Product",
        help_text="Product this audio belongs to"
    )
    audio = models.ForeignKey(
        AudioMedia,
        on_delete=models.CASCADE,
        related_name="store_product_links",
        db_index=True,
        verbose_name="Audio File",
        help_text="Audio media file"
    )
    cover_image = models.ForeignKey(
        ImageMedia,
        on_delete=models.SET_NULL,
        related_name="store_product_audio_covers",
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
        db_table = "store_product_audios"
        verbose_name = "Product Audio"
        verbose_name_plural = "Product Audios"
        ordering = ["order", "-created_at"]
        indexes = [
            models.Index(fields=["product", "order"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['product', 'audio'],
                name='unique_product_audio'
            ),
        ]

    def get_cover_image(self):
        return self.cover_image if self.cover_image else (self.audio.cover_image if self.audio else None)
    
    def __str__(self):
        return f"{self.product.title} - Audio {self.audio.title or self.audio.file.name}"


class ProductDocument(BaseModel):
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="documents",
        db_index=True,
        verbose_name="Product",
        help_text="Product this document belongs to"
    )
    document = models.ForeignKey(
        DocumentMedia,
        on_delete=models.CASCADE,
        related_name="store_product_links",
        db_index=True,
        verbose_name="Document File",
        help_text="Document media file"
    )
    cover_image = models.ForeignKey(
        ImageMedia,
        on_delete=models.SET_NULL,
        related_name="store_product_document_covers",
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
        db_table = "store_product_documents"
        verbose_name = "Product Document"
        verbose_name_plural = "Product Documents"
        ordering = ["order", "-created_at"]
        indexes = [
            models.Index(fields=["product", "order"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['product', 'document'],
                name='unique_product_document'
            ),
        ]

    def get_cover_image(self):
        return self.cover_image if self.cover_image else (self.document.cover_image if self.document else None)
    
    def __str__(self):
        return f"{self.product.title} - Document {self.document.title or self.document.file.name}"
