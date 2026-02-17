from django.core.cache import cache, caches
from django.conf import settings
from typing import Optional, Any, Callable
from .namespaces import CacheTTL, CacheNamespace
from .keys import CacheKeyBuilder
import time

try:
    from django_redis import get_redis_connection
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

class RedisManager:
    
    def __init__(self, cache_alias: str = 'default'):
        self._cache_alias = cache_alias
        self._cache = caches[cache_alias]
        self.default_timeout = getattr(settings, 'CACHE_TTL', CacheTTL.DEFAULT)
    
    def get(self, key: str, default: Any = None) -> Any:
        try:
            value = self._cache.get(key, default)
            return value
        except Exception as e:
            return default
    
    def set(self, key: str, value: Any, timeout: Optional[int] = None) -> bool:
        try:
            timeout = timeout or self.default_timeout
            self._cache.set(key, value, timeout)
            return True
        except Exception as e:
            return False
    
    def delete(self, key: str) -> bool:
        try:
            self._cache.delete(key)
            return True
        except Exception as e:
            return False
    
    def delete_many(self, keys: list[str]) -> int:
        try:
            self._cache.delete_many(keys)
            return len(keys)
        except Exception as e:
            return 0
    
    def delete_pattern(self, pattern: str) -> int:
        try:
            keys = self._cache.keys(pattern)
            if keys:
                return self.delete_many(keys)
            return 0
        except (AttributeError, NotImplementedError):
            return 0
        except Exception as e:
            return 0
    
    def exists(self, key: str) -> bool:
        try:
            return self._cache.has_key(key)
        except Exception as e:
            return False
    
    def ttl(self, key: str) -> int:
        try:
            return self._cache.ttl(key)
        except (AttributeError, NotImplementedError):
            return -1
        except Exception as e:
            return -1
    
    def expire(self, key: str, timeout: int) -> bool:
        try:
            self._cache.expire(key, timeout)
            return True
        except (AttributeError, NotImplementedError):
            return False
        except Exception as e:
            return False
    
    def incr(self, key: str, delta: int = 1) -> Optional[int]:
        try:
            return self._cache.incr(key, delta)
        except Exception as e:
            return None
    
    def decr(self, key: str, delta: int = 1) -> Optional[int]:
        try:
            return self._cache.decr(key, delta)
        except Exception as e:
            return None
    
    def clear(self) -> bool:
        try:
            self._cache.clear()
            return True
        except Exception as e:
            return False
    
    def ping(self) -> bool:
        max_retries = 3
        for attempt in range(1, max_retries + 1):
            try:
                test_key = f'_health_check_{int(time.time())}'
                self._cache.set(test_key, 'ok', 10)
                result = self._cache.get(test_key)
                self._cache.delete(test_key)
                if result == 'ok':
                    return True
            except Exception as e:
                if attempt != max_retries:
                    time.sleep(0.5 * attempt)
        return False
    
    def get_redis_client(self):
        
        if not REDIS_AVAILABLE:
            return None
        try:
            return get_redis_connection(self._cache_alias)
        except Exception:
            return None
    
    def list_push(self, key: str, value: Any, side: str = 'left') -> Optional[int]:
        
        try:
            client = self.get_redis_client()
            if not client:
                return None
            
            if side == 'left':
                return client.lpush(key, value)
            else:
                return client.rpush(key, value)
        except Exception:
            return None
    
    def list_pop(self, key: str, side: str = 'right') -> Optional[Any]:
        
        try:
            client = self.get_redis_client()
            if not client:
                return None
            
            if side == 'left':
                result = client.lpop(key)
            else:
                result = client.rpop(key)
            
            if result:
                if isinstance(result, bytes):
                    return result.decode('utf-8')
                return result
            return None
        except Exception:
            return None
    
    def list_length(self, key: str) -> int:
        
        try:
            client = self.get_redis_client()
            if not client:
                return 0
            return client.llen(key)
        except Exception:
            return 0
    
    def list_trim(self, key: str, start: int, end: int) -> bool:
        
        try:
            client = self.get_redis_client()
            if not client:
                return False
            client.ltrim(key, start, end)
            return True
        except Exception:
            return False
    
    def get_redis_info(self, section: Optional[str] = None) -> Optional[dict]:
        
        try:
            client = self.get_redis_client()
            if not client:
                return None
            return client.info(section)
        except Exception:
            return None

    def zadd(self, key: str, mapping: dict[str, float]) -> Optional[int]:
        try:
            client = self.get_redis_client()
            if not client:
                return None
            return client.zadd(key, mapping)
        except Exception:
            return None

    def zcard(self, key: str) -> int:
        try:
            client = self.get_redis_client()
            if not client:
                return 0
            return int(client.zcard(key) or 0)
        except Exception:
            return 0

    def zremrangebyscore(self, key: str, min_score: float, max_score: float) -> int:
        try:
            client = self.get_redis_client()
            if not client:
                return 0
            return int(client.zremrangebyscore(key, min_score, max_score) or 0)
        except Exception:
            return 0

