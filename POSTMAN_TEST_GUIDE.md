# راهنمای تست Media Upload با Postman

## 📋 پیش‌نیازها

1. سرور Django باید در حال اجرا باشد (`python manage.py runserver`)
2. باید یک admin user داشته باشید و لاگین کرده باشید
3. Session cookie را از مرورگر کپی کنید

---

## 🔍 مرحله 1: بررسی تنظیمات از `.env`

### Endpoint: `GET /api/core/upload-settings/`

**درخواست:**
```
GET http://localhost:8000/api/core/upload-settings/
```

**بدون نیاز به Authentication** (permission_classes = AllowAny)

**پاسخ موفق:**
```json
{
  "status": "success",
  "message": "Media upload settings retrieved successfully",
  "data": {
    "MEDIA_IMAGE_SIZE_LIMIT": 5242880,        // 5MB (از .env)
    "MEDIA_VIDEO_SIZE_LIMIT": 157286400,      // 150MB (از .env)
    "MEDIA_AUDIO_SIZE_LIMIT": 20971520,       // 20MB (از .env)
    "MEDIA_DOCUMENT_SIZE_LIMIT": 10485760,    // 10MB (از .env)
    "MEDIA_ALLOWED_IMAGE_EXTENSIONS": ["jpg", "jpeg", "webp", "png", "svg", "gif"],
    "MEDIA_ALLOWED_VIDEO_EXTENSIONS": ["mp4", "webm", "mov"],
    "MEDIA_ALLOWED_AUDIO_EXTENSIONS": ["mp3", "ogg"],
    "MEDIA_ALLOWED_PDF_EXTENSIONS": ["pdf"]
  }
}
```

**✅ بررسی:**
- مقادیر باید با `.env` شما مطابقت داشته باشد
- اگر در `.env` تنظیم نکرده‌اید، مقادیر پیش‌فرض نمایش داده می‌شود

---

## 🔐 مرحله 2: لاگین و دریافت Session Cookie

### Endpoint: `POST /api/admin/auth/login/`

**درخواست:**
```
POST http://localhost:8000/api/admin/auth/login/
Content-Type: application/json

{
  "username": "your_admin_username",
  "password": "your_password"
}
```

**پاسخ موفق:**
- در Headers پاسخ، `Set-Cookie` را پیدا کنید
- Cookie را کپی کنید (مثلاً: `sessionid=abc123...`)

**در Postman:**
1. به تب **Cookies** بروید
2. یا در Headers، `Cookie` را اضافه کنید: `Cookie: sessionid=abc123...`

---

## 📤 مرحله 3: تست آپلود Media

### Endpoint: `POST /api/admin/media/`

**URL:** `http://localhost:8000/api/admin/media/`

**Method:** `POST`

**Headers:**
```
Cookie: sessionid=your_session_id_here
X-CSRFToken: your_csrf_token_here  (اگر نیاز باشد)
```

**Body:** (Form-data)
- Key: `file` (Type: File)
- Value: فایل مورد نظر را انتخاب کنید

---

## 🧪 تست‌های مختلف

### ✅ تست 1: فایل معتبر (تصویر کوچک)

**فایل:** یک تصویر `.jpg` یا `.png` با حجم کمتر از 5MB

**انتظار:** 
- Status: `201 Created`
- پیام موفقیت

---

### ❌ تست 2: فایل با حجم بیش از حد مجاز

**فایل:** یک تصویر با حجم بیشتر از مقدار `MEDIA_IMAGE_SIZE_LIMIT` (مثلاً 6MB)

**انتظار:**
- Status: `400 Bad Request`
- پیام خطا: `"Image too large. Max: 5.0 MB"` یا مشابه

**مثال:**
- اگر `MEDIA_IMAGE_SIZE_LIMIT = 5242880` (5MB)
- فایلی با حجم `6 * 1024 * 1024 = 6291456` بفرستید

---

### ❌ تست 3: فایل با پسوند غیرمجاز

**فایل:** یک فایل با پسوند غیرمجاز (مثلاً `.bmp` برای تصویر)

**انتظار:**
- Status: `400 Bad Request`
- پیام خطا: `"Invalid image extension. Allowed: jpg, jpeg, webp, png, svg, gif"`

**مثال‌های پسوند غیرمجاز:**
- تصویر: `.bmp`, `.tiff`, `.ico`
- ویدیو: `.avi`, `.mkv`, `.flv`
- صوتی: `.wav`, `.aac`, `.m4a`
- سند: `.doc`, `.docx`, `.txt`

