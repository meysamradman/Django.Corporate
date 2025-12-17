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

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
        'security_format': {
            'format': '🔒 {levelname} {asctime} | {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
        'security_console': {
            'level': 'WARNING',
            'class': 'logging.StreamHandler',
            'formatter': 'security_format',
        },
    },
    'loggers': {
        'src.user.views.admin.user_management_view': {
            'handlers': ['console'],
            'level': 'ERROR',
            'propagate': True,
        },
        'security': {
            'handlers': ['security_console'],
            'level': 'WARNING',
            'propagate': False,
        },
        'admin_security': {
            'handlers': ['security_console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}
APPEND_SLASH = False
# ========================================
# 🔵 CORE APPS (همیشه لازم هستند)
# ========================================
CORE_APPS = [
    'src.core.apps.CoreConfig',        # Core functionality
    'src.user.apps.UserConfig',        # User & Admin management
    'src.media.apps.MediaConfig',      # Media Library (centralized)
    'src.panel.apps.PanelConfig',      # Panel Settings
    'src.settings.apps.SettingsConfig', # System Settings
    'src.analytics.apps.AnalyticsConfig',  # Analytics & Tracking
]

# ========================================
# 🟠 CORPORATE APPS (برای وب‌سایت شرکتی)
# ========================================
CORPORATE_APPS = [
    'src.blog.apps.BlogConfig',        # Blog Management
    'src.portfolio.apps.PortfolioConfig',  # Portfolio Management
    'src.page.apps.PageConfig',        # Pages (About, Contact, etc.)
    'src.form.apps.FormConfig',        # Forms Builder
    'src.chatbot.apps.ChatbotConfig',  # Chatbot Management
    'src.ticket.apps.TicketConfig',    # Ticket System
    'src.email.apps.EmailConfig',      # Email Management
    'src.ai.apps.AiConfig',            # AI Tools
]

# ========================================
# 📦 تمام اپ‌های محلی
# ========================================
LOCAL_APPS = [
    *CORE_APPS,
    *CORPORATE_APPS,
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
     'django_redis',
     'django_mailbox',
     'post_office',
     'silk',
     *LOCAL_APPS,
]
MIDDLEWARE = [
    'silk.middleware.SilkyMiddleware',
     'django.middleware.security.SecurityMiddleware',
     'src.core.security.admin_security_middleware.AdminSecurityMiddleware',  # 🔒 Admin Security - باید بعد از SecurityMiddleware باشد
     'src.core.security.middleware.SecurityLoggingMiddleware',
     'src.core.security.middleware.SecurityHeadersMiddleware',  # Security headers for OWASP ZAP
     'src.core.security.middleware.CSRFExemptAdminMiddleware',
     'django.contrib.sessions.middleware.SessionMiddleware',
     'src.user.auth.admin_middleware.AdminSessionExpiryMiddleware',  # ✅ Session management برای admin - باید بعد از SessionMiddleware باشد
     'corsheaders.middleware.CorsMiddleware',
     'django.middleware.common.CommonMiddleware',
     'django.middleware.csrf.CsrfViewMiddleware',
     'django.contrib.auth.middleware.AuthenticationMiddleware',
     'django.contrib.messages.middleware.MessageMiddleware',
     'django.middleware.clickjacking.XFrameOptionsMiddleware',
     'src.core.feature_flags.middleware.FeatureFlagMiddleware',  # Feature Flag checking at runtime
     'src.analytics.middleware.AnalyticsMiddleware',  # Analytics tracking
]
ROOT_URLCONF = 'config.urls'
TEMPLATES = [
     {
          'BACKEND': 'django.template.backends.django.DjangoTemplates',
         'DIRS': [
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
LANGUAGE_CODE = 'fa'
TIME_ZONE = 'Asia/Tehran'
USE_I18N = False
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
        'anon': '100/hour',
        'user': '1000/hour',
        'admin_login': '3/min',
        'user_login': '5/min',
        'captcha': '30/min',  # افزایش برای جلوگیری از throttle در login
        'failed_login': '10/hour',
        'security': '20/hour',
    },
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_FILTER_BACKENDS': ['django_filters.rest_framework.DjangoFilterBackend'],
    'EXCEPTION_HANDLER': 'src.core.handlers.custom_exception_handler',
    'DEFAULT_RENDERER_CLASSES': [
        'src.core.responses.APIResponse',
    ]
}
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",  # Vite dev server
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:3003",
    "http://localhost:3004",
    "http://localhost:3005",
    "http://localhost:3006",
    "http://localhost:3007",
    "http://localhost:3008",
    "http://localhost:3009",
    "http://localhost:30010",
]

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = list(default_headers) + [
    'content-type',
    'authorization',
    'x-csrftoken',
]

CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

CSRF_TRUSTED_ORIGINS = [
    "http://localhost:5173",  # Vite dev server
    'http://localhost:3000',
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:3004",
    "http://localhost:3005",
]

AUTH_COOKIE_NAME = 'auth_token'
REFRESH_COOKIE_NAME = 'refresh_token'

# ============================================
# Session Settings (Admin Panel)
# ============================================
# برای تست: 30 ثانیه
# برای production: int(os.getenv('ADMIN_SESSION_TIMEOUT_DAYS', 3)) * 24 * 60 * 60
ADMIN_SESSION_TIMEOUT_SECONDS = 30  # 30 ثانیه برای تست سریع

# 🔒 Admin Panel Security - Secret URL Path
# یکبار تولید کن و در .env ذخیره کن
# مثلا با: python -c "import secrets; print(secrets.token_urlsafe(32))"
ADMIN_URL_SECRET = os.getenv('ADMIN_URL_SECRET', 'x7K9mP2qL5nR8tY3vZ6wC4fH1jN0bM')
# در production حتماً یک مقدار تصادفی و پیچیده بذار!

# 🔒 Admin IP Whitelist (اختیاری - برای امنیت بیشتر)
ADMIN_ALLOWED_IPS = os.getenv('ADMIN_ALLOWED_IPS', '').split(',')
ADMIN_ALLOWED_IPS = [ip.strip() for ip in ADMIN_ALLOWED_IPS if ip.strip()]

# Django Session Settings
SESSION_ENGINE = 'django.contrib.sessions.backends.cached_db'
SESSION_CACHE_ALIAS = 'session'
SESSION_COOKIE_NAME = 'sessionid'  # ✅ مشخص کردن name برای consistency
SESSION_COOKIE_AGE = ADMIN_SESSION_TIMEOUT_SECONDS
SESSION_COOKIE_PATH = '/'  # ✅ مشخص کردن path برای consistency
SESSION_COOKIE_DOMAIN = None  # ✅ None = current domain
SESSION_SAVE_EVERY_REQUEST = False
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SECURE = not DEBUG
SESSION_COOKIE_SAMESITE = 'Lax'
SESSION_EXPIRE_AT_BROWSER_CLOSE = False  # Session باید با expire_date منقضی شود

# CSRF Settings
CSRF_COOKIE_NAME = 'csrftoken'  # ✅ مشخص کردن name برای consistency
CSRF_COOKIE_PATH = '/'  # ✅ مشخص کردن path برای consistency
CSRF_COOKIE_DOMAIN = None  # ✅ None = current domain
CSRF_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_HTTPONLY = False
CSRF_USE_SESSIONS = True
CSRF_EXEMPT_ADMIN_VIEWS = True

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

# Cache settings - Redis (Optimized for Performance)
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': f'redis://{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}',
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
        'KEY_PREFIX': 'webtalik',
        'VERSION': 1,
        'TIMEOUT': 300,
    },
    'session': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': f'redis://{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB + 1}',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'CONNECTION_POOL_KWARGS': {
                'max_connections': 50,
                'retry_on_timeout': True,
                'socket_connect_timeout': 5,
                'socket_timeout': 5,
            },
        },
        'TIMEOUT': ADMIN_SESSION_TIMEOUT_SECONDS,
    }
}

