from django.db import models
from django.core.exceptions import ValidationError

from src.core.models.base import BaseModel
from src.portfolio.models.portfolio import Portfolio
from src.media.models.media import ImageMedia, VideoMedia, AudioMedia, DocumentMedia

class PortfolioImage(BaseModel):
    """تصاویر مربوط به نمونه‌کار (گالری تصاویر)"""

    portfolio = models.ForeignKey(
        Portfolio,
        on_delete=models.CASCADE,
        related_name="images",
        db_index=True,
        verbose_name="Portfolio",
        help_text="نمونه‌کاری که این تصویر به آن تعلق دارد."
    )
    image = models.ForeignKey(
        ImageMedia,
        on_delete=models.CASCADE,
        related_name="portfolio_links",
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
        db_table = "portfolio_images"
        ordering = ["order", "-created_at"]
        verbose_name = "Portfolio Image"
        verbose_name_plural = "Portfolio Images"
        indexes = [
            models.Index(fields=["portfolio", "is_main"]),
            models.Index(fields=["portfolio", "order"]),
        ]

    def clean(self):
        """فقط یک تصویر اصلی مجاز است"""
        if self.is_main:
            exists = PortfolioImage.objects.filter(
                portfolio=self.portfolio,
                is_main=True
            ).exclude(pk=self.pk).exists()
            if exists:
                raise ValidationError("Only one main image is allowed per portfolio.")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.portfolio.title} - {self.image.title or self.image.file.name}"


class PortfolioVideo(BaseModel):
    """ویدیوهای مربوط به نمونه‌کار"""

    portfolio = models.ForeignKey(
        Portfolio,
        on_delete=models.CASCADE,
        related_name="videos",
        db_index=True
    )
    video = models.ForeignKey(
        VideoMedia,
        on_delete=models.CASCADE,
        related_name="portfolio_links",
        db_index=True
    )
    cover_image = models.ForeignKey(
        ImageMedia,
        on_delete=models.SET_NULL,
        related_name="portfolio_video_covers",
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
        db_table = "portfolio_videos"
        ordering = ["order"]
        verbose_name = "Portfolio Video"
        verbose_name_plural = "Portfolio Videos"
        indexes = [models.Index(fields=["portfolio", "order"])]

    def get_cover_image(self):
        """Get cover image: portfolio-specific or fallback to media default"""
        return self.cover_image if self.cover_image else (self.video.cover_image if self.video else None)
    
    def __str__(self):
        return f"{self.portfolio.title} - Video {self.video.title or self.video.file.name}"


class PortfolioAudio(BaseModel):
    """فایل‌های صوتی مربوط به نمونه‌کار"""

    portfolio = models.ForeignKey(
        Portfolio,
        on_delete=models.CASCADE,
        related_name="audios",
        db_index=True
    )
    audio = models.ForeignKey(
        AudioMedia,
        on_delete=models.CASCADE,
        related_name="portfolio_links",
        db_index=True
    )
    cover_image = models.ForeignKey(
        ImageMedia,
        on_delete=models.SET_NULL,
        related_name="portfolio_audio_covers",
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
        db_table = "portfolio_audios"
        ordering = ["order"]
        verbose_name = "Portfolio Audio"
        verbose_name_plural = "Portfolio Audios"
        indexes = [models.Index(fields=["portfolio", "order"])]

    def get_cover_image(self):
        """Get cover image: portfolio-specific or fallback to media default"""
        return self.cover_image if self.cover_image else (self.audio.cover_image if self.audio else None)
    
    def __str__(self):
        return f"{self.portfolio.title} - Audio {self.audio.title or self.audio.file.name}"


class PortfolioDocument(BaseModel):
    """اسناد (PDFها) مربوط به نمونه‌کار"""

    portfolio = models.ForeignKey(
        Portfolio,
        on_delete=models.CASCADE,
        related_name="documents",
        db_index=True
    )
    document = models.ForeignKey(
        DocumentMedia,
        on_delete=models.CASCADE,
        related_name="portfolio_links",
        db_index=True
    )
    cover_image = models.ForeignKey(
        ImageMedia,
        on_delete=models.SET_NULL,
        related_name="portfolio_document_covers",
        null=True,
        blank=True,
        db_index=True,
        verbose_name="Cover Image",
        help_text="کاور خاص برای این سند در این نمونه‌کار. اگر تنظیم نشود، از کاور سند استفاده می‌شود."
    )
    order = models.PositiveIntegerField(default=0, db_index=True)
    title = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        db_table = "portfolio_documents"
        ordering = ["order"]
        verbose_name = "Portfolio Document"
        verbose_name_plural = "Portfolio Documents"
        indexes = [models.Index(fields=["portfolio", "order"])]

    def get_cover_image(self):
        """Get cover image: portfolio-specific or fallback to media default"""
        return self.cover_image if self.cover_image else (self.document.cover_image if self.document else None)
    
    def __str__(self):
        return f"{self.portfolio.title} - Document {self.document.title or self.document.file.name}"