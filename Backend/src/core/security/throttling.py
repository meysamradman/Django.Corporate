from django.core.cache import cache
from django.utils import timezone
from datetime import timedelta

def _get_anon_throttle():
    from rest_framework.throttling import AnonRateThrottle
    return AnonRateThrottle

def _get_user_throttle():
    from rest_framework.throttling import UserRateThrottle
    return UserRateThrottle

def _create_safe_throttle_classes():
    AnonRateThrottle = _get_anon_throttle()
    UserRateThrottle = _get_user_throttle()
    
    class SafeAnonRateThrottle(AnonRateThrottle):
        def get_cache_key(self, request, view):
            try:
                return super().get_cache_key(request, view)
            except Exception:
                return None
        
        def allow_request(self, request, view):
            try:
                return super().allow_request(request, view)
            except (UnicodeDecodeError, ValueError):
                try:
                    cache_key = getattr(self, 'key', None)
                    if not cache_key:
                        cache_key = self.get_cache_key(request, view)
                    if cache_key:
                        cache.delete(cache_key)
                except Exception:
                    pass
                return True
            except Exception:
                return True
    
    class SafeUserRateThrottle(UserRateThrottle):
        def get_cache_key(self, request, view):
            try:
                return super().get_cache_key(request, view)
            except Exception:
                return None
        
        def allow_request(self, request, view):
            try:
                return super().allow_request(request, view)
            except (UnicodeDecodeError, ValueError):
                try:
                    cache_key = getattr(self, 'key', None)
                    if not cache_key:
                        cache_key = self.get_cache_key(request, view)
                    if cache_key:
                        cache.delete(cache_key)
                except Exception:
                    pass
                return True
            except Exception:
                return True
    
    return SafeAnonRateThrottle, SafeUserRateThrottle

_safe_anon_throttle_class = None
_safe_user_throttle_class = None

def get_safe_anon_throttle():
    global _safe_anon_throttle_class
    if _safe_anon_throttle_class is None:
        _safe_anon_throttle_class, _ = _create_safe_throttle_classes()
    return _safe_anon_throttle_class

def get_safe_user_throttle():
    global _safe_user_throttle_class
    if _safe_user_throttle_class is None:
        _, _safe_user_throttle_class = _create_safe_throttle_classes()
    return _safe_user_throttle_class

def __getattr__(name):
    if name == 'SafeAnonRateThrottle':
        return get_safe_anon_throttle()
    elif name == 'SafeUserRateThrottle':
        return get_safe_user_throttle()
    raise AttributeError(f"module '{__name__}' has no attribute '{name}'")

class AdminLoginThrottle:
    scope = 'admin_login'
    
    def __new__(cls, *args, **kwargs):
        base_class = get_safe_anon_throttle()
        
        class AdminLoginThrottleImpl(base_class):
            scope = 'admin_login'
            
            def get_cache_key(self, request, view):
                if request.user and request.user.is_authenticated:
                    return None
                ident = self.get_ident(request)
                return f"admin_login_{self.scope}_{ident}"
            
            def throttle_failure(self):
                return super().throttle_failure()
        
        return AdminLoginThrottleImpl(*args, **kwargs)

class UserLoginThrottle:
    scope = 'user_login'
    
    def __new__(cls, *args, **kwargs):
        base_class = get_safe_anon_throttle()
        
        class UserLoginThrottleImpl(base_class):
            scope = 'user_login'
            
            def get_cache_key(self, request, view):
                if request.user and request.user.is_authenticated:
                    return None
                ident = self.get_ident(request)
                return f"user_login_{self.scope}_{ident}"
            
            def throttle_failure(self):
                return super().throttle_failure()
        
        return UserLoginThrottleImpl(*args, **kwargs)

class AdminAPIThrottle:
    scope = 'admin'
    
    def __new__(cls, *args, **kwargs):
        base_class = get_safe_user_throttle()
        
        class AdminAPIThrottleImpl(base_class):
            scope = 'admin'
            
            def get_cache_key(self, request, view):
                if request.user and request.user.is_authenticated and request.user.is_staff:
                    return f"admin_api_{self.scope}_{request.user.id}"
                return None
        
        return AdminAPIThrottleImpl(*args, **kwargs)