class SessionRedisManager(RedisManager):
    
    def __init__(self):
        super().__init__(cache_alias='session')
        self.admin_session_ttl = CacheTTL.SESSION_ADMIN
        self.user_session_ttl = CacheTTL.SESSION_USER
    
    def set_admin_session(self, session_key: str, user_id: int, ttl: Optional[int] = None) -> bool:
        key = CacheKeyBuilder.admin_session(session_key)
        ttl = ttl or self.admin_session_ttl
        return self.set(key, user_id, ttl)
    
    def get_admin_session(self, session_key: str) -> Optional[int]:
        key = CacheKeyBuilder.admin_session(session_key)
        value = self.get(key)
        return int(value) if value else None
    
    def delete_admin_session(self, session_key: str) -> bool:
        key = CacheKeyBuilder.admin_session(session_key)
        return self.delete(key)
    
    def refresh_admin_session(self, session_key: str, ttl: Optional[int] = None) -> bool:
        key = CacheKeyBuilder.admin_session(session_key)
        ttl = ttl or self.admin_session_ttl
        return self.expire(key, ttl)
    
    def set_user_session(self, session_key: str, user_id: int, ttl: Optional[int] = None) -> bool:
        key = CacheKeyBuilder.user_session(session_key)
        ttl = ttl or self.user_session_ttl
        return self.set(key, user_id, ttl)
    
    def get_user_session(self, session_key: str) -> Optional[int]:
        key = CacheKeyBuilder.user_session(session_key)
        value = self.get(key)
        return int(value) if value else None
    
    def delete_user_session(self, session_key: str) -> bool:
        key = CacheKeyBuilder.user_session(session_key)
        return self.delete(key)

