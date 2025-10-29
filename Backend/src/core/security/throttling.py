"""
Custom Throttling Classes for Enhanced Security
Based on Permission_System.mdc specifications
"""
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle
from django.core.cache import cache
from django.utils import timezone
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)


class AdminLoginThrottle(AnonRateThrottle):
    """
    Special throttling for admin login attempts
    More restrictive than regular user login
    """
    scope = 'admin_login'
    
    def get_cache_key(self, request, view):
        """
        Generate cache key based on IP address for admin login
        """
        if request.user and request.user.is_authenticated:
            # If user is already authenticated, don't throttle
            return None
            
        # Use IP address for anonymous admin login attempts
        ident = self.get_ident(request)
        return f"admin_login_{self.scope}_{ident}"
    
    def throttle_failure(self):
        """
        Log failed throttling attempts for security monitoring
        """
        logger.warning(f"Admin login throttling triggered for IP: {self.get_ident(self.request)}")
        return super().throttle_failure()


class UserLoginThrottle(AnonRateThrottle):
    """
    Throttling for regular user login attempts
    Less restrictive than admin login
    """
    scope = 'user_login'
    
    def get_cache_key(self, request, view):
        """
        Generate cache key based on IP address for user login
        """
        if request.user and request.user.is_authenticated:
            # If user is already authenticated, don't throttle
            return None
            
        # Use IP address for anonymous user login attempts
        ident = self.get_ident(request)
        return f"user_login_{self.scope}_{ident}"
    
    def throttle_failure(self):
        """
        Log failed throttling attempts for security monitoring
        """
        logger.warning(f"User login throttling triggered for IP: {self.get_ident(self.request)}")
        return super().throttle_failure()


class AdminAPIThrottle(UserRateThrottle):
    """
    Throttling for admin API endpoints
    Higher rate limit for authenticated admin users
    """
    scope = 'admin'
    
    def get_cache_key(self, request, view):
        """
        Generate cache key based on admin user ID
        """
        if request.user and request.user.is_authenticated and request.user.is_staff:
            return f"admin_api_{self.scope}_{request.user.id}"
        return None


class AdminManagementThrottle(UserRateThrottle):
    """
    Special throttling for admin management operations
    More restrictive than regular admin API
    """
    scope = 'admin_management'
    
    def get_cache_key(self, request, view):
        """
        Generate cache key based on admin user ID for management operations
        """
        if request.user and request.user.is_authenticated and request.user.is_staff:
            return f"admin_mgmt_{self.scope}_{request.user.id}"
        return None


class AdminUserCreationThrottle(UserRateThrottle):
    """
    Special throttling for user creation operations
    Very restrictive to prevent spam user creation
    """
    scope = 'admin_user_creation'
    
    def get_cache_key(self, request, view):
        """
        Generate cache key based on admin user ID for user creation
        """
        if request.user and request.user.is_authenticated and request.user.is_staff:
            return f"admin_user_create_{self.scope}_{request.user.id}"
        return None


class AdminBulkOperationThrottle(UserRateThrottle):
    """
    Special throttling for bulk operations (delete, update)
    Reasonable limits for daily work
    """
    scope = 'admin_bulk_ops'
    
    def get_cache_key(self, request, view):
        """
        Generate cache key based on admin user ID for bulk operations
        """
        if request.user and request.user.is_authenticated and request.user.is_staff:
            return f"admin_bulk_{self.scope}_{request.user.id}"
        return None


class AdminHeavyWorkThrottle(UserRateThrottle):
    """
    Throttling for heavy admin operations (reports, exports, etc.)
    More lenient for legitimate heavy work
    """
    scope = 'admin_heavy_work'
    
    def get_cache_key(self, request, view):
        """
        Generate cache key based on admin user ID for heavy operations
        """
        if request.user and request.user.is_authenticated and request.user.is_staff:
            return f"admin_heavy_{self.scope}_{request.user.id}"
        return None


class CaptchaThrottle(AnonRateThrottle):
    """
    Throttling for CAPTCHA generation and verification
    Prevents CAPTCHA abuse
    """
    scope = 'captcha'
    
    def get_cache_key(self, request, view):
        """
        Generate cache key based on IP address for CAPTCHA requests
        """
        ident = self.get_ident(request)
        return f"captcha_{self.scope}_{ident}"


class FailedLoginThrottle(AnonRateThrottle):
    """
    Aggressive throttling for failed login attempts
    Tracks failed attempts per IP and increases throttling
    """
    scope = 'failed_login'
    
    def get_cache_key(self, request, view):
        """
        Generate cache key based on IP address
        """
        ident = self.get_ident(request)
        return f"failed_login_{self.scope}_{ident}"
    
    def get_rate(self):
        """
        Dynamic rate based on failed attempts
        """
        cache_key = self.get_cache_key(self.request, None)
        failed_attempts = cache.get(f"{cache_key}_attempts", 0)
        
        # Increase throttling based on failed attempts
        if failed_attempts >= 10:
            return "1/hour"  # Very restrictive
        elif failed_attempts >= 5:
            return "2/hour"  # More restrictive
        elif failed_attempts >= 3:
            return "5/hour"  # Restrictive
        else:
            return "10/hour"  # Default
    
    def throttle_failure(self):
        """
        Increment failed attempts counter
        """
        cache_key = self.get_cache_key(self.request, None)
        attempts_key = f"{cache_key}_attempts"
        
        # Increment failed attempts
        current_attempts = cache.get(attempts_key, 0)
        cache.set(attempts_key, current_attempts + 1, timeout=3600)  # 1 hour
        
        logger.warning(f"Failed login attempt {current_attempts + 1} from IP: {self.get_ident(self.request)}")
        return super().throttle_failure()


class SecurityThrottle(AnonRateThrottle):
    """
    General security throttling for sensitive operations
    """
    scope = 'security'
    
    def get_cache_key(self, request, view):
        """
        Generate cache key based on IP address
        """
        ident = self.get_ident(request)
        return f"security_{self.scope}_{ident}"
