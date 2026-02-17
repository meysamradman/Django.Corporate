from django.utils.deprecation import MiddlewareMixin
from django.http import JsonResponse
from django.conf import settings
from django.contrib.sessions.models import Session
from django.utils import timezone
from django.core.cache import cache
from src.core.cache import CacheService
from src.user.messages import AUTH_ERRORS
from src.user.utils.cache_ttl import USER_ADMIN_SESSION_CHECK_TTL

class AdminSessionExpiryMiddleware(MiddlewareMixin):
 
    SESSION_CHECK_CACHE_TTL = USER_ADMIN_SESSION_CHECK_TTL

    PUBLIC_ENDPOINTS = frozenset([
        '/api/admin/logout/',
    ])

    @staticmethod
    def _normalized_allowed_origins():
        raw_origins = getattr(settings, 'CORS_ALLOWED_ORIGINS', [])
        if isinstance(raw_origins, str):
            raw_origins = raw_origins.split(',')
        return {origin.strip() for origin in raw_origins if origin and origin.strip()}

    def _resolve_response_origin(self, request):
        origin = (request.META.get('HTTP_ORIGIN') or '').strip()
        if not origin:
            return None
        allowed_origins = self._normalized_allowed_origins()
        if settings.DEBUG or origin in allowed_origins:
            return origin
        return None
    
    def _is_public_endpoint(self, request):
        if request.path in self.PUBLIC_ENDPOINTS:
            return True
        
        admin_secret = getattr(settings, 'ADMIN_URL_SECRET', '')
        if admin_secret:
            if f'/api/admin/{admin_secret}/auth/login/' in request.path:
                return True
            if f'/api/admin/{admin_secret}/auth/logout/' in request.path:
                return True
            if f'/api/admin/{admin_secret}/auth/captcha/' in request.path:
                return True
            if f'/api/admin/{admin_secret}/auth/password-reset/' in request.path:
                return True
        
        return False
    
    def process_request(self, request):
        
        if not request.path.startswith('/api/admin/'):
            return None
        
        if request.method == 'OPTIONS':
            return None
        
        if self._is_public_endpoint(request):
            return None
        
        if not hasattr(request, 'session'):
            return None
        
        session_key = request.session.session_key
        if not session_key:
            return self._create_401_response(request, 'No session key')
        
        cache_key = f'session_valid_{session_key}'
        cached_result = cache.get(cache_key)
        
        if cached_result is False:
            return self._handle_expired_session(request, session_key)
        
        try:
            session_manager = CacheService.get_session_manager()
            user_id = session_manager.get_admin_session(session_key)
        except Exception as e:
            pass
        
        try:
            session = Session.objects.get(session_key=session_key)
            expire_date = session.expire_date
            now = timezone.now()
            
            if expire_date < now:
                cache.set(cache_key, False, self.SESSION_CHECK_CACHE_TTL)
                return self._handle_expired_session(request, session_key, session)
            else:
                time_left = (expire_date - now).total_seconds()
                cache.set(cache_key, True, min(self.SESSION_CHECK_CACHE_TTL, int(time_left)))
                
        except Session.DoesNotExist:
            cache.set(cache_key, False, self.SESSION_CHECK_CACHE_TTL)
            return self._handle_expired_session(request, session_key)
        except Exception as e:
            pass
        
        return None
    
    def _handle_expired_session(self, request, session_key, session_obj=None):
        
        try:
            session_manager = CacheService.get_session_manager()
            session_manager.delete_admin_session(session_key)
        except Exception as e:
            pass
        
        if session_obj:
            try:
                session_obj.delete()
            except Exception:
                pass
        else:
            try:
                Session.objects.filter(session_key=session_key).delete()
            except Exception:
                pass
        
        try:
            request.session.flush()
        except Exception:
            pass
        
        request._session_expired = True
        request._expired_session_key = session_key
        
        return self._create_401_response(request, 'Session expired')
    
    def _create_401_response(self, request, reason='Session expired'):
        
        response = JsonResponse(
            {
                'metaData': {
                    'message': AUTH_ERRORS['auth_token_expired'],
                    'AppStatusCode': 401,
                    'success': False
                },
                'result': None
            },
            status=401
        )

        response_origin = self._resolve_response_origin(request)
        if response_origin:
            response['Access-Control-Allow-Origin'] = response_origin
            response['Access-Control-Allow-Credentials'] = 'true'
            response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
            response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-CSRFToken'
        
        return response
    
    def process_response(self, request, response):
        
        if hasattr(request, '_session_expired') and request._session_expired:
            session_key = getattr(request, '_expired_session_key', 'unknown')[:20]
            
            response.delete_cookie(
                'sessionid',
                path=settings.SESSION_COOKIE_PATH,
                domain=settings.SESSION_COOKIE_DOMAIN
            )
            
            response.delete_cookie(
                'csrftoken',
                path=settings.CSRF_COOKIE_PATH,
                domain=settings.CSRF_COOKIE_DOMAIN
            )
        
        return response

