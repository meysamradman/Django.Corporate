import os
from django.contrib.auth import get_user_model
from django.contrib.sessions.models import Session
from django.core.cache import cache
from rest_framework.authentication import BaseAuthentication, SessionAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)
User = get_user_model()

class CSRFExemptSessionAuthentication(BaseAuthentication):
    """
    Session authentication without CSRF protection for admin API
    Use only for admin panel APIs where CSRF is handled differently
    """
    
    def authenticate(self, request):
        """
        Authenticate admin user using session with Redis caching
        """
        # Get session ID from cookie - only use sessionid (Django's default)
        session_key = request.COOKIES.get('sessionid')
        if not session_key:
            logger.debug("CSRFExemptSessionAuthentication: No sessionid cookie found")
            return None
        
        logger.debug(f"CSRFExemptSessionAuthentication: Found session key: {session_key}")
        
        # Check if session exists in Django's session store
        if not request.session.exists(session_key):
            logger.debug(f"CSRFExemptSessionAuthentication: Session {session_key} does not exist in Django session store")
            return None
        
        logger.debug(f"CSRFExemptSessionAuthentication: Session {session_key} exists in Django session store")
        
        # Try to get user from Django's session first
        try:
            user_id = request.session.get('_auth_user_id')
            if user_id:
                user = User.objects.get(id=user_id)
                logger.debug(f"CSRFExemptSessionAuthentication: User {user_id} found in Django session")
                
                # Verify user is admin and active
                if not self._is_valid_admin_user(user):
                    logger.debug(f"CSRFExemptSessionAuthentication: User {user.id} is not valid admin")
                    return None
                
                logger.debug(f"CSRFExemptSessionAuthentication: User {user.id} authenticated successfully")
                
                # Update last activity
                self._update_user_activity(user)
                
                return (user, None)
        except User.DoesNotExist:
            logger.debug(f"CSRFExemptSessionAuthentication: User {user_id} not found in DB")
        except Exception as e:
            logger.error(f"CSRFExemptSessionAuthentication: Error getting user from session: {e}")
        
        # Fallback to cache method
        user = self._get_user_from_session(session_key)
        if not user:
            logger.debug("CSRFExemptSessionAuthentication: No user found in session")
            return None
        
        # Verify user is admin and active
        if not self._is_valid_admin_user(user):
            logger.debug(f"CSRFExemptSessionAuthentication: User {user.id} is not valid admin")
            return None
        
        logger.debug(f"CSRFExemptSessionAuthentication: User {user.id} authenticated successfully")
        
        # Update last activity
        self._update_user_activity(user)
        
        return (user, None)
    
    def _get_user_from_session(self, session_key):
        """Get user from session with Redis caching"""
        try:
            # Try cache first
            cache_key = f"admin_session_{session_key}"
            user_id = cache.get(cache_key)
            
            if user_id:
                try:
                    user = User.objects.get(id=user_id)
                    logger.debug(f"CSRFExemptSessionAuthentication: User {user_id} found in cache")
                    return user
                except User.DoesNotExist:
                    cache.delete(cache_key)
                    logger.debug(f"CSRFExemptSessionAuthentication: User {user_id} not found in DB, deleted from cache")
                    return None
            
            # Fallback to session store
            try:
                session = Session.objects.get(session_key=session_key)
                logger.debug(f"CSRFExemptSessionAuthentication: Session found in DB: {session_key}, expire_date: {session.expire_date}")
                
                if session.expire_date < timezone.now():
                    session.delete()
                    logger.debug("CSRFExemptSessionAuthentication: Session expired, deleted")
                    return None
                
                # Decode session data
                session_data = session.get_decoded()
                logger.debug(f"CSRFExemptSessionAuthentication: Session data: {session_data}")
                
                user_id = session_data.get('_auth_user_id')
                logger.debug(f"CSRFExemptSessionAuthentication: User ID from session: {user_id}")
                
                if user_id:
                    user = User.objects.get(id=user_id)
                    # Cache for 3 days default
                    cache.set(cache_key, user_id, int(os.getenv('ADMIN_SESSION_TIMEOUT_DAYS', 3)) * 24 * 60 * 60)
                    logger.debug(f"CSRFExemptSessionAuthentication: User {user_id} cached successfully")
                    return user
                else:
                    logger.debug("CSRFExemptSessionAuthentication: No _auth_user_id in session data")
            except Session.DoesNotExist:
                logger.debug(f"CSRFExemptSessionAuthentication: Session {session_key} not found in DB")
                pass
            
        except Exception as e:
            logger.error(f"CSRFExemptSessionAuthentication: Session authentication error: {e}")
        
        return None
    
    def _is_valid_admin_user(self, user):
        """Verify user is valid admin"""
        is_valid = (
            user and 
            user.is_active and 
            user.user_type == 'admin' and 
            user.is_admin_active and
            user.is_staff
        )
        logger.debug(f"CSRFExemptSessionAuthentication: User validation: user={user}, is_active={user.is_active if user else None}, user_type={user.user_type if user else None}, is_admin_active={user.is_admin_active if user else None}, is_staff={user.is_staff if user else None}, result={is_valid}")
        return is_valid
    
    def _update_user_activity(self, user):
        """Update user's last activity timestamp"""
        try:
            # Update in cache to avoid frequent DB writes
            cache_key = f"admin_last_activity_{user.id}"
            cache.set(cache_key, timezone.now().isoformat(), int(os.getenv('ADMIN_SESSION_TIMEOUT_DAYS', 3)) * 24 * 60 * 60)  # 3 days default
            logger.debug(f"CSRFExemptSessionAuthentication: User {user.id} activity updated")
        except Exception as e:
            logger.warning(f"CSRFExemptSessionAuthentication: Failed to update user activity: {e}")


