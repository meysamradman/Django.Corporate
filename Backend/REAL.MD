
ببین بکو نگاه کن اپ یوزرو و پرمیژن رو ببین
الان پنل ادمین در فولدر admin هم ببین وبک اند در فولدر backend


امنیت مهمه و برای ورود ما secret برای تعییر ادرس گزاشتیم اما برای مپنچا نزاشتی برای ورود درسته و خوبه؟
امنیت مهم فولدر config و environment.ts کلا ببین برای پنل ادمین Env :
VITE_API_URL=http://localhost:8000/api
VITE_MEDIA_BASE_URL=http://localhost:8000


env : بک اندو در REAL.MD نوشتم

الان ورود وقتی وارد میکنیم وارد نمیشه و هیچ کار انجام نمیده ارور رو در REAL.MD نوشتم

مشکلات رو در فایل REAL.MD نوشتم بخون دقیق انجام بدی

باید درستو دقیق باشه و url بک اند در فرانت ننویسیم در environment.ts از Env بخونه و secret درست باشه

WARNING 2026-01-03 17:50:31,528 log Unauthorized: /api/admin/permissions/map/
WARNING 2026-01-03 17:50:31,530 log "GET /api/admin/permissions/map/ HTTP/1.1" 401 121
INFO 2026-01-03 17:50:31,547 log "GET /api/admin/auth/captcha/generate/ HTTP/1.1" 200 225
INFO 2026-01-03 17:50:31,604 log "GET /api/mobile/otp-settings/ HTTP/1.1" 200 185
WARNING 2026-01-03 17:50:42,804 log Unauthorized: /api/admin/auth/login/
WARNING 2026-01-03 17:50:42,804 log "POST /api/admin/auth/login/ HTTP/1.1" 401 121




# Django Settings
DEBUG=True
SECRET_KEY=django-insecure-4)%1^@0c4(hj5(zf_7z8_c$u_no$^3j-1nq@g=z7&l!9q$8p%z
ALLOWED_HOSTS=localhost,127.0.0.1

# Database Settings
DATABASE_URL=postgresql://postgres:1047@127.0.0.1:5432/realestate

# Redis Settings
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# Melipayamak SMS API Settings
MELIPAYAMAK_API_URL=https://console.melipayamak.com/api/send/advanced/c8f6a7d2b82c4901b0a0fd889235d3b9
MELIPAYAMAK_BODY_ID=62772
MELIPAYAMAK_API_KEY=c8f6a7d2b82c4901b0a0fd889235d3b9

# Application settings
SITE_URL=http://localhost:8000

# Session Settings
ADMIN_SESSION_TIMEOUT_DAYS=3

# JWT Settings for Regular Users
USER_ACCESS_TOKEN_LIFETIME_DAYS=1
USER_REFRESH_TOKEN_LIFETIME_DAYS=15

# Cache Settings
DEFAULT_CACHE_TIMEOUT_SECONDS=900

# Media Settings
MEDIA_IMAGE_SIZE_LIMIT=1000000
MEDIA_VIDEO_SIZE_LIMIT=157286400
MEDIA_AUDIO_SIZE_LIMIT=20971520
MEDIA_PDF_SIZE_LIMIT=10485760

MEDIA_IMAGE_EXTENSIONS=jpg,jpeg,webp,png,svg,gif
MEDIA_VIDEO_EXTENSIONS=mp4,webm
MEDIA_PDF_EXTENSIONS=pdf
MEDIA_AUDIO_EXTENSIONS=mp3,ogg,aac,m4a

# Disable OTP Simulator (we want real SMS)
USE_OTP_SIMULATOR=True

# CAPTCHA Settings
CAPTCHA_EXPIRY_SECONDS=300
CAPTCHA_LENGTH=4
CAPTCHA_REDIS_PREFIX=captcha:

# Portfolio Export Settings
PORTFOLIO_EXPORT_MAX_ITEMS=150
PORTFOLIO_EXPORT_PRINT_MAX_ITEMS=2000
PORTFOLIO_EXPORT_PAGE_SIZE=50
PORTFOLIO_EXPORT_RATE_LIMIT=15
PORTFOLIO_EXPORT_RATE_LIMIT_WINDOW=3600

# Portfolio Media Settings
PORTFOLIO_MEDIA_LIST_LIMIT=3
PORTFOLIO_MEDIA_DETAIL_LIMIT=20
PORTFOLIO_MEDIA_UPLOAD_MAX=25

# Blog Export Settings
BLOG_EXPORT_MAX_ITEMS=500
BLOG_EXPORT_PRINT_MAX_ITEMS=2000
BLOG_EXPORT_PAGE_SIZE=50
BLOG_EXPORT_RATE_LIMIT=10
BLOG_EXPORT_RATE_LIMIT_WINDOW=3600

# Blog Media Settings
BLOG_MEDIA_LIST_LIMIT=5
BLOG_MEDIA_DETAIL_LIMIT=0
BLOG_MEDIA_UPLOAD_MAX=50

# Real Estate Export Settings
REAL_ESTATE_EXPORT_MAX_ITEMS=500
REAL_ESTATE_EXPORT_PRINT_MAX_ITEMS=2000
REAL_ESTATE_EXPORT_PAGE_SIZE=50
REAL_ESTATE_EXPORT_RATE_LIMIT=10
REAL_ESTATE_EXPORT_RATE_LIMIT_WINDOW=3600

# Real Estate Media Settings
REAL_ESTATE_MEDIA_LIST_LIMIT=5
REAL_ESTATE_MEDIA_DETAIL_LIMIT=0
REAL_ESTATE_MEDIA_UPLOAD_MAX=50



# تنظیمات SMTP برای ارسال ایمیل - Mailtrap Email Testing
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=sandbox.smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USE_TLS=True
EMAIL_USE_SSL=False
EMAIL_HOST_USER=5e28e60400bef3
EMAIL_HOST_PASSWORD=7e82a951772099
DEFAULT_FROM_EMAIL=شرکت ما <noreply@corporate.local>