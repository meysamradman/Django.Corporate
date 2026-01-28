from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.core.cache import cache
from django.template.loader import render_to_string

from src.email.messages.messages import EMAIL_TEXT
from src.email.models.email_message import EmailMessage
from src.email.utils.cache import EmailCacheKeys

class EmailService:
    
    @staticmethod
    def create_email_message(validated_data, request=None, initial_data=None):

        if request:

            validated_data['ip_address'] = EmailService.get_client_ip(request)
            validated_data['user_agent'] = request.META.get('HTTP_USER_AGENT', '')
            
            if validated_data.get('status') == 'draft' and request.user.is_authenticated:
                validated_data['created_by'] = request.user

            if 'source' not in validated_data:
                if request.user.is_authenticated and hasattr(request.user, 'has_admin_access') and request.user.has_admin_access():
                    validated_data['source'] = 'email'
                else:
                    validated_data['source'] = 'website'
        
        if initial_data:
            dynamic_fields = {}
            system_fields = ['source', 'status']
            
            for key, value in initial_data.items():
                if key not in system_fields and value:
                    dynamic_fields[key] = value
            
            if dynamic_fields:
                validated_data['dynamic_fields'] = dynamic_fields
            
            for field in ['name', 'email', 'phone', 'subject', 'message']:
                if field in initial_data and initial_data.get(field):
                    validated_data[field] = initial_data[field]

        if 'status' not in validated_data:
            validated_data['status'] = 'new'
        
        return EmailMessage.objects.create(**validated_data)
    
    @staticmethod
    def get_client_ip(request):

        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
    @staticmethod
    def send_reply_email(email_message: EmailMessage, reply_text: str, admin_user) -> bool:
        try:
            original_message = email_message.message
            if not original_message and email_message.dynamic_fields:
                original_message = email_message.dynamic_fields.get('message', '')
            
            original_subject = email_message.subject or email_message.dynamic_fields.get('subject', EMAIL_TEXT['no_subject']) if email_message.dynamic_fields else EMAIL_TEXT['no_subject']
            
            recipient_name = email_message.name
            if not recipient_name and email_message.dynamic_fields:
                recipient_name = email_message.dynamic_fields.get('name', EMAIL_TEXT['dear_user'])
            if not recipient_name:
                recipient_name = EMAIL_TEXT['dear_user']
            
            recipient_email = email_message.email
            if not recipient_email and email_message.dynamic_fields:
                recipient_email = email_message.dynamic_fields.get('email')
            
            if not recipient_email:
                return False
            
            company_name = getattr(settings, 'COMPANY_NAME', EMAIL_TEXT['default_company'])
            default_from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@corporate.local')
            if '<' in default_from_email and '>' in default_from_email:
                company_name = default_from_email.split('<')[0].strip()
            
            html_content = render_to_string('email_reply.html', {
                'company_name': company_name,
                'recipient_name': recipient_name,
                'reply_message': reply_text,
                'original_message': original_message or EMAIL_TEXT['original_message_not_found'],
            })
            
            text_content = f
            
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
        cache_key = EmailCacheKeys.stats()
        cached_stats = cache.get(cache_key)
        if cached_stats is not None:
            return cached_stats
        
        stats = {
            'total': EmailMessage.objects.count(),
            'new': EmailMessage.objects.filter(status='new').count(),
            'read': EmailMessage.objects.filter(status='read').count(),
            'replied': EmailMessage.objects.filter(status='replied').count(),
            'archived': EmailMessage.objects.filter(status='archived').count(),
        }
        
        cache.set(cache_key, stats, 300)
        return stats
