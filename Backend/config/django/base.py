import sys
import os
from pathlib import Path
from datetime import timedelta
from corsheaders.defaults import default_headers
from config.env import env, BASE_DIR
from django.utils.translation import gettext_lazy as _
env.read_env(os.path.join(BASE_DIR, ".env"))
SECRET_KEY = env('SECRET_KEY')

DEBUG = True
ALLOWED_HOSTS = ['*']

# Logging configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'src.user.views.admin.user_management_view': {
            'handlers': ['console'],
            'level': 'ERROR',
            'propagate': True,
        },
    },
}
APPEND_SLASH = False  # Disable automatic slash appending to prevent POST redirect issues
LOCAL_APPS = [
    'src.core.apps.CoreConfig',
    'src.user.apps.UserConfig',
    # 'src.blog.apps.BlogConfig',
    'src.portfolio.apps.PortfolioConfig',
    'src.media.apps.MediaConfig',
    'src.ai.apps.AiConfig',
    'src.statistics.apps.StatisticsConfig',
    'src.panel.apps.PanelConfig',
]
INSTALLED_APPS = [
     'django.contrib.admin',
     'django.contrib.auth',
     'django.contrib.contenttypes',
     'django.contrib.sessions',
     'django.contrib.messages',
     'django.contrib.staticfiles',
     'treebeard',
     'rest_framework',
     'django_filters',
     'rest_framework_simplejwt',
     'rest_framework_simplejwt.token_blacklist',
     'drf_spectacular',
     'django_redis',  # Redis cache support
     # 'debug_toolbar',
     *LOCAL_APPS,
]
MIDDLEWARE = [
     # "debug_toolbar.middleware.DebugToolbarMiddleware",
     'django.middleware.security.SecurityMiddleware',
     'src.core.security.middleware.SecurityLoggingMiddleware',  # Security logging
     # 'src.core.security.middleware.RateLimitMiddleware',       # حذف شد - تداخل با DRF throttling
     'src.core.security.middleware.CSRFExemptAdminMiddleware', # CSRF exemption for admin views
     'django.contrib.sessions.middleware.SessionMiddleware',
     'corsheaders.middleware.CorsMiddleware',
     # 'django.middleware.locale.LocaleMiddleware',  # غیرفعال - تک زبانه
     'django.middleware.common.CommonMiddleware',
     'django.middleware.csrf.CsrfViewMiddleware',
     'django.contrib.auth.middleware.AuthenticationMiddleware',
     'django.contrib.messages.middleware.MessageMiddleware',
     'django.middleware.clickjacking.XFrameOptionsMiddleware',
]
ROOT_URLCONF = 'config.urls'
TEMPLATES = [
     {
          'BACKEND': 'django.template.backends.django.DjangoTemplates',
          # 'DIRS': [],
         'DIRS': [
             # BASE_DIR / 'templates',
             os.path.join(BASE_DIR, 'templates/')
         ],
          'APP_DIRS': True,
          'OPTIONS': {
               'context_processors': [
                    'django.template.context_processors.debug',
                    'django.template.context_processors.request',
                    'django.contrib.auth.context_processors.auth',
                    'django.contrib.messages.context_processors.messages',
               ],
          },
     },
]
WSGI_APPLICATION = 'config.wsgi.application'
DATABASES = {
     'default': env.db('DATABASE_URL'),
}
AUTH_PASSWORD_VALIDATORS = [
     {
          'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
     },
     {
          'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
     },
     {
          'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
     },
     {
          'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
     },
]
AUTH_USER_MODEL = 'user.User'
# تک زبانه - فارسی
LANGUAGE_CODE = 'fa'
TIME_ZONE = 'Asia/Tehran'
USE_I18N = False  # غیرفعال کردن internationalization
USE_TZ = True
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATIC_URL = '/static/'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
MEDIA_URL = '/media/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
# INTERNAL_IPS = [
#      '127.0.0.1',
# ]