class CacheService:
    
    _default_manager: Optional[RedisManager] = None
    _session_manager: Optional[SessionRedisManager] = None
    
    @classmethod
    def get_default_manager(cls) -> RedisManager:
        if cls._default_manager is None:
            cls._default_manager = RedisManager('default')
        return cls._default_manager
    
    @classmethod
    def get_session_manager(cls) -> SessionRedisManager:
        if cls._session_manager is None:
            cls._session_manager = SessionRedisManager()
        return cls._session_manager
    
    @classmethod
    def get(cls, key: str, default: Any = None) -> Any:
        return cls.get_default_manager().get(key, default)
    
    @classmethod
    def set(cls, key: str, value: Any, timeout: Optional[int] = None) -> bool:
        return cls.get_default_manager().set(key, value, timeout)
    
    @classmethod
    def delete(cls, key: str) -> bool:
        return cls.get_default_manager().delete(key)
    
    @classmethod
    def delete_many(cls, keys: list[str]) -> int:
        return cls.get_default_manager().delete_many(keys)
    
    @classmethod
    def delete_pattern(cls, pattern: str) -> int:
        return cls.get_default_manager().delete_pattern(pattern)
    
    @classmethod
    def exists(cls, key: str) -> bool:
        return cls.get_default_manager().exists(key)
    
    @classmethod
    def clear_user_cache(cls, user_id: int) -> int:
        keys = CacheKeyBuilder.user_all_keys(user_id)
        deleted = cls.delete_many(keys)
        
        pattern = CacheKeyBuilder.pattern(f"{CacheNamespace.ADMIN_PERMISSIONS}:{user_id}")
        deleted += cls.delete_pattern(pattern)
        
        return deleted
    
    @classmethod
    def clear_portfolio_cache(cls, portfolio_id: int) -> int:
        keys = CacheKeyBuilder.portfolio_all_keys(portfolio_id)
        return cls.delete_many(keys)
    
    @classmethod
    def clear_portfolios_cache(cls, portfolio_ids: list[int]) -> int:
        all_keys = []
        for pid in portfolio_ids:
            all_keys.extend(CacheKeyBuilder.portfolio_all_keys(pid))
        return cls.delete_many(all_keys)
    
    @classmethod
    def clear_portfolio_lists(cls) -> int:
        pattern = CacheKeyBuilder.pattern(f"{CacheNamespace.PORTFOLIO_LIST}:admin")
        return cls.delete_pattern(pattern)
    
    @classmethod
    def clear_blog_cache(cls, blog_id: int) -> int:
        keys = CacheKeyBuilder.blog_all_keys(blog_id)
        return cls.delete_many(keys)
    
    @classmethod
    def clear_blogs_cache(cls, blog_ids: list[int]) -> int:
        all_keys = []
        for bid in blog_ids:
            all_keys.extend(CacheKeyBuilder.blog_all_keys(bid))
        return cls.delete_many(all_keys)
    
    @classmethod
    def clear_blog_lists(cls) -> int:
        pattern = CacheKeyBuilder.pattern(f"{CacheNamespace.BLOG_LIST}:admin")
        return cls.delete_pattern(pattern)
    
    @classmethod
    def clear_ai_provider(cls, slug: str) -> int:
        keys = [
            CacheKeyBuilder.ai_provider(slug),
            CacheKeyBuilder.ai_providers_active(),
        ]
        deleted = cls.delete_many(keys)
        pattern = CacheKeyBuilder.pattern(f"{CacheNamespace.AI_MODEL}:provider:{slug}")
        deleted += cls.delete_pattern(pattern)
        return deleted
    
    @classmethod
    def clear_ai_providers(cls) -> int:
        pattern = CacheKeyBuilder.pattern(CacheNamespace.AI_PROVIDER)
        return cls.delete_pattern(pattern)
    
    @classmethod
    def clear_ai_models(cls) -> int:
        pattern = CacheKeyBuilder.pattern(CacheNamespace.AI_MODEL)
        return cls.delete_pattern(pattern)
    
    @classmethod
    def set_otp(cls, mobile: str, otp: str, ttl: Optional[int] = None) -> bool:
        key = CacheKeyBuilder.otp(mobile)
        timeout = ttl or CacheTTL.OTP
        return cls.set(key, otp, timeout)
    
    @classmethod
    def get_otp(cls, mobile: str) -> Optional[str]:
        key = CacheKeyBuilder.otp(mobile)
        return cls.get(key)
    
    @classmethod
    def delete_otp(cls, mobile: str) -> bool:
        key = CacheKeyBuilder.otp(mobile)
        return cls.delete(key)
    
    @classmethod
    def set_captcha(cls, captcha_id: str, answer: str, ttl: Optional[int] = None) -> bool:
        key = CacheKeyBuilder.captcha(captcha_id)
        timeout = ttl or CacheTTL.CAPTCHA
        return cls.set(key, answer, timeout)
    
    @classmethod
    def get_captcha(cls, captcha_id: str) -> Optional[str]:
        key = CacheKeyBuilder.captcha(captcha_id)
        return cls.get(key)
    
    @classmethod
    def delete_captcha(cls, captcha_id: str) -> bool:
        key = CacheKeyBuilder.captcha(captcha_id)
        return cls.delete(key)
    
    @classmethod
    def ping(cls) -> dict[str, bool]:
        return {
            'default': cls.get_default_manager().ping(),
            'session': cls.get_session_manager().ping(),
        }
    
    @classmethod
    def list_push(cls, key: str, value: Any, side: str = 'left') -> Optional[int]:
        
        return cls.get_default_manager().list_push(key, value, side)
    
    @classmethod
    def list_pop(cls, key: str, side: str = 'right') -> Optional[Any]:
        
        return cls.get_default_manager().list_pop(key, side)
    
    @classmethod
    def list_length(cls, key: str) -> int:
        
        return cls.get_default_manager().list_length(key)
    
    @classmethod
    def list_trim(cls, key: str, start: int, end: int) -> bool:
        
        return cls.get_default_manager().list_trim(key, start, end)
    
    @classmethod
    def get_redis_info(cls, section: Optional[str] = None) -> Optional[dict]:
        
        return cls.get_default_manager().get_redis_info(section)

    @classmethod
    def zadd(cls, key: str, mapping: dict[str, float]) -> Optional[int]:
        return cls.get_default_manager().zadd(key, mapping)

    @classmethod
    def zcard(cls, key: str) -> int:
        return cls.get_default_manager().zcard(key)

    @classmethod
    def zremrangebyscore(cls, key: str, min_score: float, max_score: float) -> int:
        return cls.get_default_manager().zremrangebyscore(key, min_score, max_score)

    @classmethod
    def clear_property_cache(cls, property_id: int) -> int:
        
        from .keys import CacheKeyBuilder
        keys = CacheKeyBuilder.property_all_keys(property_id)
        return cls.delete_many(keys)
    
    @classmethod
    def clear_properties_cache(cls, property_ids: list[int]) -> int:
        
        from .keys import CacheKeyBuilder
        all_keys = []
        for pid in property_ids:
            all_keys.extend(CacheKeyBuilder.property_all_keys(pid))
        return cls.delete_many(all_keys)
    
    @classmethod
    def clear_property_lists(cls) -> int:
        
        from .namespaces import CacheNamespace
        from .keys import CacheKeyBuilder
        pattern = CacheKeyBuilder.pattern(f"{CacheNamespace.PROPERTY_LIST}:admin")
        deleted = cls.delete_pattern(pattern)
        deleted += cls.delete(CacheKeyBuilder.property_featured())
        return deleted
    
    @classmethod
    def clear_property_statistics(cls) -> int:
        
        from .keys import CacheKeyBuilder
        return cls.delete(CacheKeyBuilder.property_statistics())

def cache_result(key_builder: Callable, timeout: Optional[int] = None):
    def decorator(func: Callable) -> Callable:
        def wrapper(*args, **kwargs):
            cache_key = key_builder(*args, **kwargs)
            
            cached_value = CacheService.get(cache_key)
            if cached_value is not None:
                return cached_value
            
            result = func(*args, **kwargs)
            
            if result is not None:
                CacheService.set(cache_key, result, timeout)
            
            return result
        return wrapper
    return decorator
