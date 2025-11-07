# راهنمای تنظیمات ایمیل

## 📧 تنظیمات .env

برای استفاده از سیستم ایمیل، این تنظیمات را به فایل `.env` اضافه کنید:

```env
# ============================================
# Email Settings (برای ارسال و دریافت ایمیل)
# ============================================

# تنظیمات SMTP برای ارسال ایمیل
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_USE_SSL=False
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=your-email@gmail.com
```

## 🔐 نحوه دریافت App Password برای Gmail

1. به [Google Account Settings](https://myaccount.google.com/) بروید
2. Security > 2-Step Verification را فعال کنید
3. App Passwords > Select app > Mail > Select device > Generate
4. رمز 16 رقمی را کپی کنید و در `EMAIL_HOST_PASSWORD` قرار دهید

## 📥 تنظیمات دریافت ایمیل از IMAP

### 1. ایجاد Mailbox در Admin Panel

1. به `http://localhost:8000/admin/django_mailbox/mailbox/` بروید
2. روی "Add Mailbox" کلیک کنید
3. فرم را پر کنید:
   - **Name**: Info Inbox (یا هر نامی که می‌خواهید)
   - **URI**: `imap+ssl://your-email@gmail.com:your-app-password@imap.gmail.com:993`
   - **Active**: ✓ (تیک بزنید)
4. Save کنید

### 2. فرمت URI برای سرویس‌های مختلف

**Gmail:**
```
imap+ssl://your-email@gmail.com:your-app-password@imap.gmail.com:993
```

**Outlook/Hotmail:**
```
imap+ssl://your-email@outlook.com:your-password@imap-mail.outlook.com:993
```

**Yahoo:**
```
imap+ssl://your-email@yahoo.com:your-app-password@imap.mail.yahoo.com:993
```

### 3. دریافت خودکار ایمیل‌ها (Cron Job)

برای دریافت خودکار ایمیل‌ها هر دقیقه:

**Linux/Mac:**
```bash
# ویرایش crontab
crontab -e

# اضافه کردن این خط
* * * * * cd /path/to/project/Backend && python manage.py getmail >> /var/log/mail.log 2>&1
```

**Windows (Task Scheduler):**
1. Task Scheduler را باز کنید
2. Create Basic Task
3. Trigger: Daily (یا هر زمانی که می‌خواهید)
4. Action: Start a program
5. Program: `python`
6. Arguments: `manage.py getmail`
7. Start in: `C:\path\to\project\Backend`

## ✅ بررسی تنظیمات

بعد از تنظیم، این دستورات را اجرا کنید:

```bash
# Migration برای django-mailbox و post_office
python manage.py migrate django_mailbox
python manage.py migrate post_office

# تست ارسال ایمیل (در Django shell)
python manage.py shell
```

```python
from django.core.mail import send_mail
from django.conf import settings

send_mail(
    subject='Test Email',
    message='This is a test email',
    from_email=settings.DEFAULT_FROM_EMAIL,
    recipient_list=['test@example.com'],
    fail_silently=False,
)
```

## 🔍 عیب‌یابی

### مشکل: ایمیل ارسال نمی‌شود
- بررسی کنید که `EMAIL_HOST_USER` و `EMAIL_HOST_PASSWORD` درست هستند
- برای Gmail، حتماً از App Password استفاده کنید (نه رمز اصلی)
- بررسی کنید که 2-Step Verification فعال است

### مشکل: ایمیل دریافت نمی‌شود
- بررسی کنید که Mailbox در Admin Panel فعال است
- URI را دوباره بررسی کنید
- دستور `python manage.py getmail` را به صورت دستی اجرا کنید و خطاها را ببینید

### مشکل: Signal کار نمی‌کند
- بررسی کنید که `src.email.signals` در `apps.py` import شده است
- بررسی کنید که `src.email.admin` هم import شده است

## 📚 مستندات بیشتر

- [django-mailbox Documentation](https://github.com/coddingtonbear/django-mailbox)
- [django-post-office Documentation](https://github.com/ui/django-post_office)

