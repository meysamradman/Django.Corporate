"""
🚀 Django Production Settings
================================
این فایل تنظیمات امنیتی برای Production است.
در محیط Local استفاده نمی‌شود.

برای استفاده در سرور:
1. فایل .env.production را به .env تغییر نام دهید
2. متغیر محیطی DJANGO_SETTINGS_MODULE را تنظیم کنید:
   export DJANGO_SETTINGS_MODULE=config.django.production
3. python manage.py check --deploy را اجرا کنید
"""

from .base import *
import os

# ============================================
# 🔒 CRITICAL SECURITY SETTINGS
# ============================================

# Debug باید حتماً False باشد
DEBUG = False

# ALLOWED_HOSTS از env می‌خواند
# در .env.production: ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
ALLOWED_HOSTS = env('ALLOWED_HOSTS', default='').split(',')

# ============================================
# 🔐 HTTPS & SSL Configuration
# ============================================

# همه درخواست‌ها به HTTPS redirect شوند
SECURE_SSL_REDIRECT = env.bool('SECURE_SSL_REDIRECT', default=True)

# برای استفاده پشت Nginx/Apache/Cloudflare
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# ============================================
# 🍪 Cookie Security
# ============================================

# Session Cookie Security
SESSION_COOKIE_SECURE = env.bool('SESSION_COOKIE_SECURE', default=True)
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'

# CSRF Cookie Security
CSRF_COOKIE_SECURE = env.bool('CSRF_COOKIE_SECURE', default=True)
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SAMESITE = 'Lax'

# ============================================
# 🛡️ HSTS (HTTP Strict Transport Security)
# ============================================

# مرورگرها را مجبور کنید فقط از HTTPS استفاده کنند
SECURE_HSTS_SECONDS = env.int('SECURE_HSTS_SECONDS', default=31536000)  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = env.bool('SECURE_HSTS_INCLUDE_SUBDOMAINS', default=True)
SECURE_HSTS_PRELOAD = env.bool('SECURE_HSTS_PRELOAD', default=True)

# ============================================
# 🔒 XSS & Clickjacking Protection
# ============================================

SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# ============================================
# 🌐 CORS Configuration
# ============================================

# فقط دامنه‌های مشخص را اجازه دهید
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = env('CORS_ALLOWED_ORIGINS', default='').split(',')

# ============================================
# 🗄️ Database Security
# ============================================

# اگر دیتابیس PostgreSQL شما از SSL پشتیبانی می‌کند
if env.bool('DATABASE_SSL_ENABLED', default=True):
    DATABASES['default']['OPTIONS'] = {
        'sslmode': 'require',
    }

# ============================================
# 📝 Logging برای Production
# ============================================

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '[{levelname}] {asctime} {name} {module} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'filters': {
        'require_debug_false': {
            '()': 'django.utils.log.RequireDebugFalse',
        },
    },
    'handlers': {
        'console': {
            'level': 'WARNING',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
        'file': {
            'level': 'ERROR',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': os.path.join(BASE_DIR, 'logs', 'django.log'),
            'maxBytes': 1024 * 1024 * 15,  # 15MB
            'backupCount': 10,
            'formatter': 'verbose',
        },
        'security_file': {
            'level': 'WARNING',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': os.path.join(BASE_DIR, 'logs', 'security.log'),
            'maxBytes': 1024 * 1024 * 15,  # 15MB
            'backupCount': 10,
            'formatter': 'verbose',
        },
        'mail_admins': {
            'level': 'ERROR',
            'class': 'django.utils.log.AdminEmailHandler',
            'filters': ['require_debug_false'],
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'WARNING',
            'propagate': False,
        },
        'django.security': {
            'handlers': ['security_file', 'mail_admins'],
            'level': 'WARNING',
            'propagate': False,
        },
        'django.request': {
            'handlers': ['file', 'mail_admins'],
            'level': 'ERROR',
            'propagate': False,
        },
        # Logging برای اپ‌های خودتان
        'src.user': {
            'handlers': ['file'],
            'level': 'ERROR',
            'propagate': False,
        },
        'src.media': {
            'handlers': ['file'],
            'level': 'ERROR',
            'propagate': False,
        },
        'src.portfolio': {
            'handlers': ['file'],
            'level': 'ERROR',
            'propagate': False,
        },
    },
}

# ============================================
# 📊 Performance Optimizations
# ============================================

# Template caching
TEMPLATES[0]['OPTIONS']['loaders'] = [
    ('django.template.loaders.cached.Loader', [
        'django.template.loaders.filesystem.Loader',
        'django.template.loaders.app_directories.Loader',
    ]),
]

# Static files with whitenoise
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# ============================================
# 🔐 Admin Panel Security
# ============================================

# اگر می‌خواهید URL پنل ادمین را تغییر دهید (توصیه می‌شود)
# در urls.py مسیر admin/ را تغییر دهید به:
# path('secure-admin-panel/', admin.site.urls)

# ============================================
# 📧 Email Settings
# ============================================

# در production باید از SMTP واقعی استفاده کنید
# همه تنظیمات از base.py و .env می‌آیند
# فقط مطمئن شوید که:
# - EMAIL_BACKEND صحیح است
# - EMAIL_HOST_USER و EMAIL_HOST_PASSWORD درست تنظیم شده‌اند

# ============================================
# 🚨 Security Warnings Check
# ============================================

# برای چک کردن تمام تنظیمات امنیتی قبل از deploy:
# python manage.py check --deploy

# ============================================
# 💡 Additional Production Settings
# ============================================

# Session Engine برای performance بهتر
SESSION_ENGINE = 'django.contrib.sessions.backends.cached_db'
SESSION_CACHE_ALIAS = 'session'

# CSRF Trusted Origins
CSRF_TRUSTED_ORIGINS = env('CSRF_TRUSTED_ORIGINS', default='').split(',')

# Rate Limiting - محدودتر از development
REST_FRAMEWORK['DEFAULT_THROTTLE_RATES'] = {
    'anon': '50/hour',          # کاهش از 100 به 50
    'user': '500/hour',         # کاهش از 1000 به 500
    'admin_login': '3/min',     # همان
    'user_login': '5/min',      # همان
    'captcha': '10/min',        # همان
    'failed_login': '5/hour',   # کاهش از 10 به 5
    'security': '10/hour',      # کاهش از 20 به 10
}

# ============================================
# 📌 NOTES FOR DEPLOYMENT
# ============================================
"""
برای deploy کردن این تنظیمات:

1. فایل .env.production را به .env تغییر نام دهید

2. متغیر محیطی تنظیم کنید:
   export DJANGO_SETTINGS_MODULE=config.django.production

3. SECRET_KEY جدید بسازید:
   python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"

4. Migration ها را اجرا کنید:
   python manage.py migrate

5. Static files جمع‌آوری کنید:
   python manage.py collectstatic --noinput

6. چک امنیتی انجام دهید:
   python manage.py check --deploy

7. پوشه logs بسازید:
   mkdir logs

8. اجرا با gunicorn:
   gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 4

9. Nginx/Apache را برای HTTPS تنظیم کنید

10. Let's Encrypt برای SSL certificate رایگان

"""
