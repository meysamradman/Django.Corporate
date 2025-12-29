from django.db import models
from django.core.exceptions import ValidationError

from src.core.models import BaseModel
from src.media.models.media import ImageMedia, VideoMedia, AudioMedia, DocumentMedia
from .ticket_message import TicketMessage


class TicketAttachment(BaseModel):

    ticket_message = models.ForeignKey(
        TicketMessage,
        on_delete=models.CASCADE,
        related_name='attachments',
        db_index=True,
        verbose_name="Ticket Message",
        help_text="Ticket message this attachment belongs to"
    )
    image = models.ForeignKey(
        ImageMedia,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='ticket_attachments',
        db_index=True,
        verbose_name="Image",
        help_text="Image attachment (exactly one media type must be selected)"
    )
    video = models.ForeignKey(
        VideoMedia,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='ticket_attachments',
        db_index=True,
        verbose_name="Video",
        help_text="Video attachment (exactly one media type must be selected)"
    )
    audio = models.ForeignKey(
        AudioMedia,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='ticket_attachments',
        db_index=True,
        verbose_name="Audio",
        help_text="Audio attachment (exactly one media type must be selected)"
    )
    document = models.ForeignKey(
        DocumentMedia,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='ticket_attachments',
        db_index=True,
        verbose_name="Document",
        help_text="Document attachment (exactly one media type must be selected)"
    )
    
    class Meta(BaseModel.Meta):
        db_table = 'ticket_attachments'
        verbose_name = "Ticket Attachment"
        verbose_name_plural = "Ticket Attachments"
        ordering = ['created_at']
        indexes = [
            # Composite index for common query pattern
            models.Index(fields=['ticket_message', 'created_at']),
        ]
        constraints = [
            models.CheckConstraint(
                condition=(
                    models.Q(image__isnull=False) & models.Q(video__isnull=True) & 
                    models.Q(audio__isnull=True) & models.Q(document__isnull=True)
                ) | (
                    models.Q(image__isnull=True) & models.Q(video__isnull=False) & 
                    models.Q(audio__isnull=True) & models.Q(document__isnull=True)
                ) | (
                    models.Q(image__isnull=True) & models.Q(video__isnull=True) & 
                    models.Q(audio__isnull=False) & models.Q(document__isnull=True)
                ) | (
                    models.Q(image__isnull=True) & models.Q(video__isnull=True) & 
                    models.Q(audio__isnull=True) & models.Q(document__isnull=False)
                ),
                name='exactly_one_media_type_required'
            ),
        ]
    
    def __str__(self):
        media = self.image or self.video or self.audio or self.document
        return f"Attachment #{self.id} for Message #{self.ticket_message.id}"
    
    def clean(self):
        media_count = sum([
            bool(self.image),
            bool(self.video),
            bool(self.audio),
            bool(self.document)
        ])
        if media_count != 1:
            raise ValidationError("Exactly one media type must be selected.")
    
    def get_media(self):
        return self.image or self.video or self.audio or self.document

