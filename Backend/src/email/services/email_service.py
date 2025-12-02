from django.core.mail import send_mail, EmailMultiAlternatives
from django.conf import settings
from django.template.loader import render_to_string
from src.email.models.email_message import EmailMessage


class EmailService:
    
    @staticmethod
    def send_reply_email(email_message: EmailMessage, reply_text: str, admin_user) -> bool:

        try:
            original_message = email_message.message
            if not original_message and email_message.dynamic_fields:
                original_message = email_message.dynamic_fields.get('message', '')
            
            original_subject = email_message.subject or email_message.dynamic_fields.get('subject', 'بدون موضوع') if email_message.dynamic_fields else 'بدون موضوع'
            
            recipient_name = email_message.name
            if not recipient_name and email_message.dynamic_fields:
                recipient_name = email_message.dynamic_fields.get('name', 'کاربر گرامی')
            if not recipient_name:
                recipient_name = 'کاربر گرامی'
            
            recipient_email = email_message.email
            if not recipient_email and email_message.dynamic_fields:
                recipient_email = email_message.dynamic_fields.get('email')
            
            if not recipient_email:
                return False
            
            company_name = getattr(settings, 'COMPANY_NAME', 'شرکت ما')
            default_from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@corporate.local')
            if '<' in default_from_email and '>' in default_from_email:
                company_name = default_from_email.split('<')[0].strip()
            
            html_content = render_to_string('email_reply.html', {
                'company_name': company_name,
                'recipient_name': recipient_name,
                'reply_message': reply_text,
                'original_message': original_message or 'پیام اصلی یافت نشد',
            })
            
            text_content = f"""
سلام {recipient_name}،

{reply_text}

------- پیام اصلی شما -------
{original_message or 'پیام اصلی یافت نشد'}

با تشکر،
تیم {company_name}
            """
            
            email = EmailMultiAlternatives(
                subject=f"Re: {original_subject}",
                body=text_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[recipient_email],
            )
            email.attach_alternative(html_content, "text/html")
            email.send(fail_silently=False)
            
            email_message.reply_message = reply_text
            email_message.mark_as_replied(admin_user)
            
            return True
        except Exception:
            return False
    
    @staticmethod
    def get_statistics():
        return {
            'total': EmailMessage.objects.count(),
            'new': EmailMessage.objects.filter(status='new').count(),
            'read': EmailMessage.objects.filter(status='read').count(),
            'replied': EmailMessage.objects.filter(status='replied').count(),
            'archived': EmailMessage.objects.filter(status='archived').count(),
        }