CACHE_TTL = int(os.getenv('DEFAULT_CACHE_TIMEOUT_SECONDS', 60 * 15))

CAPTCHA_EXPIRY_SECONDS = int(os.getenv('CAPTCHA_EXPIRY_SECONDS', 300))
CAPTCHA_LENGTH = int(os.getenv('CAPTCHA_LENGTH', 4))
CAPTCHA_REDIS_PREFIX = os.getenv('CAPTCHA_REDIS_PREFIX', 'captcha:')

MELIPAYAMAK_API_URL = os.getenv('MELIPAYAMAK_API_URL')
MELIPAYAMAK_BODY_ID = int(os.getenv('MELIPAYAMAK_BODY_ID'))
MELIPAYAMAK_API_KEY = os.getenv('MELIPAYAMAK_API_KEY')

MEDIA_FILE_SIZE_LIMITS = {
    'image': int(os.getenv('MEDIA_IMAGE_SIZE_LIMIT', 500 * 1024)),
    'video': int(os.getenv('MEDIA_VIDEO_SIZE_LIMIT', 500 * 1024)),
    'audio': int(os.getenv('MEDIA_AUDIO_SIZE_LIMIT', 500 * 1024)),
    'pdf': int(os.getenv('MEDIA_PDF_SIZE_LIMIT', 500 * 1024)),
}

