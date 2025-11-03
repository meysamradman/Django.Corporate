# فونت‌های PDF

برای استفاده از فونت سفارشی در PDF export، فایل فونت فارسی خود را در این پوشه قرار دهید.

## نام‌های پیشنهادی برای فایل فونت (اولویت):
1. `IRANSansXV.ttf` یا `IRANSansXV.otf` - **اولویت اول** (فونت فارسی IRANSans)
   - فایل فعلی: `IRANSansXV.woff2` (نیاز به تبدیل به TTF/OTF)
   - **نکته:** reportlab از woff2 پشتیبانی نمی‌کند. نیاز به فایل `.ttf` یا `.otf` دارید.
2. `Vazir.ttf` - (فونت فارسی رایگان و حرفه‌ای)
   - دانلود: https://github.com/rastikerdar/vazir-font/releases
3. `persian.ttf`
4. `Tahoma.ttf`

## نحوه اضافه کردن فونت:

1. فایل فونت فارسی (با پسوند `.ttf`) را در این پوشه قرار دهید
2. نام فایل باید یکی از نام‌های بالا باشد
3. در صورت وجود چند فایل، اولویت با `Vazir.ttf` است

## دانلود فونت Vazir:
```bash
# دانلود از GitHub
wget https://github.com/rastikerdar/vazir-font/releases/download/v30.1.0/Vazir.ttf -O static/fonts/Vazir.ttf
```

## نکات:
- اگر فونت سفارشی موجود نباشد، سیستم از فونت‌های سیستم (Tahoma, Arial) استفاده می‌کند
- **فونت باید از نوع TTF یا OTF باشد** - woff2 پشتیبانی نمی‌شود
- فونت باید از زبان فارسی/عربی پشتیبانی کند
- اولویت با `IRANSansXV.ttf` یا `IRANSansXV.otf` است

## تبدیل woff2 به TTF (اگر نیاز دارید):
اگر فایل `IRANSansXV.woff2` دارید و می‌خواهید به TTF تبدیل کنید، می‌توانید از ابزارهای آنلاین استفاده کنید:
- https://cloudconvert.com/woff2-to-ttf
- یا از `woff2_decompress` (ابزار command line) استفاده کنید

