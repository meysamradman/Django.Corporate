"""
Core App Configuration
"""
from django.apps import AppConfig
import logging

logger = logging.getLogger(__name__)


class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'src.core'
    
    def ready(self):
        """Initialize core app - patch throttling classes for error handling"""
        # Import here to avoid circular imports
        try:
            from rest_framework.throttling import AnonRateThrottle, UserRateThrottle
            from django.core.cache import cache
            
            # Patch AnonRateThrottle to handle serialization errors
            original_allow_request = AnonRateThrottle.allow_request
            
            def safe_allow_request(self, request, view):
                """Safe allow_request with error handling"""
                try:
                    return original_allow_request(self, request, view)
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
            
            AnonRateThrottle.allow_request = safe_allow_request
            
            # Patch UserRateThrottle to handle serialization errors
            original_user_allow_request = UserRateThrottle.allow_request
            
            def safe_user_allow_request(self, request, view):
                """Safe allow_request with error handling"""
                try:
                    return original_user_allow_request(self, request, view)
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
            
            UserRateThrottle.allow_request = safe_user_allow_request
            
            logger.info("Core app ready - Throttling error handling patched")
        except Exception as e:
            logger.error(f"Error patching throttling classes: {e}")
