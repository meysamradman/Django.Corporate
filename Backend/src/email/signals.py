"""
Signals برای اپ email
"""
from django.dispatch import receiver
from django_mailbox.signals import message_received
from django_mailbox.models import Message
from src.email.models.email_message import EmailMessage
from src.email.models.email_attachment import EmailAttachment
import logging

logger = logging.getLogger(__name__)


@receiver(message_received)
def convert_email_to_email_message(sender, message: Message, **kwargs):
    """
    وقتی ایمیل جدید از IMAP دریافت شد،
    تبدیل به EmailMessage کن
    """
    try:
        # استخراج اطلاعات از ایمیل دریافتی
        from_address = message.from_address[0] if message.from_address else 'Unknown'
        from_name = message.from_header[0] if message.from_header else from_address
        
        # اگر from_header وجود دارد، نام را از آن استخراج کن
        if message.from_header:
            try:
                # فرمت: "Name <email@example.com>"
                header_parts = message.from_header[0].split('<')
                if len(header_parts) > 1:
                    from_name = header_parts[0].strip().strip('"')
                    from_address = header_parts[1].strip().strip('>')
            except Exception:
                pass
        
        # ایجاد EmailMessage
        email_message = EmailMessage.objects.create(
            name=from_name,
            email=from_address,
            subject=message.subject or 'بدون موضوع',
            message=message.text or message.html or '',
            source='email',
            status='new',
        )
        
        # ذخیره ضمیمه‌ها (اگر وجود داشته باشند)
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
                except Exception as e:
                    logger.error(f"خطا در ذخیره ضمیمه: {str(e)}")
        
        
    except Exception as e:
        logger.error(f"خطا در تبدیل ایمیل به EmailMessage: {str(e)}")

