from django.core.exceptions import ValidationError
from django.db import models
from src.core.models.base import BaseModel
from src.media.models.media import Media
from src.portfolio.models.portfolio import Portfolio


class PortfolioMedia(BaseModel):
    portfolio = models.ForeignKey(Portfolio, on_delete=models.CASCADE,
        related_name='portfolio_medias',
        verbose_name = "Portfolio",
        help_text = "The portfolio to which this media belongs."
    )
    media = models.ForeignKey(Media, on_delete=models.CASCADE,
        related_name='portfolio_links',
        verbose_name = "Media",
        help_text = "The media file associated with the portfolio."
    )
    is_main_image = models.BooleanField(
        default=False,
        verbose_name="Portfolio Image",
        help_text="Indicates whether this image is the Portfolio image for the property. Only one Portfolio Image is allowed per portfolio."
    )
    order = models.PositiveIntegerField(
        default=0,
        verbose_name="Order",
        help_text="The order of this media item in the portfolio."
    )

    def clean(self):
        if self.media.media_type == 'video' and not self.media.cover_image:
            raise ValidationError("Each video must have an associated cover image.")

        if self.is_main_image:
            existing_main_image = PortfolioMedia.objects.filter(
                portfolio=self.portfolio,
                is_main_image=True
            ).exclude(id=self.id).exists()
            if existing_main_image:
                raise ValidationError("Only one main image is allowed per portfolio.")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
        
    def get_public_url(self):
        """Get the public URL for this portfolio media item using the public_id"""
        return f"/portfolio-media/{self.public_id}/"

    class Meta:
        ordering = ['order']
        db_table = 'portfolio_media'
        verbose_name = "Portfolio Media"
        verbose_name_plural = "Portfolio Media"
        indexes = [
            models.Index(fields=['portfolio']),
            models.Index(fields=['media']),
            models.Index(fields=['is_main_image']),
            models.Index(fields=['public_id']),
        ]

    def __str__(self):
        return f"{self.portfolio} - {self.media}"