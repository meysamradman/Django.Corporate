"""  
سرویس‌های مربوط به ایمیل
"""
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
            
            # موضوع پیام اصلی
            original_subject = email_message.subject or email_message.dynamic_fields.get('subject', 'بدون موضوع') if email_message.dynamic_fields else 'بدون موضوع'
            
            # نام گیرنده
            recipient_name = email_message.name
            if not recipient_name and email_message.dynamic_fields:
                recipient_name = email_message.dynamic_fields.get('name', 'کاربر گرامی')
            if not recipient_name:
                recipient_name = 'کاربر گرامی'
            
            # ایمیل گیرنده
            recipient_email = email_message.email
            if not recipient_email and email_message.dynamic_fields:
                recipient_email = email_message.dynamic_fields.get('email')
            
            if not recipient_email:
                return False
            
            # دریافت نام شرکت از تنظیمات یا استفاده از پیش‌فرض
            company_name = getattr(settings, 'COMPANY_NAME', 'شرکت ما')
            # استخراج نام شرکت از DEFAULT_FROM_EMAIL اگر شامل <> باشد
            default_from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@corporate.local')
            if '<' in default_from_email and '>' in default_from_email:
                company_name = default_from_email.split('<')[0].strip()
            
            # رندر HTML template
            html_content = render_to_string('email_reply.html', {
                'company_name': company_name,
                'recipient_name': recipient_name,
                'reply_message': reply_text,
                'original_message': original_message or 'پیام اصلی یافت نشد',
            })
            
            # متن ساده (برای email client هایی که HTML رو ساپورت نمی‌کنن)
            text_content = f"""
سلام {recipient_name}،

{reply_text}

------- پیام اصلی شما -------
{original_message or 'پیام اصلی یافت نشد'}

با تشکر،
تیم {company_name}
            """
            
            # ارسال ایمیل با HTML و Text
            email = EmailMultiAlternatives(
                subject=f"Re: {original_subject}",
                body=text_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[recipient_email],
            )
            email.attach_alternative(html_content, "text/html")
            email.send(fail_silently=False)
            
            # علامت‌گذاری به عنوان پاسخ داده شده
            email_message.reply_message = reply_text
            email_message.mark_as_replied(admin_user)
            
            return True
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error sending email: {str(e)}")
            return False
    
    @staticmethod
    def get_statistics():
        """دریافت آمار پیام‌ها"""
        return {
            'total': EmailMessage.objects.count(),
            'new': EmailMessage.objects.filter(status='new').count(),
            'read': EmailMessage.objects.filter(status='read').count(),
            'replied': EmailMessage.objects.filter(status='replied').count(),
            'archived': EmailMessage.objects.filter(status='archived').count(),
        }
