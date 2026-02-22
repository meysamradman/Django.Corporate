from django.db import models
from src.core.models import BaseModel
from src.real_estate.models.managers import ListingTypeQuerySet
from src.media.models.media import ImageMedia

from src.real_estate.models.constants import LISTING_TYPE_CHOICES


class ListingType(BaseModel):
    title = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name="Title",
        help_text="Listing type title (e.g., For Sale, For Rent)",
    )
    slug = models.SlugField(
        max_length=100,
        unique=True,
        db_index=True,
        allow_unicode=True,
        verbose_name="URL Slug",
        help_text="URL-friendly identifier for the listing type",
    )
    short_description = models.CharField(
        max_length=255,
        blank=True,
        default='',
        verbose_name="Short Description",
        help_text="Short summary text for this listing type",
    )

    usage_type = models.CharField(
        max_length=20,
        choices=LISTING_TYPE_CHOICES,
        default='other',
        db_index=True,
        verbose_name="Usage Type",
        help_text="System category for analytics (e.g. Sale vs Rent)",
    )
    image = models.ForeignKey(
        ImageMedia,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='listing_type_images',
        verbose_name="Main Image",
        help_text="Main image for this listing type",
    )

    objects = ListingTypeQuerySet.as_manager()

    class Meta(BaseModel.Meta):
        db_table = 'real_estate_property_states'
        verbose_name = 'Listing Type'
        verbose_name_plural = 'Listing Types'
        ordering = ['title']
        indexes = [
            models.Index(fields=['is_active', 'title']),
            models.Index(fields=['slug']),
        ]

    def __str__(self):
        return self.title

    def get_public_url(self):
        return f"/properties/{self.slug}/"
