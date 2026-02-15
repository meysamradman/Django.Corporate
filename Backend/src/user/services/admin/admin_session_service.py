from django.contrib.sessions.models import Session
from django.utils import timezone
from django.conf import settings
from rest_framework.exceptions import AuthenticationFailed
from src.core.cache import CacheService

class AdminSessionService:
    
    @staticmethod
    def create_session(user, request):

        if not user.user_type == 'admin':
            raise AuthenticationFailed("Only admin users can use session authentication")
        
        session_manager = CacheService.get_session_manager()
        session_timeout = settings.ADMIN_SESSION_TIMEOUT_SECONDS
        
        request.session.create()
        request.session['_auth_user_id'] = str(user.id)
        request.session['user_type'] = 'admin'
        request.session['login_time'] = timezone.now().isoformat()
        request.session.set_expiry(session_timeout)
        request.session.save()
        
        session_manager.set_admin_session(
            request.session.session_key, 
            user.id, 
            session_timeout
        )
        
        user.last_login_admin = timezone.now()
        user.save(update_fields=['last_login_admin'])
        
        return request.session.session_key
    
    @staticmethod
    def destroy_session(session_key):

        try:
            session_manager = CacheService.get_session_manager()
            
            session_manager.delete_admin_session(session_key)
            
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

    @staticmethod
    def destroy_user_sessions(user_id):
        try:
            sessions = Session.objects.filter(expire_date__gt=timezone.now())
            for session in sessions:
                try:
                    data = session.get_decoded()
                    session_user_id = str(data.get('_auth_user_id', ''))
                    session_user_type = data.get('user_type')
                    if session_user_id == str(user_id) and session_user_type == 'admin':
                        AdminSessionService.destroy_session(session.session_key)
                except Exception:
                    continue
        except Exception:
            pass
