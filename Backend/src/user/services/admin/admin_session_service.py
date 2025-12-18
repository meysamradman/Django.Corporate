from django.contrib.sessions.models import Session
from django.utils import timezone
from django.conf import settings
from rest_framework.exceptions import AuthenticationFailed
from src.core.cache import CacheService


class AdminSessionService:
    """
    سرویس مدیریت Session برای Admin Panel
    """
    
    @staticmethod
    def create_session(user, request):
        """
        ایجاد session جدید برای admin
        Session دقیقاً بعد از ADMIN_SESSION_TIMEOUT_SECONDS منقضی میشه
        """
        if not user.user_type == 'admin':
            raise AuthenticationFailed("Only admin users can use session authentication")
        
        session_manager = CacheService.get_session_manager()
        session_timeout = settings.ADMIN_SESSION_TIMEOUT_SECONDS
        
        # ایجاد session در Django
        request.session.create()
        request.session['_auth_user_id'] = str(user.id)
        request.session['user_type'] = 'admin'
        request.session['login_time'] = timezone.now().isoformat()
        request.session.set_expiry(session_timeout)  # تنظیم timeout دقیق
        request.session.save()
        
        # ذخیره در Redis برای سرعت
        session_manager.set_admin_session(
            request.session.session_key, 
            user.id, 
            session_timeout
        )
        
        # آپدیت last_login_admin
        user.last_login_admin = timezone.now()
        user.save(update_fields=['last_login_admin'])
        
        return request.session.session_key
    
    @staticmethod
    def destroy_session(session_key):
        """
        پاک کردن کامل session از Redis + Database
        """
        try:
            session_manager = CacheService.get_session_manager()
            
            # پاک کردن از Redis
            session_manager.delete_admin_session(session_key)
            
            # پاک کردن از Database
            Session.objects.filter(session_key=session_key).delete()
        except Exception:
            pass
    
    @staticmethod
    def get_active_sessions_count():
        try:
            count = Session.objects.filter(
                expire_date__gt=timezone.now()
            ).count()
            return count
        except Exception:
            return 0
    
    @staticmethod
    def refresh_session(session_key, user_id):
        try:
            session_manager = CacheService.get_session_manager()
            session_timeout = settings.ADMIN_SESSION_TIMEOUT_SECONDS
            
            session_manager.refresh_admin_session(session_key, session_timeout)
        except Exception:
            pass
