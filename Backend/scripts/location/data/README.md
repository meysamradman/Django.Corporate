# Local Location Data

این پوشه منبع اصلی داده‌های لوکیشن برای اسکریپت‌های بک‌اند است.

## فایل‌ها

- `iran_provinces_cities.fa_en.json`
  - شامل 31 استان و شهرهای ایران
  - فیلدهای اصلی: `code`, `name_fa`, `slug_en`, `cities[]`
  - هر شهر: `name_fa`, `slug_en`

- `iran_city_regions.fa_en.json`
  - تنظیمات مناطق شهرها
  - `tehran_only`: حالت امن پیش‌فرض
  - `major_cities`: حالت توسعه‌ای با `--include-major-cities`

- `iran_slug_overrides.json`
  - اصلاح دستی اسلاگ‌های انگلیسی مشکل‌دار
  - `provinces`: نگاشت نام استان فارسی → slug انگلیسی
  - `cities`: نگاشت عمومی نام شهر فارسی → slug انگلیسی
  - `cities_scoped`: نگاشت دقیق با کلید `استان::شهر` (اولویت بالاتر)

- `iran_location_coordinates.fa_en.json`
  - مختصات استان‌ها و شهرهای شاخص
  - منبع اسکریپت `populate_location_coordinates.py`

## نحوه استفاده

- ایمپورت استان/شهر از فایل محلی:
  - `python scripts/location/import_iranian_locations.py --app real_estate --slug-language en`
  - `python scripts/location/import_iranian_locations.py --app real_estate --slug-language fa`
  - `python scripts/location/import_iranian_locations.py --app real_estate --slug-language en --cleanup-stale`

- اجرای کامل لوکیشن (استان، شهر، منطقه، مختصات):
  - `python scripts/location/populate_real_estate_locations.py --slug-language en`
  - `python scripts/location/populate_real_estate_locations.py --slug-language fa`
  - `python scripts/location/populate_real_estate_locations.py --slug-language en --cleanup-stale`

## نکته مهم

برای اضافه/کم کردن استان، شهر یا منطقه، همین فایل‌های JSON را ویرایش کنید.
برای اصلاح اسلاگ‌های خاص (مثل `شباب -> shabab`) از `iran_slug_overrides.json` استفاده کنید.
برای مختصات هم فقط `iran_location_coordinates.fa_en.json` را ویرایش کنید.

اسلاگ در دیتابیس تک‌مقداری است؛ بنابراین در هر اجرا فقط یکی از حالت‌های `fa` یا `en` اعمال می‌شود.
در حالت `--cleanup-stale` رکوردهای خارج از دیتافایل حذف می‌شوند؛ اگر وابستگی داشته باشند، غیرفعال می‌شوند.