class AdminManagementThrottle:
    scope = 'admin_management'
    
    def __new__(cls, *args, **kwargs):
        base_class = get_safe_user_throttle()
        
        class AdminManagementThrottleImpl(base_class):
            scope = 'admin_management'
            
            def get_cache_key(self, request, view):
                if request.user and request.user.is_authenticated and request.user.is_staff:
                    return f"admin_mgmt_{self.scope}_{request.user.id}"
                return None
        
        return AdminManagementThrottleImpl(*args, **kwargs)

class AdminUserCreationThrottle:
    scope = 'admin_user_creation'
    
    def __new__(cls, *args, **kwargs):
        base_class = get_safe_user_throttle()
        
        class AdminUserCreationThrottleImpl(base_class):
            scope = 'admin_user_creation'
            
            def get_cache_key(self, request, view):
                if request.user and request.user.is_authenticated and request.user.is_staff:
                    return f"admin_user_create_{self.scope}_{request.user.id}"
                return None
        
        return AdminUserCreationThrottleImpl(*args, **kwargs)

class AdminBulkOperationThrottle:
    scope = 'admin_bulk_ops'
    
    def __new__(cls, *args, **kwargs):
        base_class = get_safe_user_throttle()
        
        class AdminBulkOperationThrottleImpl(base_class):
            scope = 'admin_bulk_ops'
            
            def get_cache_key(self, request, view):
                if request.user and request.user.is_authenticated and request.user.is_staff:
                    return f"admin_bulk_{self.scope}_{request.user.id}"
                return None
        
        return AdminBulkOperationThrottleImpl(*args, **kwargs)

class AdminHeavyWorkThrottle:
    scope = 'admin_heavy_work'
    
    def __new__(cls, *args, **kwargs):
        base_class = get_safe_user_throttle()
        
        class AdminHeavyWorkThrottleImpl(base_class):
            scope = 'admin_heavy_work'
            
            def get_cache_key(self, request, view):
                if request.user and request.user.is_authenticated and request.user.is_staff:
                    return f"admin_heavy_{self.scope}_{request.user.id}"
                return None
        
        return AdminHeavyWorkThrottleImpl(*args, **kwargs)

class CaptchaThrottle:
    scope = 'captcha'
    
    def __new__(cls, *args, **kwargs):
        base_class = get_safe_anon_throttle()
        
        class CaptchaThrottleImpl(base_class):
            scope = 'captcha'
            
            def get_cache_key(self, request, view):
                ident = self.get_ident(request)
                return f"captcha_{self.scope}_{ident}"
        
        return CaptchaThrottleImpl(*args, **kwargs)

class FailedLoginThrottle:
    scope = 'failed_login'
    
    def __new__(cls, *args, **kwargs):
        base_class = get_safe_anon_throttle()
        
        class FailedLoginThrottleImpl(base_class):
            scope = 'failed_login'
            
            def get_cache_key(self, request, view):
                ident = self.get_ident(request)
                return f"failed_login_{self.scope}_{ident}"
            
            def get_rate(self):
                cache_key = self.get_cache_key(self.request, None)
                failed_attempts = cache.get(f"{cache_key}_attempts", 0)
                
                if failed_attempts >= 10:
                    return "1/hour"
                elif failed_attempts >= 5:
                    return "2/hour"
                elif failed_attempts >= 3:
                    return "5/hour"
                else:
                    return "10/hour"
            
            def throttle_failure(self):
                cache_key = self.get_cache_key(self.request, None)
                attempts_key = f"{cache_key}_attempts"
                current_attempts = cache.get(attempts_key, 0)
                cache.set(attempts_key, current_attempts + 1, timeout=3600)
                return super().throttle_failure()
        
        return FailedLoginThrottleImpl(*args, **kwargs)

class SecurityThrottle:
    scope = 'security'
    
    def __new__(cls, *args, **kwargs):
        base_class = get_safe_anon_throttle()
        
        class SecurityThrottleImpl(base_class):
            scope = 'security'
            
            def get_cache_key(self, request, view):
                ident = self.get_ident(request)
                return f"security_{self.scope}_{ident}"
        
        return SecurityThrottleImpl(*args, **kwargs)
