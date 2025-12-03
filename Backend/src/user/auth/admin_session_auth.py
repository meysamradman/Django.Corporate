import os
from django.contrib.auth import get_user_model
from django.contrib.sessions.models import Session
from django.core.cache import cache
from rest_framework.authentication import BaseAuthentication, SessionAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.utils import timezone
from django.conf import settings

User = get_user_model()


class CSRFExemptSessionAuthentication(BaseAuthentication):
    
    def authenticate(self, request):
        session_key = request.COOKIES.get('sessionid')
        if not session_key:
            return None
        
        if not request.session.exists(session_key):
            return None
        
        try:
            user_id = request.session.get('_auth_user_id')
            if user_id:
                user = User.objects.get(id=user_id)
                
                if not self._is_valid_admin_user(user):
                    return None
                
                self._update_user_activity(user)
                
                return (user, None)
        except User.DoesNotExist:
            pass
        except Exception:
            pass
        
        user = self._get_user_from_session(session_key)
        if not user:
            return None
        
        if not self._is_valid_admin_user(user):
            return None
        
        self._update_user_activity(user)
        
        return (user, None)
    
    def _get_user_from_session(self, session_key):
        try:
            cache_key = f"admin_session_{session_key}"
            user_id = cache.get(cache_key)
            
            if user_id:
                try:
                    user = User.objects.get(id=user_id)
                    return user
                except User.DoesNotExist:
                    cache.delete(cache_key)
                    return None
            
            try:
                session = Session.objects.get(session_key=session_key)
                
                if session.expire_date < timezone.now():
                    session.delete()
                    return None
                
                session_data = session.get_decoded()
                user_id = session_data.get('_auth_user_id')
                
                if user_id:
                    user = User.objects.get(id=user_id)
                    cache.set(cache_key, user_id, int(os.getenv('ADMIN_SESSION_TIMEOUT_DAYS', 3)) * 24 * 60 * 60)
                    return user
            except Session.DoesNotExist:
                pass
            
        except Exception:
            pass
        
        return None
    
    def _is_valid_admin_user(self, user):
        is_valid = (
            user and 
            user.is_active and 
            user.user_type == 'admin' and 
            user.is_admin_active and
            user.is_staff
        )
        return is_valid
    
    def _update_user_activity(self, user):
        try:
            cache_key = f"admin_last_activity_{user.id}"
            cache.set(cache_key, timezone.now().isoformat(), int(os.getenv('ADMIN_SESSION_TIMEOUT_DAYS', 3)) * 24 * 60 * 60)
        except Exception:
            pass


class AdminSessionAuthentication(BaseAuthentication):
    
    def authenticate(self, request):
        session_key = request.COOKIES.get('sessionid')
        if not session_key:
            return None
        
        user = self._get_user_from_session(session_key)
        if not user:
            return None
        
        if not self._is_valid_admin_user(user):
            return None
        
        self._update_user_activity(user)
        
        return (user, None)
    
    def _get_user_from_session(self, session_key):
        try:
            cache_key = f"admin_session_{session_key}"
            user_id = cache.get(cache_key)
            
            if user_id:
                try:
                    user = User.objects.get(id=user_id)
                    return user
                except User.DoesNotExist:
                    cache.delete(cache_key)
                    return None
            
            try:
                session = Session.objects.get(session_key=session_key)
                if session.expire_date < timezone.now():
                    session.delete()
                    return None
                
                user_id = session.get_decoded().get('_auth_user_id')
                if user_id:
                    user = User.objects.get(id=user_id)
                    cache.set(cache_key, user_id, int(os.getenv('ADMIN_SESSION_TIMEOUT_DAYS', 3)) * 24 * 60 * 60)
                    return user
            except Session.DoesNotExist:
                pass
            
        except Exception:
            pass
        
        return None
    
    def _is_valid_admin_user(self, user):
        is_valid = (
            user and 
            user.is_active and 
            user.user_type == 'admin' and 
            user.is_admin_active and
            user.is_staff
        )
        return is_valid
    
    def _update_user_activity(self, user):
        try:
            cache_key = f"admin_last_activity_{user.id}"
            cache.set(cache_key, timezone.now().isoformat(), int(os.getenv('ADMIN_SESSION_TIMEOUT_DAYS', 3)) * 24 * 60 * 60)
        except Exception:
            pass


class AdminSessionService:
    
    @staticmethod
    def create_session(user, request):
        if not user.user_type == 'admin':
            raise AuthenticationFailed("Only admin users can use session authentication")
        
        request.session.create()
        request.session['_auth_user_id'] = str(user.id)
        request.session['user_type'] = 'admin'
        request.session['login_time'] = timezone.now().isoformat()
        request.session.set_expiry(int(os.getenv('ADMIN_SESSION_TIMEOUT_DAYS', 3)) * 24 * 60 * 60)
        request.session.save()
        
        cache_key = f"admin_session_{request.session.session_key}"
        cache.set(cache_key, user.id, int(os.getenv('ADMIN_SESSION_TIMEOUT_DAYS', 3)) * 24 * 60 * 60)
        
        user.last_login_admin = timezone.now()
        user.save(update_fields=['last_login_admin'])
        
        return request.session.session_key
    
    @staticmethod
    def destroy_session(session_key):
        try:
            cache_key = f"admin_session_{session_key}"
            cache.delete(cache_key)
            
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