---

### ✅ تست 4: ویدیو معتبر

**فایل:** یک ویدیو `.mp4` با حجم کمتر از 150MB

**انتظار:**
- Status: `201 Created`
- پیام موفقیت

---

### ❌ تست 5: ویدیو با حجم بیش از حد

**فایل:** یک ویدیو `.mp4` با حجم بیشتر از `MEDIA_VIDEO_SIZE_LIMIT` (مثلاً 160MB)

**انتظار:**
- Status: `400 Bad Request`
- پیام خطا: `"Video file size exceeds maximum allowed size..."`

---

### ✅ تست 6: فایل صوتی معتبر

**فایل:** یک فایل صوتی `.mp3` یا `.ogg` با حجم کمتر از 20MB

**انتظار:**
- Status: `201 Created`

---

### ✅ تست 7: فایل PDF معتبر

**فایل:** یک فایل `.pdf` با حجم کمتر از 10MB

**انتظار:**
- Status: `201 Created`

---

## 🔧 تغییر تنظیمات در `.env` برای تست

در فایل `.env` خود این مقادیر را تغییر دهید:

```env
# حجم فایل‌ها (بر حسب بایت)
MEDIA_IMAGE_SIZE_LIMIT=10485760      # 10MB (به جای 5MB)
MEDIA_VIDEO_SIZE_LIMIT=314572800      # 300MB (به جای 150MB)
MEDIA_AUDIO_SIZE_LIMIT=41943040      # 40MB (به جای 20MB)
MEDIA_PDF_SIZE_LIMIT=20971520        # 20MB (به جای 10MB)

# پسوندهای مجاز
MEDIA_IMAGE_EXTENSIONS=jpg,jpeg,webp,png,svg,gif,bmp
MEDIA_VIDEO_EXTENSIONS=mp4,webm,mov,avi
MEDIA_AUDIO_EXTENSIONS=mp3,ogg,wav
MEDIA_PDF_EXTENSIONS=pdf
```

**⚠️ مهم:** بعد از تغییر `.env`:
1. سرور Django را restart کنید
2. Cache را پاک کنید (یا 1 ساعت صبر کنید)
3. دوباره `/api/core/upload-settings/` را تست کنید تا ببینید مقادیر جدید هستند

---

## 📝 مثال کامل در Postman

### Collection Setup:

1. **Environment Variables:**
   - `base_url`: `http://localhost:8000`
   - `session_id`: (بعد از لاگین)

2. **Request 1: Get Settings**
   ```
   GET {{base_url}}/api/core/upload-settings/
   ```

3. **Request 2: Login**
   ```
   POST {{base_url}}/api/admin/auth/login/
   Body (JSON):
   {
     "username": "admin",
     "password": "password123"
   }
   ```
   - در Tests tab: `pm.environment.set("session_id", pm.cookies.get("sessionid"));`

4. **Request 3: Upload Valid Image**
   ```
   POST {{base_url}}/api/admin/media/
   Headers:
   Cookie: sessionid={{session_id}}
   Body (form-data):
   file: [انتخاب فایل]
   ```

5. **Request 4: Upload Large Image (Should Fail)**
   ```
   POST {{base_url}}/api/admin/media/
   Headers:
   Cookie: sessionid={{session_id}}
   Body (form-data):
   file: [انتخاب فایل بزرگتر از حد مجاز]
   ```

---

## ✅ چک‌لیست بررسی

- [ ] `/api/core/upload-settings/` مقادیر را از `.env` برمی‌گرداند
- [ ] فایل معتبر با موفقیت آپلود می‌شود
- [ ] فایل با حجم بیش از حد رد می‌شود
- [ ] فایل با پسوند غیرمجاز رد می‌شود
- [ ] بعد از تغییر `.env` و restart، مقادیر جدید اعمال می‌شود
- [ ] پیام‌های خطا واضح و قابل فهم هستند

---

## 🐛 Debugging

اگر مشکلی پیش آمد:

1. **لاگ‌های Django را بررسی کنید:**
   ```bash
   python manage.py runserver --verbosity 2
   ```

2. **Cache را پاک کنید:**
   ```python
   # در Django shell
   from django.core.cache import cache
   cache.delete('media_upload_settings')
   ```

3. **مقادیر settings را مستقیماً بررسی کنید:**
   ```python
   # در Django shell
   from django.conf import settings
   print(settings.MEDIA_FILE_SIZE_LIMITS)
   print(settings.MEDIA_ALLOWED_EXTENSIONS)
   ```

