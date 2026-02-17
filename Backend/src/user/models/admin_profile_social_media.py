from django.core.validators import URLValidator
from django.db import models

from src.core.models.base import BaseModel
from src.media.models.media import ImageMedia


class AdminProfileSocialMedia(BaseModel):
    admin_profile = models.ForeignKey(
        'user.AdminProfile',
        on_delete=models.CASCADE,
        related_name='social_media',
        db_index=True,
        verbose_name='Admin Profile',
        help_text='Related admin profile',
    )

    name = models.CharField(
        max_length=100,
        db_index=True,
        verbose_name='Social Media Name',
        help_text='Social media name (e.g., Instagram, Telegram, LinkedIn)',
    )

    url = models.URLField(
        max_length=300,
        verbose_name='URL',
        help_text='Full social media page link',
        validators=[URLValidator()],
    )

    icon = models.ForeignKey(
        ImageMedia,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='admin_profile_social_media_icons',
        db_index=True,
        verbose_name='Icon',
        help_text='Social media icon or image',
    )

    order = models.PositiveIntegerField(
        default=0,
        db_index=True,
        verbose_name='Display Order',
        help_text='Display order in list (lower numbers appear first)',
    )

    class Meta(BaseModel.Meta):
        db_table = 'admin_profile_social_media'
        verbose_name = 'Admin Profile Social Media'
        verbose_name_plural = 'Admin Profile Social Media'
        ordering = ['order', '-created_at']
        indexes = [
            models.Index(fields=['admin_profile', 'is_active', 'order']),
        ]

    def __str__(self):
        return f"{self.admin_profile_id} - {self.name}"