from rest_framework.authentication import SessionAuthentication

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
        'src.user.auth.admin_session_auth.CSRFExemptSessionAuthentication',
        # 'src.user.common.authentication.CookieJWTAuthentication',
        # 'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',        # Anonymous users: 100 requests per hour
        'user': '1000/hour',       # Authenticated users: 1000 requests per hour
        # Admin throttling removed - admins can work freely without limits
        'admin_login': '3/min',    # Admin login attempts: 3 per minute (only for login security)
        'user_login': '5/min',     # User login attempts: 5 per minute
        'captcha': '10/min',       # CAPTCHA requests: 10 per minute
        'failed_login': '10/hour', # Failed login attempts: 10 per hour
        'security': '20/hour',     # Security operations: 20 per hour
    },
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_FILTER_BACKENDS': ['django_filters.rest_framework.DjangoFilterBackend'],
    'EXCEPTION_HANDLER': 'src.core.handlers.custom_exception_handler',
    'DEFAULT_RENDERER_CLASSES': [
        'src.core.responses.APIResponse',
    ]
}
# تنظیمات CORS
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # آدرس فرانت‌اند شما
    "http://localhost:3001",  # آدرس فرانت‌اند شما
    "http://localhost:3002",  # آدرس فرانت‌اند شما
    "http://localhost:3003",
    "http://localhost:3004",  # آدرس فرانت‌اند شما
    "http://localhost:3005",  # آدرس فرانت‌اند شما
    "http://localhost:3006",  # آدرس فرانت‌اند شما
    "http://localhost:3007",  # آدرس فرانت‌اند شما
    "http://localhost:3008",
    "http://localhost:3009",  # آدرس فرانت‌اند شما
    "http://localhost:30010",  # آدرس فرانت‌اند شما
]

CORS_ALLOW_CREDENTIALS = True  # مجاز به ارسال کوکی‌ها و اعتبارسنجی‌ها
CORS_ALLOW_HEADERS = list(default_headers) + [
    'content-type',
    'authorization',
]

CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

# تنظیمات دیگر برای امنیت بیشتر
CSRF_TRUSTED_ORIGINS = [
    'http://localhost:3000',
    "http://localhost:3001",  # آدرس فرانت‌اند شما
    "http://localhost:3002",  # آدرس فرانت‌اند شما
    "http://localhost:3004",  # آدرس فرانت‌اند شما
    "http://localhost:3005",  # آدرس فرانت‌اند شما
]

AUTH_COOKIE_NAME = 'auth_token'
REFRESH_COOKIE_NAME = 'refresh_token'
SESSION_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_HTTPONLY = False
CSRF_USE_SESSIONS = True
CSRF_EXEMPT_ADMIN_VIEWS = True  # New setting to disable CSRF for admin API endpoints

# Admin Session Settings (Using Django Sessions)
# SESSION_COOKIE_NAME = 'sessionid'  # Commented out to use custom admin_session_id
SESSION_COOKIE_AGE = int(os.getenv('ADMIN_SESSION_TIMEOUT_DAYS', 3)) * 24 * 60 * 60  # 3 days default
SESSION_SAVE_EVERY_REQUEST = False
SESSION_COOKIE_HTTPONLY = True

USER_ACCESS_TOKEN_LIFETIME = timedelta(days=int(os.getenv('USER_ACCESS_TOKEN_LIFETIME_DAYS', 1)))
USER_REFRESH_TOKEN_LIFETIME = timedelta(days=int(os.getenv('USER_REFRESH_TOKEN_LIFETIME_DAYS', 15)))

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=int(os.getenv('USER_ACCESS_TOKEN_LIFETIME_DAYS', 1))),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=int(os.getenv('USER_REFRESH_TOKEN_LIFETIME_DAYS', 15))),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
    'UPDATE_LAST_LOGIN': True,
    'AUTH_COOKIE': AUTH_COOKIE_NAME,            # Name of the cookie to store the access token
    'AUTH_COOKIE_REFRESH': REFRESH_COOKIE_NAME, # Name of the cookie to store the refresh token
    'AUTH_COOKIE_DOMAIN': None,                 # Set to your domain in production if needed
    'AUTH_COOKIE_SECURE': not DEBUG,            # Use 'not DEBUG' to set Secure flag in production
    'AUTH_COOKIE_HTTP_ONLY': True,              # Keep HttpOnly True (Very Important!)
    'AUTH_COOKIE_PATH': '/',
    'AUTH_COOKIE_SAMESITE': 'Lax',              # Set SameSite to 'Lax' (Recommended) or 'Strict'
    'SLIDING_TOKEN_REFRESH_EXP_CLAIM': 'refresh_exp',
    'SLIDING_TOKEN_LIFETIME': timedelta(days=int(os.getenv('USER_ACCESS_TOKEN_LIFETIME_DAYS', 1))), # Match ACCESS_TOKEN_LIFETIME
    'SLIDING_TOKEN_REFRESH_LIFETIME': timedelta(days=int(os.getenv('USER_REFRESH_TOKEN_LIFETIME_DAYS', 15))), # Match REFRESH_TOKEN_LIFETIME
}

AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
]

# Redis Settings
REDIS_HOST = os.getenv('REDIS_HOST', 'localhost')
REDIS_PORT = int(os.getenv('REDIS_PORT', 6379))
REDIS_DB = int(os.getenv('REDIS_DB', 0))

