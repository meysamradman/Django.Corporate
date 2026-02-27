import sys
import os
from pathlib import Path
from datetime import timedelta
import mimetypes
from corsheaders.defaults import default_headers

mimetypes.add_type("image/webp", ".webp")

from config.env import env, BASE_DIR
from django.utils.translation import gettext_lazy as _
env.read_env(os.path.join(BASE_DIR, ".env"))


def env_list(name: str, default: str = '') -> list[str]:
    raw_value = env(name, default=default)
    if isinstance(raw_value, (list, tuple, set)):
        values = raw_value
    else:
        values = str(raw_value).split(',')
    return [item.strip() for item in values if item and str(item).strip()]


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

CORE_APPS = [
    'src.core.apps.CoreConfig',
    'src.user.apps.UserConfig',
    'src.media.apps.MediaConfig',
    'src.panel.apps.PanelConfig',
    'src.settings.apps.SettingsConfig',
    'src.analytics.apps.AnalyticsConfig',
]

CORPORATE_APPS = [
    'src.blog.apps.BlogConfig', 
    'src.portfolio.apps.PortfolioConfig',
    'src.real_estate.apps.RealEstateConfig',
    'src.real_estate_projects.apps.RealEstateProjectsConfig',
    'src.page.apps.PageConfig',
    'src.form.apps.FormConfig',
    'src.chatbot.apps.ChatbotConfig',
    'src.ticket.apps.TicketConfig',
    'src.email.apps.EmailConfig',
    'src.ai.apps.AiConfig', 
]

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
     'django.contrib.postgres',  # Required for SearchVectorField, GinIndex, BrinIndex
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
    'default': {
        **env.db('DATABASE_URL'),
        'CONN_MAX_AGE': 60,  # Keep connections alive for 60 seconds
        'CONN_HEALTH_CHECKS': True,  # Check connection health before reuse
        'OPTIONS': {
            # PostgreSQL query optimization
            'options': '-c statement_timeout=30000',  # 30 second query timeout
        },
    }
}

REAL_ESTATE_GEO_ENGINE = os.getenv('REAL_ESTATE_GEO_ENGINE', 'auto').strip().lower()
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

DRF_ENABLE_GLOBAL_THROTTLE = env.bool('DRF_ENABLE_GLOBAL_THROTTLE', default=False)
DRF_GLOBAL_THROTTLE_CLASSES = [
    'rest_framework.throttling.AnonRateThrottle',
    'rest_framework.throttling.UserRateThrottle',
] if DRF_ENABLE_GLOBAL_THROTTLE else []

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
    'DEFAULT_THROTTLE_CLASSES': DRF_GLOBAL_THROTTLE_CLASSES,
    'DEFAULT_THROTTLE_RATES': {
        'anon': env('DRF_THROTTLE_ANON_RATE', default='60000/hour' if DEBUG else '3000/hour'),
        'user': env('DRF_THROTTLE_USER_RATE', default='60000/hour' if DEBUG else '12000/hour'),
        'admin_login': '20/min',      # 🔧 Login attempts - فقط برای brute force protection
        'user_login': '20/min',       # 🔧 Login attempts - فقط برای brute force protection
        'captcha': '100/min',         # 🔧 Captcha - راحت برای ادمین‌ها
        'failed_login': '10/hour',    # 🔧 Failed logins - فقط برای امنیت
        'security': '100/hour',       # 🔧 Security endpoints - راحتتر
    },
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_FILTER_BACKENDS': ['django_filters.rest_framework.DjangoFilterBackend'],
    'EXCEPTION_HANDLER': 'src.core.handlers.custom_exception_handler',
    'DEFAULT_RENDERER_CLASSES': [
        'src.core.responses.APIResponse',
    ]
}
CORS_ALLOWED_ORIGINS = env_list(
    'CORS_ALLOWED_ORIGINS',
    default='',
)

