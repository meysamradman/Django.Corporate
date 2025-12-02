from django.apps import AppConfig


class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'src.core'
    
    def ready(self):
        try:
            from rest_framework.throttling import AnonRateThrottle, UserRateThrottle
            from django.core.cache import cache
            
            original_allow_request = AnonRateThrottle.allow_request
            
            def safe_allow_request(self, request, view):
                try:
                    return original_allow_request(self, request, view)
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
            
            AnonRateThrottle.allow_request = safe_allow_request
            
            original_user_allow_request = UserRateThrottle.allow_request
            
            def safe_user_allow_request(self, request, view):
                try:
                    return original_user_allow_request(self, request, view)
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
            
            UserRateThrottle.allow_request = safe_user_allow_request
        except Exception:
            pass
