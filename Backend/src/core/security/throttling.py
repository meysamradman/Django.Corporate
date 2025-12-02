"""
Custom Throttling Classes for Enhanced Security
Based on Permission_System.mdc specifications

Note: Safe throttle classes use lazy loading via __getattr__ to avoid circular import issues.
They wrap the default DRF throttles with error handling for corrupted cache data.
"""
from django.core.cache import cache
from django.utils import timezone
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)


# Lazy import wrapper to avoid circular import
def _get_anon_throttle():
    """Lazy import AnonRateThrottle"""
    from rest_framework.throttling import AnonRateThrottle
    return AnonRateThrottle


def _get_user_throttle():
    """Lazy import UserRateThrottle"""
    from rest_framework.throttling import UserRateThrottle
    return UserRateThrottle


# Create Safe throttle classes using lazy inheritance
def _create_safe_throttle_classes():
    """Create Safe throttle classes with proper inheritance - called after DRF is loaded"""
    AnonRateThrottle = _get_anon_throttle()
    UserRateThrottle = _get_user_throttle()
    
    class SafeAnonRateThrottle(AnonRateThrottle):
        """Safe AnonRateThrottle that handles serialization errors"""
        def get_cache_key(self, request, view):
            """Get cache key with error handling"""
            try:
                return super().get_cache_key(request, view)
            except Exception as e:
                logger.warning(f"Error getting cache key in throttling: {e}")
                return None
        
        def allow_request(self, request, view):
            """Allow request with error handling for corrupted cache"""
            try:
                return super().allow_request(request, view)
            except (UnicodeDecodeError, ValueError) as e:
                # Handle corrupted cache data (pickle format in JSON serializer)
                logger.warning(f"Corrupted cache data detected in throttling, clearing: {e}")
                try:
                    # Get cache key from parent class (already set in parent's allow_request)
                    cache_key = getattr(self, 'key', None)
                    if not cache_key:
                        # Fallback to get_cache_key if key not set
                        cache_key = self.get_cache_key(request, view)
                    if cache_key:
                        cache.delete(cache_key)
                except Exception:
                    pass
                # Allow request after clearing corrupted cache
                return True
            except Exception as e:
                logger.error(f"Unexpected error in throttling: {e}")
                # Allow request on error to prevent blocking
                return True
    
    class SafeUserRateThrottle(UserRateThrottle):
        """Safe UserRateThrottle that handles serialization errors"""
        def get_cache_key(self, request, view):
            """Get cache key with error handling"""
            try:
                return super().get_cache_key(request, view)
            except Exception as e:
                logger.warning(f"Error getting cache key in throttling: {e}")
                return None
        
        def allow_request(self, request, view):
            """Allow request with error handling for corrupted cache"""
            try:
                return super().allow_request(request, view)
            except (UnicodeDecodeError, ValueError) as e:
                # Handle corrupted cache data (pickle format in JSON serializer)
                logger.warning(f"Corrupted cache data detected in throttling, clearing: {e}")
                try:
                    # Get cache key from parent class (already set in parent's allow_request)
                    cache_key = getattr(self, 'key', None)
                    if not cache_key:
                        # Fallback to get_cache_key if key not set
                        cache_key = self.get_cache_key(request, view)
                    if cache_key:
                        cache.delete(cache_key)
                except Exception:
                    pass
                # Allow request after clearing corrupted cache
                return True
            except Exception as e:
                logger.error(f"Unexpected error in throttling: {e}")
                # Allow request on error to prevent blocking
                return True
    
    return SafeAnonRateThrottle, SafeUserRateThrottle


# Lazy class creation - will be created when first accessed
_safe_anon_throttle_class = None
_safe_user_throttle_class = None


def get_safe_anon_throttle():
    """Get SafeAnonRateThrottle class - lazy initialization"""
    global _safe_anon_throttle_class
    if _safe_anon_throttle_class is None:
        _safe_anon_throttle_class, _ = _create_safe_throttle_classes()
    return _safe_anon_throttle_class


def get_safe_user_throttle():
    """Get SafeUserRateThrottle class - lazy initialization"""
    global _safe_user_throttle_class
    if _safe_user_throttle_class is None:
        _, _safe_user_throttle_class = _create_safe_throttle_classes()
    return _safe_user_throttle_class