if DEBUG and not CORS_ALLOWED_ORIGINS:
    CORS_ALLOWED_ORIGINS = [
        'http://localhost:5173',
        'http://localhost:3000',
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

CSRF_TRUSTED_ORIGINS = env_list(
    'CSRF_TRUSTED_ORIGINS',
    default='',
)

if DEBUG and not CSRF_TRUSTED_ORIGINS:
    CSRF_TRUSTED_ORIGINS = [
        'http://localhost:5173',
        'http://localhost:3000',
    ]

AUTH_COOKIE_NAME = 'auth_token'
REFRESH_COOKIE_NAME = 'refresh_token'

# ============================================
# Session Settings (Admin Panel)
# ============================================
# ✅ Production: 3 روز = 259200 ثانیه
# 🧪 Test: 30 ثانیه برای تست
ADMIN_SESSION_TIMEOUT_SECONDS = int(os.getenv('ADMIN_SESSION_TIMEOUT_SECONDS', 259200))

# 🔒 Admin Panel Security - Secret URL Path
# یکبار تولید کن و در .env ذخیره کن
# مثلا با: python -c "import secrets; print(secrets.token_urlsafe(32))"
ADMIN_URL_SECRET = os.getenv('ADMIN_URL_SECRET', 'x7K9mP2qL5nR8tY3vZ6wC4fH1jN0bM')
# در production حتماً یک مقدار تصادفی و پیچیده بذار!

# 🔒 Admin IP Whitelist (اختیاری - برای امنیت بیشتر)
ADMIN_ALLOWED_IPS = env_list('ADMIN_ALLOWED_IPS', default='')

# Next.js on-demand tag revalidation webhook

# ============================================
# Django Session Settings
# ============================================
SESSION_ENGINE = 'django.contrib.sessions.backends.cached_db'
SESSION_CACHE_ALIAS = 'session'
SESSION_COOKIE_NAME = 'sessionid'
SESSION_COOKIE_AGE = ADMIN_SESSION_TIMEOUT_SECONDS
SESSION_COOKIE_PATH = '/'
SESSION_COOKIE_DOMAIN = None

# ✅ False = Session دقیقاً بعد از ADMIN_SESSION_TIMEOUT_SECONDS منقضی میشه
# بدون تمدید خودکار - از زمان login حساب میشه
SESSION_SAVE_EVERY_REQUEST = False

SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SECURE = not DEBUG
SESSION_COOKIE_SAMESITE = 'Lax'

# ✅ False = session با expire_date منقضی میشه (نه با بستن browser)
SESSION_EXPIRE_AT_BROWSER_CLOSE = False

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
            'IGNORE_EXCEPTIONS': True,
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

OTP_LENGTH = int(os.getenv('OTP_LENGTH', 4))
OTP_EXPIRY_SECONDS = int(os.getenv('OTP_EXPIRY_SECONDS', 120))
OTP_RESEND_SECONDS = int(os.getenv('OTP_RESEND_SECONDS', OTP_EXPIRY_SECONDS))
OTP_MAX_REQUESTS = int(os.getenv('OTP_MAX_REQUESTS', 10))
OTP_REQUEST_WINDOW = int(os.getenv('OTP_REQUEST_WINDOW', 3600))

MELIPAYAMAK_API_URL = os.getenv('MELIPAYAMAK_API_URL')
MELIPAYAMAK_BODY_ID = int(os.getenv('MELIPAYAMAK_BODY_ID'))
MELIPAYAMAK_API_KEY = os.getenv('MELIPAYAMAK_API_KEY')

USE_OTP_SIMULATOR = os.getenv('USE_OTP_SIMULATOR', 'False').lower() == 'true'
OTP_SIMULATOR_CODE = os.getenv('OTP_SIMULATOR_CODE', '').strip()

MEDIA_FILE_SIZE_LIMITS = {
    'image': int(os.getenv('MEDIA_IMAGE_SIZE_LIMIT', 10 * 1024 * 1024)),
    'video': int(os.getenv('MEDIA_VIDEO_SIZE_LIMIT', 150 * 1024 * 1024)),
    'audio': int(os.getenv('MEDIA_AUDIO_SIZE_LIMIT', 20 * 1024 * 1024)),
    'pdf': int(os.getenv('MEDIA_PDF_SIZE_LIMIT', 10 * 1024 * 1024)),
}

PORTFOLIO_EXPORT_MAX_ITEMS = env.int('PORTFOLIO_EXPORT_MAX_ITEMS', default=500)
PORTFOLIO_EXPORT_PRINT_MAX_ITEMS = env.int('PORTFOLIO_EXPORT_PRINT_MAX_ITEMS', default=2000)
PORTFOLIO_EXPORT_PAGE_SIZE = env.int('PORTFOLIO_EXPORT_PAGE_SIZE', default=50)
PORTFOLIO_EXPORT_RATE_LIMIT = env.int('PORTFOLIO_EXPORT_RATE_LIMIT', default=10)
PORTFOLIO_EXPORT_RATE_LIMIT_WINDOW = env.int('PORTFOLIO_EXPORT_RATE_LIMIT_WINDOW', default=3600)

BLOG_EXPORT_MAX_ITEMS = env.int('BLOG_EXPORT_MAX_ITEMS', default=500)
BLOG_EXPORT_PRINT_MAX_ITEMS = env.int('BLOG_EXPORT_PRINT_MAX_ITEMS', default=2000)
BLOG_EXPORT_PAGE_SIZE = env.int('BLOG_EXPORT_PAGE_SIZE', default=50)
BLOG_EXPORT_RATE_LIMIT = env.int('BLOG_EXPORT_RATE_LIMIT', default=10)
BLOG_EXPORT_RATE_LIMIT_WINDOW = env.int('BLOG_EXPORT_RATE_LIMIT_WINDOW', default=3600)

DATABASE_EXPORT_RATE_LIMIT = env.int('DATABASE_EXPORT_RATE_LIMIT', default=5)
DATABASE_EXPORT_RATE_LIMIT_WINDOW = env.int('DATABASE_EXPORT_RATE_LIMIT_WINDOW', default=3600)

PORTFOLIO_MEDIA_LIST_LIMIT = env.int('PORTFOLIO_MEDIA_LIST_LIMIT', default=5)
PORTFOLIO_MEDIA_DETAIL_LIMIT = env.int('PORTFOLIO_MEDIA_DETAIL_LIMIT', default=0)
PORTFOLIO_MEDIA_UPLOAD_MAX = env.int('PORTFOLIO_MEDIA_UPLOAD_MAX', default=50)

BLOG_MEDIA_LIST_LIMIT = env.int('BLOG_MEDIA_LIST_LIMIT', default=5)
BLOG_MEDIA_DETAIL_LIMIT = env.int('BLOG_MEDIA_DETAIL_LIMIT', default=0)
BLOG_MEDIA_UPLOAD_MAX = env.int('BLOG_MEDIA_UPLOAD_MAX', default=50)

REAL_ESTATE_EXPORT_MAX_ITEMS = env.int('REAL_ESTATE_EXPORT_MAX_ITEMS', default=500)
REAL_ESTATE_EXPORT_PRINT_MAX_ITEMS = env.int('REAL_ESTATE_EXPORT_PRINT_MAX_ITEMS', default=2000)
REAL_ESTATE_EXPORT_PAGE_SIZE = env.int('REAL_ESTATE_EXPORT_PAGE_SIZE', default=50)
REAL_ESTATE_EXPORT_RATE_LIMIT = env.int('REAL_ESTATE_EXPORT_RATE_LIMIT', default=10)
REAL_ESTATE_EXPORT_RATE_LIMIT_WINDOW = env.int('REAL_ESTATE_EXPORT_RATE_LIMIT_WINDOW', default=3600)

REAL_ESTATE_MEDIA_LIST_LIMIT = env.int('REAL_ESTATE_MEDIA_LIST_LIMIT', default=5)
REAL_ESTATE_MEDIA_DETAIL_LIMIT = env.int('REAL_ESTATE_MEDIA_DETAIL_LIMIT', default=0)
REAL_ESTATE_MEDIA_UPLOAD_MAX = env.int('REAL_ESTATE_MEDIA_UPLOAD_MAX', default=50)

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
        'media': {
            'format': '📁 {levelname} {asctime} | {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
        'media_console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'media',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': True,
        },
        'django_redis': {
            'handlers': ['console'],
            'level': 'ERROR',
            'propagate': False,
        },
        'src.media.services.media_services': {
            'handlers': ['media_console'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'src.media.views.media_views': {
            'handlers': ['media_console'],
            'level': 'DEBUG',
            'propagate': False,
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
