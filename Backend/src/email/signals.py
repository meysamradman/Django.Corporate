from django.db.models.signals import post_save
from django.dispatch import receiver
from django_mailbox.models import Message
from django_mailbox.signals import message_received

from src.email.models.email_attachment import EmailAttachment
from src.email.models.email_message import EmailMessage
from src.email.services.email_stats_service import EmailStatsService

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

@receiver(post_save, sender=EmailMessage)
def track_email_analytics(sender, instance, created, **kwargs):
    
    if created:
        EmailStatsService.track_new_email(instance)
    else:
        status_changed = hasattr(instance, '_old_status') and instance._old_status != instance.status
        if status_changed:
            EmailStatsService.track_status_change(instance, instance._old_status, instance.status)
            
            if instance.status == 'replied' and instance.replied_by:
                from src.user.models.admin_profile import AdminProfile
                profile = AdminProfile.objects.filter(admin_user=instance.replied_by).first()
                if profile:
                    response_time = None
                    if instance.created_at:
                        diff = timezone.now() - instance.created_at
                        response_time = int(diff.total_seconds() / 60)
                        
                    AdminPerformanceService.track_task_completion(
                        profile,
                        task_type='email',
                        response_time_minutes=response_time
                    )

