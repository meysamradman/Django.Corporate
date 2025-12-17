from django.contrib.auth import get_user_model
from django.contrib.sessions.models import Session
from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from django.utils import timezone
from src.core.cache import CacheService

User = get_user_model()


class CSRFExemptSessionAuthentication(BaseAuthentication):
    
    def __init__(self):
        self.session_manager = CacheService.get_session_manager()
        self.session_timeout = settings.ADMIN_SESSION_TIMEOUT_SECONDS
    
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
        import logging
        logger = logging.getLogger(__name__)
        
        try:
            logger.info(f'[SessionAuth] 🔍 Checking session: {session_key[:20]}...')
            user_id = self.session_manager.get_admin_session(session_key)
            
            if user_id:
                logger.info(f'[SessionAuth] ✅ Found user_id in Redis: {user_id}')
                try:
                    user = User.objects.get(id=user_id)
                    logger.info(f'[SessionAuth] ✅ User found: {user.id}')
                    return user
                except User.DoesNotExist:
                    logger.warning(f'[SessionAuth] ❌ User {user_id} not found - deleting session')
                    self.session_manager.delete_admin_session(session_key)
                    return None
            
            logger.info(f'[SessionAuth] ⚠️ No user_id in Redis, checking Django Session...')
            try:
                session = Session.objects.get(session_key=session_key)
                
                if session.expire_date < timezone.now():
                    logger.warning(f'[SessionAuth] ❌ Session expired! Expire: {session.expire_date}, Now: {timezone.now()}')
                    session.delete()
                    return None
                
                logger.info(f'[SessionAuth] ✅ Session valid, expire_date: {session.expire_date}')
                session_data = session.get_decoded()
                user_id = session_data.get('_auth_user_id')
                
                if user_id:
                    logger.info(f'[SessionAuth] ✅ Found user_id in session data: {user_id}')
                    user = User.objects.get(id=user_id)
                    self.session_manager.set_admin_session(session_key, user_id, self.session_timeout)
                    logger.info(f'[SessionAuth] ✅ Session refreshed in Redis')
                    return user
            except Session.DoesNotExist:
                logger.warning(f'[SessionAuth] ❌ Session not found in database')
                pass
            
        except Exception as e:
            logger.error(f'[SessionAuth] ❌ Error: {str(e)}', exc_info=True)
            pass
        
        logger.warning(f'[SessionAuth] ❌ No user found for session: {session_key[:20]}...')
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
            session_timeout = settings.ADMIN_SESSION_TIMEOUT_SECONDS
            CacheService.set(cache_key, timezone.now().isoformat(), session_timeout)
        except Exception:
            pass


class AdminSessionAuthentication(BaseAuthentication):
    
    def __init__(self):
        self.session_manager = CacheService.get_session_manager()
        self.session_timeout = settings.ADMIN_SESSION_TIMEOUT_SECONDS
    
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
            user_id = self.session_manager.get_admin_session(session_key)
            
            if user_id:
                try:
                    user = User.objects.get(id=user_id)
                    return user
                except User.DoesNotExist:
                    self.session_manager.delete_admin_session(session_key)
                    return None
            
            try:
                session = Session.objects.get(session_key=session_key)
                if session.expire_date < timezone.now():
                    session.delete()
                    return None
                
                user_id = session.get_decoded().get('_auth_user_id')
                if user_id:
                    user = User.objects.get(id=user_id)
                    self.session_manager.set_admin_session(session_key, user_id, self.session_timeout)
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
            session_timeout = settings.ADMIN_SESSION_TIMEOUT_SECONDS
            CacheService.set(cache_key, timezone.now().isoformat(), session_timeout)
        except Exception:
            pass