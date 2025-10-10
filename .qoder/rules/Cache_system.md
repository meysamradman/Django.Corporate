---
trigger: always_on
alwaysApply: true
---

# راهنمای حرفه‌ای Caching در Django 2025

## 1. تنظیم اولیه Redis + Django

### نصب پکیج‌های ضروری

```bash
redis
django-redis
django-cacheops  # برای ORM caching خودکار
```

### تنظیمات settings.py

```python
# Cache Configuration
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': os.getenv('REDIS_URL', 'redis://127.0.0.1:6379/1'),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'CONNECTION_POOL_KWARGS': {
                'max_connections': 50,
                'retry_on_timeout': True,
                'socket_connect_timeout': 5,
                'socket_timeout': 5,
            },
            'COMPRESSOR': 'django_redis.compressors.zlib.ZlibCompressor',
            'SERIALIZER': 'django_redis.serializers.json.JSONSerializer',
        },
        'KEY_PREFIX': f"{os.getenv('PROJECT_NAME', 'myproject')}",
        'VERSION': 1,
        'TIMEOUT': 300,  # 5 minutes default
    },
    # Cache جداگانه برای session ها
    'session': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': os.getenv('REDIS_URL', 'redis://127.0.0.1:6379/2'),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        },
        'TIMEOUT': 3600,  # 1 hour
    }
}

# Session Storage در Redis
SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
SESSION_CACHE_ALIAS = 'session'
SESSION_COOKIE_AGE = 3600

# Cache Template Tags
INSTALLED_APPS = [
    # ...
    'cacheops',  # برای ORM caching
]
```

## 2. استراتژی‌های Caching حرفه‌ای

### الف) Database Query Caching با Cacheops

```python
# settings.py
CACHEOPS_REDIS = os.getenv('REDIS_URL', 'redis://127.0.0.1:6379/3')
CACHEOPS = {
    'accounts.user': {'ops': 'all', 'timeout': 60 * 15},  # 15 minutes
    'blog.category': {'ops': 'get', 'timeout': 60 * 60},  # 1 hour
    'blog.post': {
        'ops': {'fetch', 'get'},
        'timeout': 60 * 30,
        'local_get': True,
    },
    'blog.*': {'timeout': 60 * 10},
}
```

### ب) API Response Caching

```python
# utils/cache.py
from django.core.cache import cache
import hashlib, json

class CacheManager:
    @staticmethod
    def generate_cache_key(prefix, *args, **kwargs):
        key_data = f"{prefix}:{':'.join(str(arg) for arg in args)}"
        if kwargs:
            key_data += f":{json.dumps(kwargs, sort_keys=True)}"
        return hashlib.md5(key_data.encode()).hexdigest()[:16]
    
    @staticmethod
    def cached_api_response(timeout=300):
        def decorator(func):
            def wrapper(request, *args, **kwargs):
                cache_key = CacheManager.generate_cache_key(
                    f"api_{func.__name__}",
                    request.path,
                    request.GET.urlencode(),
                    request.user.id if request.user.is_authenticated else 'anonymous'
                )
                cached_response = cache.get(cache_key)
                if cached_response:
                    return cached_response
                response = func(request, *args, **kwargs)
                if getattr(response, 'status_code', None) == 200:
                    cache.set(cache_key, response, timeout)
                return response
            return wrapper
        return decorator
```

### پ) Model-Level Caching + Invalidation

```python
# models.py
from django.core.cache import cache
from django.db import models
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

class BlogPost(models.Model):
    title = models.CharField(max_length=200)
    content = models.TextField()
    category = models.ForeignKey('Category', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    @classmethod
    def get_cached_posts(cls, category_id=None, limit=10):
        cache_key = f"blog_posts_{category_id}_{limit}"
        posts = cache.get(cache_key)
        if posts is None:
            queryset = cls.objects.select_related('category')
            if category_id:
                queryset = queryset.filter(category_id=category_id)
            posts = list(queryset[:limit].values('id','title','category__name','created_at'))
            cache.set(cache_key, posts, 60*30)
        return posts

@receiver([post_save, post_delete], sender=BlogPost)
def invalidate_blog_cache(sender, **kwargs):
    instance = kwargs.get('instance')
    cache.delete_pattern(f"blog_posts_{instance.category_id}_*")
    cache.delete_pattern("blog_posts_None_*")
```

## 3. ViewSet Caching Strategy

```python
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.core.cache import cache

class BlogPostViewSet(viewsets.ModelViewSet):
    queryset = BlogPost.objects.all()
    serializer_class = BlogPostSerializer

    @method_decorator(cache_page(60*15))
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def popular(self, request):
        cache_key = 'popular_posts'
        popular_posts = cache.get(cache_key)
        if popular_posts is None:
            posts = self.get_queryset().filter(views_count__gte=1000).order_by('-views_count')[:10]
            popular_posts = self.get_serializer(posts, many=True).data
            cache.set(cache_key, popular_posts, 3600)
        return Response(popular_posts)

    def perform_create(self, serializer):
        super().perform_create(serializer)
        cache.clear()

    def perform_update(self, serializer):
        super().perform_update(serializer)
        cache.clear()
```

## 4. Cache Invalidation Strategies

* **Event-Driven**: با signals و cacheops.
* **Time-Based**: TTL مناسب روی keyها.
* **Manual Tools**: فرمان مدیریت برای پاک‌سازی selective.

```python
# management/commands/clear_cache.py
from django.core.management.base import BaseCommand
from django.core.cache import cache

class Command(BaseCommand):
    help = 'Clear cache by pattern or all'
    def add_arguments(self, parser):
        parser.add_argument('--pattern', type=str)
        parser.add_argument('--all', action='store_true')
    def handle(self, *args, **options):
        if options['all']:
            cache.clear()
        elif options['pattern']:
            cache.delete_pattern(options['pattern'])
```

## 5. Production Configuration

### Redis (redis.conf)

```conf
maxmemory 2gb
maxmemory-policy allkeys-lru
save ""
appendonly no
requirepass your_redis_password
```

### Docker Compose

```yaml
version: '3.8'
services:
  redis:
    image: redis:7.2-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
volumes:
  redis_data:
```

## 6. Monitoring و Performance

```python
# utils/cache_health.py
from django.core.cache import cache

class CacheHealthCheck:
    @staticmethod
    def check():
        try:
            cache.set('health_check','ok',10)
            return cache.get('health_check')=='ok'
        except: return False
```

## 7. Best Practices

✅ توصیه‌شده:

* استفاده از Redis با django-redis + cacheops.
* Namespace + Versioning برای کلیدها.
* TTL منطقی (۵ دقیقه تا ۱ ساعت).
* استفاده از compression و serializer مناسب.
* مانیتورینگ hit/miss.

❌ اجتناب:

* LocMemCache در تولید.
* Cache بدون expiration.
* Cache داده‌های حساس.

## 8. Environment Variables

```env
REDIS_URL=redis://:password@localhost:6379
REDIS_PASSWORD=your_secure_password
CACHE_TIMEOUT=300
PROJECT_NAME=myproject
```

---

### خلاصه

بهترین رویکرد در 2025 برای پروژه‌های Django + DRF + Next.js: **Redis + django-redis** به‌عنوان لایهٔ اصلی کش، ORM-level caching با **cacheops**، API caching در سطح viewset و decorator، invalidation بر پایهٔ event و TTL، و مانیتورینگ Redis برای performance پایدار.