# Cache settings - Redis
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': f'redis://{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'CONNECTION_POOL_KWARGS': {
                'max_connections': 50,
                'retry_on_timeout': True,
            },
        },
        'KEY_PREFIX': 'webtalik',
        'VERSION': 1,
        'TIMEOUT': 300,  # 5 minutes default
    },
    'session': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': f'redis://{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB + 1}',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        },
        'TIMEOUT': int(os.getenv('ADMIN_SESSION_TIMEOUT_DAYS', 3)) * 24 * 60 * 60,  # 3 days default
    }
}

CACHE_TTL = int(os.getenv('DEFAULT_CACHE_TIMEOUT_SECONDS', 60 * 15))

# CAPTCHA Settings
CAPTCHA_EXPIRY_SECONDS = int(os.getenv('CAPTCHA_EXPIRY_SECONDS', 300))  # 5 minutes
CAPTCHA_LENGTH = int(os.getenv('CAPTCHA_LENGTH', 4))  # digits
CAPTCHA_REDIS_PREFIX = os.getenv('CAPTCHA_REDIS_PREFIX', 'captcha:')


SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
SESSION_CACHE_ALIAS = 'session'

MELIPAYAMAK_API_URL = os.getenv('MELIPAYAMAK_API_URL')
MELIPAYAMAK_BODY_ID = int(os.getenv('MELIPAYAMAK_BODY_ID'))
MELIPAYAMAK_API_KEY = os.getenv('MELIPAYAMAK_API_KEY')

MEDIA_FILE_SIZE_LIMITS = {
    'image': int(os.getenv('MEDIA_IMAGE_SIZE_LIMIT', 5 * 1024 * 1024)),      # Default: 5MB
    'video': int(os.getenv('MEDIA_VIDEO_SIZE_LIMIT', 150 * 1024 * 1024)),    # Default: 150MB
    'audio': int(os.getenv('MEDIA_AUDIO_SIZE_LIMIT', 20 * 1024 * 1024)),     # Default: 20MB
    'pdf': int(os.getenv('MEDIA_PDF_SIZE_LIMIT', 10 * 1024 * 1024)),         # Default: 10MB
}

# Portfolio Export Settings (from env, with defaults)
PORTFOLIO_EXPORT_MAX_ITEMS = env.int('PORTFOLIO_EXPORT_MAX_ITEMS', default=500)  # Max items when exporting all (Excel/PDF)
PORTFOLIO_EXPORT_PRINT_MAX_ITEMS = env.int('PORTFOLIO_EXPORT_PRINT_MAX_ITEMS', default=2000)  # Max items for print
PORTFOLIO_EXPORT_PAGE_SIZE = env.int('PORTFOLIO_EXPORT_PAGE_SIZE', default=50)  # Default page size for page export
PORTFOLIO_EXPORT_RATE_LIMIT = env.int('PORTFOLIO_EXPORT_RATE_LIMIT', default=10)
PORTFOLIO_EXPORT_RATE_LIMIT_WINDOW = env.int('PORTFOLIO_EXPORT_RATE_LIMIT_WINDOW', default=3600)

# Portfolio Media Settings
# Limit for media items in list view (for performance)
PORTFOLIO_MEDIA_LIST_LIMIT = env.int('PORTFOLIO_MEDIA_LIST_LIMIT', default=5)  # Max media items per type in list view
# Limit for media items in detail view (set to 0 or None for unlimited)
PORTFOLIO_MEDIA_DETAIL_LIMIT = env.int('PORTFOLIO_MEDIA_DETAIL_LIMIT', default=0)  # 0 = unlimited in detail view
# Max media items that can be uploaded at once
PORTFOLIO_MEDIA_UPLOAD_MAX = env.int('PORTFOLIO_MEDIA_UPLOAD_MAX', default=50)  # Max media files per upload

MEDIA_ALLOWED_EXTENSIONS = {
    'image': os.getenv('MEDIA_IMAGE_EXTENSIONS', 'jpg,jpeg,webp,png,svg,gif').split(','),
    'video': os.getenv('MEDIA_VIDEO_EXTENSIONS', 'mp4,webm,mov').split(','),
    'pdf': os.getenv('MEDIA_PDF_EXTENSIONS', 'pdf').split(','),
    'audio': os.getenv('MEDIA_AUDIO_EXTENSIONS', 'mp3,ogg').split(','),
}

# تنظیمات لاگینگ برای دیدن خطاها
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': True,
        },
        'src.user.common.services': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'src.user.auth.admin_session_auth': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}