class AdminSessionAuthentication(BaseAuthentication):
    """
    Session-based authentication for admin panel
    Uses Redis for session storage and caching
    """
    
    def authenticate(self, request):
        """
        Authenticate admin user using session
        """
        # Get session ID from cookie - only use sessionid (Django's default)
        session_key = request.COOKIES.get('sessionid')
        if not session_key:
            logger.debug("AdminSessionAuthentication: No sessionid cookie found")
            return None
        
        logger.debug(f"AdminSessionAuthentication: Found session key: {session_key}")
        
        # Get user from session cache
        user = self._get_user_from_session(session_key)
        if not user:
            logger.debug("AdminSessionAuthentication: No user found in session")
            return None
        
        # Verify user is admin and active
        if not self._is_valid_admin_user(user):
            logger.debug(f"AdminSessionAuthentication: User {user.id} is not valid admin")
            return None
        
        logger.debug(f"AdminSessionAuthentication: User {user.id} authenticated successfully")
        
        # Update last activity
        self._update_user_activity(user)
        
        return (user, None)
    
    def _get_user_from_session(self, session_key):
        """Get user from session with Redis caching"""
        try:
            # Try cache first
            cache_key = f"admin_session_{session_key}"
            user_id = cache.get(cache_key)
            
            if user_id:
                try:
                    user = User.objects.get(id=user_id)
                    logger.debug(f"AdminSessionAuthentication: User {user_id} found in cache")
                    return user
                except User.DoesNotExist:
                    cache.delete(cache_key)
                    logger.debug(f"AdminSessionAuthentication: User {user_id} not found in DB, deleted from cache")
                    return None
            
            # Fallback to session store
            try:
                session = Session.objects.get(session_key=session_key)
                if session.expire_date < timezone.now():
                    session.delete()
                    logger.debug("AdminSessionAuthentication: Session expired, deleted")
                    return None
                
                user_id = session.get_decoded().get('_auth_user_id')
                logger.debug(f"AdminSessionAuthentication: User ID from session: {user_id}")
                if user_id:
                    user = User.objects.get(id=user_id)
                    # Cache for 3 days default
                    cache.set(cache_key, user_id, int(os.getenv('ADMIN_SESSION_TIMEOUT_DAYS', 3)) * 24 * 60 * 60)
                    logger.debug(f"AdminSessionAuthentication: User {user_id} cached successfully")
                    return user
            except Session.DoesNotExist:
                logger.debug("AdminSessionAuthentication: Session not found in DB")
                pass
            
        except Exception as e:
            logger.error(f"AdminSessionAuthentication: Session authentication error: {e}")
        
        return None
    
    def _is_valid_admin_user(self, user):
        """Verify user is valid admin"""
        is_valid = (
            user and 
            user.is_active and 
            user.user_type == 'admin' and 
            user.is_admin_active and
            user.is_staff
        )
        logger.debug(f"AdminSessionAuthentication: User validation: user={user}, is_active={user.is_active if user else None}, user_type={user.user_type if user else None}, is_admin_active={user.is_admin_active if user else None}, is_staff={user.is_staff if user else None}, result={is_valid}")
        return is_valid
    
    def _update_user_activity(self, user):
        """Update user's last activity timestamp"""
        try:
            # Update in cache to avoid frequent DB writes
            cache_key = f"admin_last_activity_{user.id}"
            cache.set(cache_key, timezone.now().isoformat(), int(os.getenv('ADMIN_SESSION_TIMEOUT_DAYS', 3)) * 24 * 60 * 60)  # 3 days default
            logger.debug(f"AdminSessionAuthentication: User {user.id} activity updated")
        except Exception as e:
            logger.warning(f"AdminSessionAuthentication: Failed to update user activity: {e}")


