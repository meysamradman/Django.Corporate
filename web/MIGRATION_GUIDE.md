# راهنمای اجرای Migration

اگر خطای زیر را دریافت کردید:

```
ProgrammingError: relation "ticket_ticket" does not exist
```

این یعنی جدول تیکت در دیتابیس وجود ندارد و باید migration ها را اجرا کنید.

## راه حل

1. به فولدر Backend بروید:
```bash
cd Backend
```

2. Migration ها را اجرا کنید:
```bash
python manage.py migrate
```

یا اگر از virtual environment استفاده می‌کنید:

```bash
.venv\Scripts\activate  # Windows
# یا
source .venv/bin/activate  # Linux/Mac

python manage.py migrate
```

3. اگر migration های جدید وجود دارد، آنها را ایجاد کنید:
```bash
python manage.py makemigrations
python manage.py migrate
```

## بررسی Migration های اجرا شده

برای دیدن لیست migration های اجرا شده:

```bash
python manage.py showmigrations ticket
```

اگر migration های اجرا نشده می‌بینید، باید آنها را اجرا کنید.

## مشکلات احتمالی

### اگر خطای "No such app" دریافت کردید:
مطمئن شوید که app در `INSTALLED_APPS` در فایل `config/django/base.py` وجود دارد.

### اگر خطای دیتابیس دریافت کردید:
مطمئن شوید که:
1. دیتابیس درست تنظیم شده است
2. کاربر دیتابیس دسترسی دارد
3. دیتابیس ایجاد شده است

## بعد از Migration

بعد از اجرای migration ها، سرویس را restart کنید و دوباره تست کنید.