PORTFOLIO_EXPORT_MAX_ITEMS = env.int('PORTFOLIO_EXPORT_MAX_ITEMS', default=500)
PORTFOLIO_EXPORT_PRINT_MAX_ITEMS = env.int('PORTFOLIO_EXPORT_PRINT_MAX_ITEMS', default=2000)
PORTFOLIO_EXPORT_PAGE_SIZE = env.int('PORTFOLIO_EXPORT_PAGE_SIZE', default=50)
PORTFOLIO_EXPORT_RATE_LIMIT = env.int('PORTFOLIO_EXPORT_RATE_LIMIT', default=10)
PORTFOLIO_EXPORT_RATE_LIMIT_WINDOW = env.int('PORTFOLIO_EXPORT_RATE_LIMIT_WINDOW', default=3600)

BLOG_EXPORT_MAX_ITEMS = env.int('BLOG_EXPORT_MAX_ITEMS', default=PORTFOLIO_EXPORT_MAX_ITEMS)
BLOG_EXPORT_RATE_LIMIT = env.int('BLOG_EXPORT_RATE_LIMIT', default=PORTFOLIO_EXPORT_RATE_LIMIT)
BLOG_EXPORT_RATE_LIMIT_WINDOW = env.int('BLOG_EXPORT_RATE_LIMIT_WINDOW', default=PORTFOLIO_EXPORT_RATE_LIMIT_WINDOW)

PORTFOLIO_MEDIA_LIST_LIMIT = env.int('PORTFOLIO_MEDIA_LIST_LIMIT', default=5)
PORTFOLIO_MEDIA_DETAIL_LIMIT = env.int('PORTFOLIO_MEDIA_DETAIL_LIMIT', default=0)
PORTFOLIO_MEDIA_UPLOAD_MAX = env.int('PORTFOLIO_MEDIA_UPLOAD_MAX', default=50)

BLOG_MEDIA_LIST_LIMIT = env.int('BLOG_MEDIA_LIST_LIMIT', default=PORTFOLIO_MEDIA_LIST_LIMIT)
BLOG_MEDIA_DETAIL_LIMIT = env.int('BLOG_MEDIA_DETAIL_LIMIT', default=PORTFOLIO_MEDIA_DETAIL_LIMIT)
BLOG_MEDIA_UPLOAD_MAX = env.int('BLOG_MEDIA_UPLOAD_MAX', default=PORTFOLIO_MEDIA_UPLOAD_MAX)

MEDIA_ALLOWED_EXTENSIONS = {
    'image': os.getenv('MEDIA_IMAGE_EXTENSIONS', 'jpg,jpeg,webp,png,svg,gif').split(','),
    'video': os.getenv('MEDIA_VIDEO_EXTENSIONS', 'mp4,webm,mov').split(','),
    'pdf': os.getenv('MEDIA_PDF_EXTENSIONS', 'pdf').split(','),
    'audio': os.getenv('MEDIA_AUDIO_EXTENSIONS', 'mp3,ogg').split(','),
}

# GeoIP Settings
GEOIP_PATH = os.path.join(BASE_DIR, 'geoip')

EMAIL_BACKEND = env('EMAIL_BACKEND', default='django.core.mail.backends.smtp.EmailBackend')
EMAIL_HOST = env('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = env.int('EMAIL_PORT', default=587)
EMAIL_USE_TLS = env.bool('EMAIL_USE_TLS', default=True)
EMAIL_USE_SSL = env.bool('EMAIL_USE_SSL', default=False)
EMAIL_HOST_USER = env('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = env('EMAIL_HOST_PASSWORD', default='')
DEFAULT_FROM_EMAIL = env('DEFAULT_FROM_EMAIL', default=EMAIL_HOST_USER)

DJANGO_MAILBOX_STORE_ORIGINAL_MESSAGE = True
DJANGO_MAILBOX_ATTACHMENT_UPLOAD_TO = 'mailbox_attachments/%Y/%m/%d/'

POST_OFFICE = {
    'BACKENDS': {
        'default': 'django.core.mail.backends.smtp.EmailBackend',
    },
    'DEFAULT_PRIORITY': 'now',
    'LOG_LEVEL': 1,
}

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
            'level': 'INFO',
            'propagate': False,
        },
        'src.core.security.middleware': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'src.user.auth.admin_session_auth': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'src.portfolio.serializers.admin.portfolio_serializer': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}