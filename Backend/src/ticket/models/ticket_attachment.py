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
        verbose_name="Ticket Message"
    )
    image = models.ForeignKey(
        ImageMedia,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='ticket_attachments',
        verbose_name="Image"
    )
    video = models.ForeignKey(
        VideoMedia,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='ticket_attachments',
        verbose_name="Video"
    )
    audio = models.ForeignKey(
        AudioMedia,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='ticket_attachments',
        verbose_name="Audio"
    )
    document = models.ForeignKey(
        DocumentMedia,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='ticket_attachments',
        verbose_name="Document"
    )
    
    class Meta:
        verbose_name = "Ticket Attachment"
        verbose_name_plural = "Ticket Attachments"
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['ticket_message', 'created_at'], name='ticket_attach_msg_created_idx'),
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