# Module-level __getattr__ for lazy loading
def __getattr__(name):
    """Lazy load throttle classes to avoid circular imports"""
    if name == 'SafeAnonRateThrottle':
        return get_safe_anon_throttle()
    elif name == 'SafeUserRateThrottle':
        return get_safe_user_throttle()
    raise AttributeError(f"module '{__name__}' has no attribute '{name}'")


class AdminLoginThrottle:
    """
    Special throttling for admin login attempts
    More restrictive than regular user login
    """
    scope = 'admin_login'
    
    def __new__(cls, *args, **kwargs):
        """Create instance with SafeAnonRateThrottle base"""
        base_class = get_safe_anon_throttle()
        
        class AdminLoginThrottleImpl(base_class):
            scope = 'admin_login'
            
            def get_cache_key(self, request, view):
                """Generate cache key based on IP address for admin login"""
                if request.user and request.user.is_authenticated:
                    return None
                ident = self.get_ident(request)
                return f"admin_login_{self.scope}_{ident}"
            
            def throttle_failure(self):
                """Log failed throttling attempts"""
                logger.warning(f"Admin login throttling triggered for IP: {self.get_ident(self.request)}")
                return super().throttle_failure()
        
        return AdminLoginThrottleImpl(*args, **kwargs)


class UserLoginThrottle:
    """
    Throttling for regular user login attempts
    Less restrictive than admin login
    """
    scope = 'user_login'
    
    def __new__(cls, *args, **kwargs):
        """Create instance with SafeAnonRateThrottle base"""
        base_class = get_safe_anon_throttle()
        
        class UserLoginThrottleImpl(base_class):
            scope = 'user_login'
            
            def get_cache_key(self, request, view):
                """Generate cache key based on IP address for user login"""
                if request.user and request.user.is_authenticated:
                    return None
                ident = self.get_ident(request)
                return f"user_login_{self.scope}_{ident}"
            
            def throttle_failure(self):
                """Log failed throttling attempts"""
                logger.warning(f"User login throttling triggered for IP: {self.get_ident(self.request)}")
                return super().throttle_failure()
        
        return UserLoginThrottleImpl(*args, **kwargs)


class AdminAPIThrottle:
    """
    Throttling for admin API endpoints
    Higher rate limit for authenticated admin users
    """
    scope = 'admin'
    
    def __new__(cls, *args, **kwargs):
        """Create instance with SafeUserRateThrottle base"""
        base_class = get_safe_user_throttle()
        
        class AdminAPIThrottleImpl(base_class):
            scope = 'admin'
            
            def get_cache_key(self, request, view):
                """Generate cache key based on admin user ID"""
                if request.user and request.user.is_authenticated and request.user.is_staff:
                    return f"admin_api_{self.scope}_{request.user.id}"
                return None
        
        return AdminAPIThrottleImpl(*args, **kwargs)


class AdminManagementThrottle:
    """
    Special throttling for admin management operations
    More restrictive than regular admin API
    """
    scope = 'admin_management'
    
    def __new__(cls, *args, **kwargs):
        """Create instance with SafeUserRateThrottle base"""
        base_class = get_safe_user_throttle()
        
        class AdminManagementThrottleImpl(base_class):
            scope = 'admin_management'
            
            def get_cache_key(self, request, view):
                """Generate cache key based on admin user ID for management operations"""
                if request.user and request.user.is_authenticated and request.user.is_staff:
                    return f"admin_mgmt_{self.scope}_{request.user.id}"
                return None
        
        return AdminManagementThrottleImpl(*args, **kwargs)


class AdminUserCreationThrottle:
    """
    Special throttling for user creation operations
    Very restrictive to prevent spam user creation
    """
    scope = 'admin_user_creation'
    
    def __new__(cls, *args, **kwargs):
        """Create instance with SafeUserRateThrottle base"""
        base_class = get_safe_user_throttle()
        
        class AdminUserCreationThrottleImpl(base_class):
            scope = 'admin_user_creation'
            
            def get_cache_key(self, request, view):
                """Generate cache key based on admin user ID for user creation"""
                if request.user and request.user.is_authenticated and request.user.is_staff:
                    return f"admin_user_create_{self.scope}_{request.user.id}"
                return None
        
        return AdminUserCreationThrottleImpl(*args, **kwargs)