class AdminSessionService:
    """
    Service for managing admin sessions
    """
    
    @staticmethod
    def create_session(user, request):
        """Create session for admin user"""
        if not user.user_type == 'admin':
            raise AuthenticationFailed("Only admin users can use session authentication")
        
        # Create Django session
        request.session.create()
        request.session['_auth_user_id'] = str(user.id)
        request.session['user_type'] = 'admin'
        request.session['login_time'] = timezone.now().isoformat()
        request.session.set_expiry(int(os.getenv('ADMIN_SESSION_TIMEOUT_DAYS', 3)) * 24 * 60 * 60)
        request.session.save()
        
        logger.debug(f"AdminSessionService: Session created for user {user.id}: {request.session.session_key}")
        logger.debug(f"AdminSessionService: Session data: {request.session.get('_auth_user_id')}")
        
        # Cache session data
        cache_key = f"admin_session_{request.session.session_key}"
        cache.set(cache_key, user.id, int(os.getenv('ADMIN_SESSION_TIMEOUT_DAYS', 3)) * 24 * 60 * 60)  # 3 days default
        
        logger.debug(f"AdminSessionService: Session cached: {cache_key} -> {user.id}")
        
        # Update user login info - بدون استفاده از login_count
        user.last_login_admin = timezone.now()
        # user.login_count = (user.login_count or 0) + 1  # این خط مشکل دار بود
        user.save(update_fields=['last_login_admin'])  # فقط last_login_admin رو آپدیت می‌کنیم
        
        return request.session.session_key
    
    @staticmethod
    def destroy_session(session_key):
        """Destroy admin session"""
        try:
            # Clear cache
            cache_key = f"admin_session_{session_key}"
            cache.delete(cache_key)
            
            # Delete session
            Session.objects.filter(session_key=session_key).delete()
            logger.debug(f"AdminSessionService: Session {session_key} destroyed")
        except Exception as e:
            logger.error(f"AdminSessionService: Error destroying session: {e}")
    
    @staticmethod
    def get_active_sessions_count():
        """Get count of active admin sessions"""
        try:
            count = Session.objects.filter(
                expire_date__gt=timezone.now()
            ).count()
            logger.debug(f"AdminSessionService: Active sessions count: {count}")
            return count
        except Exception as e:
            logger.error(f"AdminSessionService: Error getting active sessions count: {e}")
            return 0