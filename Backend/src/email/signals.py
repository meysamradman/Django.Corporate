from django.dispatch import receiver
from django_mailbox.signals import message_received
from django_mailbox.models import Message
from src.email.models.email_message import EmailMessage
from src.email.models.email_attachment import EmailAttachment


@receiver(message_received)
def convert_email_to_email_message(sender, message: Message, **kwargs):
    try:
        from_address = message.from_address[0] if message.from_address else 'Unknown'
        from_name = message.from_header[0] if message.from_header else from_address
        
        if message.from_header:
            try:
                header_parts = message.from_header[0].split('<')
                if len(header_parts) > 1:
                    from_name = header_parts[0].strip().strip('"')
                    from_address = header_parts[1].strip().strip('>')
            except Exception:
                pass
        
        email_message = EmailMessage.objects.create(
            name=from_name,
            email=from_address,
            subject=message.subject or '',
            message=message.text or message.html or '',
            source='email',
            status='new',
        )
        
        if hasattr(message, 'attachments') and message.attachments.exists():
            for attachment in message.attachments.all():
                try:
                    EmailAttachment.objects.create(
                        message=email_message,
                        file=attachment.document,
                        filename=attachment.get_filename() or 'attachment',
                        file_size=attachment.document.size if attachment.document else 0,
                        content_type=attachment.get_content_type() or 'application/octet-stream',
                    )
                except Exception:
                    pass
        
    except Exception:
        pass

