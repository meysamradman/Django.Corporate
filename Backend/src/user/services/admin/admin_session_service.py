from django.contrib.sessions.models import Session
from django.utils import timezone
from rest_framework.exceptions import AuthenticationFailed
from src.core.cache import CacheService
import os


class AdminSessionService:
    """
    Session Management Service برای Admin Panel
    
    Admin ها از Session-based Authentication استفاده می‌کنند
    Regular User ها از JWT Authentication استفاده می‌کنند
    """
    
    @staticmethod
    def create_session(user, request):
        """
        ایجاد Session برای Admin در Redis و Django Session
        
        Args:
            user: Admin User object
            request: Django Request object
            
        Returns:
            session_key: کلید Session ایجاد شده
            
        Raises:
            AuthenticationFailed: اگر کاربر Admin نباشد
        """
        if not user.user_type == 'admin':
            raise AuthenticationFailed("Only admin users can use session authentication")
        
        session_manager = CacheService.get_session_manager()
        session_timeout = int(os.getenv('ADMIN_SESSION_TIMEOUT_DAYS', 3)) * 24 * 60 * 60
        
        # ایجاد Django Session
        request.session.create()
        request.session['_auth_user_id'] = str(user.id)
        request.session['user_type'] = 'admin'
        request.session['login_time'] = timezone.now().isoformat()
        request.session.set_expiry(session_timeout)
        request.session.save()
        
        # ذخیره در Redis برای سرعت بالاتر
        session_manager.set_admin_session(
            request.session.session_key, 
            user.id, 
            session_timeout
        )
        
        # به‌روزرسانی last login admin
        user.last_login_admin = timezone.now()
        user.save(update_fields=['last_login_admin'])
        
        return request.session.session_key
    
    @staticmethod
    def destroy_session(session_key):
        """
        حذف Session از Redis و Django Session
        
        Args:
            session_key: کلید Session برای حذف
        """
        try:
            session_manager = CacheService.get_session_manager()
            
            # حذف از Redis
            session_manager.delete_admin_session(session_key)
            
            # حذف از Django Session DB
            Session.objects.filter(session_key=session_key).delete()
        except Exception:
            pass
    
    @staticmethod
    def get_active_sessions_count():
        """
        تعداد Session های فعال Admin
        
        Returns:
            int: تعداد Session های فعال
        """
        try:
            count = Session.objects.filter(
                expire_date__gt=timezone.now()
            ).count()
            return count
        except Exception:
            return 0
    
    @staticmethod
    def refresh_session(session_key, user_id):
        """
        تمدید زمان Session
        
        Args:
            session_key: کلید Session
            user_id: شناسه کاربر
        """
        try:
            session_manager = CacheService.get_session_manager()
            session_timeout = int(os.getenv('ADMIN_SESSION_TIMEOUT_DAYS', 3)) * 24 * 60 * 60
            
            session_manager.refresh_admin_session(session_key, session_timeout)
        except Exception:
            pass
