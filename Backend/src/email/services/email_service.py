"""
سرویس‌های مربوط به ایمیل
"""
from django.core.mail import send_mail
from django.conf import settings
from src.email.models.email_message import EmailMessage


class EmailService:
    """سرویس برای مدیریت ایمیل‌ها"""
    
    @staticmethod
    def send_reply_email(email_message: EmailMessage, reply_text: str, admin_user) -> bool:
        """
        ارسال پاسخ به ایمیل
        
        Args:
            email_message: پیام اصلی
            reply_text: متن پاسخ
            admin_user: ادمین که پاسخ را می‌فرستد
            
        Returns:
            bool: True اگر ارسال موفق بود
        """
        try:
            send_mail(
                subject=f"Re: {email_message.subject}",
                message=reply_text,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email_message.email],
                fail_silently=False,
            )
            
            # علامت‌گذاری به عنوان پاسخ داده شده
            email_message.reply_message = reply_text
            email_message.mark_as_replied(admin_user)
            
            return True
        except Exception as e:
            print(f"Error sending email: {str(e)}")
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