class AdminBulkOperationThrottle:
    """
    Special throttling for bulk operations (delete, update)
    Reasonable limits for daily work
    """
    scope = 'admin_bulk_ops'
    
    def __new__(cls, *args, **kwargs):
        """Create instance with SafeUserRateThrottle base"""
        base_class = get_safe_user_throttle()
        
        class AdminBulkOperationThrottleImpl(base_class):
            scope = 'admin_bulk_ops'
            
            def get_cache_key(self, request, view):
                """Generate cache key based on admin user ID for bulk operations"""
                if request.user and request.user.is_authenticated and request.user.is_staff:
                    return f"admin_bulk_{self.scope}_{request.user.id}"
                return None
        
        return AdminBulkOperationThrottleImpl(*args, **kwargs)


class AdminHeavyWorkThrottle:
    """
    Throttling for heavy admin operations (reports, exports, etc.)
    More lenient for legitimate heavy work
    """
    scope = 'admin_heavy_work'
    
    def __new__(cls, *args, **kwargs):
        """Create instance with SafeUserRateThrottle base"""
        base_class = get_safe_user_throttle()
        
        class AdminHeavyWorkThrottleImpl(base_class):
            scope = 'admin_heavy_work'
            
            def get_cache_key(self, request, view):
                """Generate cache key based on admin user ID for heavy operations"""
                if request.user and request.user.is_authenticated and request.user.is_staff:
                    return f"admin_heavy_{self.scope}_{request.user.id}"
                return None
        
        return AdminHeavyWorkThrottleImpl(*args, **kwargs)


class CaptchaThrottle:
    """
    Throttling for CAPTCHA generation and verification
    Prevents CAPTCHA abuse
    """
    scope = 'captcha'
    
    def __new__(cls, *args, **kwargs):
        """Create instance with SafeAnonRateThrottle base"""
        base_class = get_safe_anon_throttle()
        
        class CaptchaThrottleImpl(base_class):
            scope = 'captcha'
            
            def get_cache_key(self, request, view):
                """Generate cache key based on IP address for CAPTCHA requests"""
                ident = self.get_ident(request)
                return f"captcha_{self.scope}_{ident}"
        
        return CaptchaThrottleImpl(*args, **kwargs)


class FailedLoginThrottle:
    """
    Aggressive throttling for failed login attempts
    Tracks failed attempts per IP and increases throttling
    """
    scope = 'failed_login'
    
    def __new__(cls, *args, **kwargs):
        """Create instance with SafeAnonRateThrottle base"""
        base_class = get_safe_anon_throttle()
        
        class FailedLoginThrottleImpl(base_class):
            scope = 'failed_login'
            
            def get_cache_key(self, request, view):
                """Generate cache key based on IP address"""
                ident = self.get_ident(request)
                return f"failed_login_{self.scope}_{ident}"
            
            def get_rate(self):
                """Dynamic rate based on failed attempts"""
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
                """Increment failed attempts counter"""
                cache_key = self.get_cache_key(self.request, None)
                attempts_key = f"{cache_key}_attempts"
                current_attempts = cache.get(attempts_key, 0)
                cache.set(attempts_key, current_attempts + 1, timeout=3600)
                logger.warning(f"Failed login attempt {current_attempts + 1} from IP: {self.get_ident(self.request)}")
                return super().throttle_failure()
        
        return FailedLoginThrottleImpl(*args, **kwargs)


class SecurityThrottle:
    """
    General security throttling for sensitive operations
    """
    scope = 'security'
    
    def __new__(cls, *args, **kwargs):
        """Create instance with SafeAnonRateThrottle base"""
        base_class = get_safe_anon_throttle()
        
        class SecurityThrottleImpl(base_class):
            scope = 'security'
            
            def get_cache_key(self, request, view):
                """Generate cache key based on IP address"""
                ident = self.get_ident(request)
                return f"security_{self.scope}_{ident}"
        
        return SecurityThrottleImpl(*args, **kwargs)
