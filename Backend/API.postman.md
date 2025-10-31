## مستندات Postman-ready برای تمام اپ‌ها (CSR Admin Panel)

Base URL: `http://localhost:8000/api/`

احراز هویت:
- پنل ادمین: Session Cookie (مثلاً `admin_session_id`) + CSRF
- کاربران وب‌سایت: JWT (در صورت استفاده در اپ یوزر)

نکته: تمام لیست‌ها از pagination استاندارد پروژه استفاده می‌کنند. همه پاسخ‌ها در فرمت استاندارد `APIResponse` یا پاسخ DRF با pagination هستند.

استاندارد Pagination و Query Params مشترک برای همه لیست‌ها:
- limit: تعداد آیتم‌ها در هر صفحه (پیش‌فرض 10، حداکثر 50)
- offset: جابجایی از ابتدای لیست برای صفحه‌بندی (0، 10، 20، ...)
- search: رشته جستجو در فیلدهای مشخص هر ریسورس (در صورت پشتیبانی)
- ordering: مرتب‌سازی بر اساس فیلدهای مجاز هر ریسورس (مثال: `ordering=-created_at`)

فرمت پاسخ صفحه‌بندی‌شده (Renderer سفارشی `APIResponse`):
```json
{
  "metaData": {"status": "success", "message": "Request successful", "AppStatusCode": 200, "timestamp": "..."},
  "pagination": {
    "count": 123,
    "next": "http://.../api/.../?limit=10&offset=10",
    "previous": null,
    "page_size": 10,
    "current_page": 1,
    "total_pages": 13
  },
  "data": [ ... ]
}
```

---

### Core

1) دریافت تنظیمات آپلود
- GET http://localhost:8000/api/core/upload-settings/

2) دریافت CSRF Token
- GET http://localhost:8000/api/core/csrf-token/

3) کپچا (برای ادمین لاگین)
- POST http://localhost:8000/api/admin/auth/captcha/generate/
- POST http://localhost:8000/api/admin/auth/captcha/verify/
Raw JSON نمونه:
```json
{
  "captcha_key": "string",
  "captcha_value": "string"
}
```

---

### User

Routes file: `src/user/urls.py

1) ثبت‌نام ادمین (فقط ادمین‌های مجاز در پنل)
- POST http://localhost:8000/api/admin/register/
- Multipart یا JSON. Raw JSON پیشنهادی (بر اساس `AdminRegisterSerializer`):
```json
{
  "mobile": "09xxxxxxxxx",
  "email": "admin@example.com",
  "password": "StrongPass123",
  "is_superuser": false,
  "user_type": "admin",
  "role_id": 2,
  "profile": {
    "first_name": "Ali",
    "last_name": "Ahmadi",
    "birth_date": "1995-01-01",
    "national_id": "0012345678",
    "address": "Tehran...",
    "phone": "02112345678",
    "department": "Content",
    "position": "Editor",
    "bio": "...",
    "notes": "...",
    "province_id": 1,
    "city_id": 10,
    "profile_picture_id": 15
  }
}
```

2) ورود ادمین
- POST http://localhost:8000/api/admin/login/
Raw JSON (بر اساس AdminLoginSerializer):
```json
{
  "mobile": "09124707989",
  "password": "admin123",
  "captcha_id": "12a3b30bd80c4a0fb9a62f0f56aef5a5",
  "captcha_answer": "2276",
  "otp_code": "123456"
}
```

3) خروج ادمین
- POST http://localhost:8000/api/admin/logout/

4) پروفایل ادمین (نمایش/ویرایش)
- GET http://localhost:8000/api/admin/profile/
- PUT/PATCH http://localhost:8000/api/admin/profile/
```json
{
  "first_name": "Ali",
  "last_name": "Ahmadi",
  "birth_date": "1995-01-01",
  "province_id": 1,
  "city_id": 10,
  "profile_picture_id": 15,
  "bio": "..."
}
``

5) مدیریت ادمین‌ها (CRUD + جزئیات)
- GET http://localhost:8000/api/admin/management/` (لیست)
- POST http://localhost:8000/api/admin/management/` (ایجاد؛ بدنه مشابه ثبت‌نام ادمین)
- GET http://localhost:8000/api/admin/management/{admin_id}/` (جزئیات)
- PUT/PATCH http://localhost:8000/api/admin/management/{admin_id}/` (ویرایش)
- DELETE http://localhost:8000/api/admin/management/{admin_id}/` (حذف)
- POST http://localhost:8000/api/admin/management/bulk-delete/
```json
{
  "ids": [2, 5, 9]
}
``
- GET http://localhost:8000/api/admin/management/by-public-id/{public_uuid}/

6) مدیریت کاربران معمولی توسط ادمین
- GET http://localhost:8000/api/admin/users-management/
- POST http://localhost:8000/api/admin/users-management/` (بر اساس `AdminCreateRegularUserSerializer`)
```json
{
  "identifier": "user@example.com or 09xxxxxxxxx",
  "password": "Pass1234",
  "email": "user@example.com",
  "profile": {
    "first_name": "Sara",
    "last_name": "Karimi",
    "province_id": 1,
    "city_id": 10,
    "profile_picture_id": 25
  }
}
``
- GET http://localhost:8000/api/admin/users-management/{user_id}/
- PUT/PATCH http://localhost:8000/api/admin/users-management/{user_id}/
- DELETE http://localhost:8000/api/admin/users-management/{user_id}/
- POST http://localhost:8000/api/admin/users-management/bulk-delete/
```json
{
  "ids": [3, 4, 7]
}
``

7) نقش‌ها و پرمیژن‌های ادمین (ViewSets)
- Roles
  - GET http://localhost:8000/api/admin/roles/
  - POST http://localhost:8000/api/admin/roles/
  - GET http://localhost:8000/api/admin/roles/{id}/
  - PUT/PATCH http://localhost:8000/api/admin/roles/{id}/
  - DELETE http://localhost:8000/api/admin/roles/{id}/
  - POST http://localhost:8000/api/admin/roles/bulk-delete/
  ```json
  { "ids": [1,2,3] }
  ``
- Permissions
  - مشابه roles روی مسیر http://localhost:8000/api/admin/permissions/

8) کاربران معمولی (JWT)
- POST http://localhost:8000/api/user/register/
- POST http://localhost:8000/api/user/login/
- POST http://localhost:8000/api/user/logout/
- GET http://localhost:8000/api/user/profile/
- POST http://localhost:8000/api/token/refresh/

9) OTP
- POST http://localhost:8000/api/mobile/send-otp/
```json
{ "mobile": "09xxxxxxxxx" }
``
- POST http://localhost:8000/api/mobile/verify-otp/
```json
{ "mobile": "09xxxxxxxxx", "code": "123456" }
``
- GET http://localhost:8000/api/mobile/otp-settings/

10) مکان‌ها (عمومی برای همه احراز هویت‌شده‌ها)
- Provinces (ReadOnly)
  - GET http://localhost:8000/api/provinces/
  - GET http://localhost:8000/api/provinces/{id}/
- Cities (ReadOnly)
  - GET http://localhost:8000/api/cities/
  - GET http://localhost:8000/api/cities/{id}/

---

### Media (اپ مدیا مرکزی)

Routes: `src/media/urls.py

1) Admin Media (CRUD + bulk)
- GET http://localhost:8000/api/admin/media/
- Query params:
  - title: جستجو بر اساس عنوان (icontains)
  - is_active: فیلتر وضعیت فعال (true/false)
  - type: نوع مدیا برای فهرست تجمیعی از طریق مسیرهای تفکیک‌شده (در لیست اصلی از همه مدل‌ها تجمیع می‌شود)
  - limit, offset, ordering (ordering پشتیبانی‌شده: created_at | -created_at)
- POST http://localhost:8000/api/admin/media/` (multipart)
  - فیلدها: `file` (ضروری)، `title` (اختیاری)، `alt_text` (اختیاری)
  - برای ویدئو می‌توانید `cover_image` نیز multipart ارسال کنید
- GET http://localhost:8000/api/admin/media/{id}/
- PUT/PATCH http://localhost:8000/api/admin/media/{id}/
```json
{
  "title": "New title",
  "alt_text": "Alt"
}
``
- DELETE http://localhost:8000/api/admin/media/{id}/

- POST http://localhost:8000/api/admin/media/bulk-delete
```json
{
  "media_data": [
    {"id": 12, "type": "image"},
    {"id": 35, "type": "video"}
  ]
}
``

2) Public Media (ReadOnly)
- GET http://localhost:8000/api/media/
- Query params:
  - title: جستجو بر اساس عنوان (icontains)
  - is_active: فیلتر وضعیت فعال (true/false)
  - limit, offset, ordering (ordering پشتیبانی‌شده: created_at | -created_at)
- GET http://localhost:8000/api/media/{public_id}/?type=image|video|audio|pdf
- GET http://localhost:8000/api/media/by_type/?type=image&is_active=true

---

### Portfolio

Routes: `src/portfolio/urls.py

1) Portfolio (Admin)
- GET http://localhost:8000/api/admin/portfolio/` (جستجو/فیلتر/مرتب‌سازی پشتیبانی می‌شود)
- Query params:
  - search: جستجو در `title, short_description, description, meta_title, meta_description, slug, categories__name, tags__name`
  - status: یکی از مقادیر `STATUS_CHOICES`
  - is_featured: true/false
  - is_public: true/false
  - is_active: true/false
  - created_after: تاریخ >= (YYYY-MM-DD)
  - created_before: تاریخ <= (YYYY-MM-DD)
  - category: شناسه دسته
  - category_slug: اسلاگ دسته
  - tag: شناسه تگ
  - tag_slug: اسلاگ تگ
  - categories__in: لیست شناسه‌های دسته به‌صورت comma-separated (مثال: 1,2,3)
  - seo_status: یکی از `complete | incomplete | missing`
  - has_meta_title: true/false (داشتن مقدار)
  - has_meta_description: true/false (داشتن مقدار)
  - has_og_image: true/false (داشتن مقدار)
  - has_canonical_url: true/false (داشتن مقدار)
  - has_main_image: true/false
  - media_count: عدد دقیق تعداد مدیا
  - media_count_gte: حداقل تعداد مدیا
  - ordering: یکی از `created_at, -created_at, updated_at, -updated_at, title, -title, status, -status`
  - limit, offset
- POST http://localhost:8000/api/admin/portfolio/` (multipart یا JSON + فایل‌ها در `media_files[]`)
Raw JSON (بر اساس `PortfolioAdminCreateSerializer`):
```json
{
  "title": "My Project",
  "slug": "my-project",
  "short_description": "short...",
  "description": "long...",
  "status": "draft",
  "is_featured": false,
  "is_public": true,
  "meta_title": "...",
  "meta_description": "...",
  "og_title": "...",
  "og_description": "...",
  "canonical_url": "https://example.com/portfolio/my-project",
  "robots_meta": "index,follow",
  "categories_ids": [1,2],
  "tags_ids": [5,7]
}
``
- GET http://localhost:8000/api/admin/portfolio/{id}/
- PUT/PATCH http://localhost:8000/api/admin/portfolio/{id}/` (بر اساس `PortfolioAdminUpdateSerializer`)
```json
{
  "title": "Updated title",
  "short_description": "...",
  "description": "...",
  "status": "published",
  "is_featured": true,
  "is_public": true,
  "meta_title": "...",
  "meta_description": "...",
  "og_title": "...",
  "og_description": "...",
  "og_image": 18,
  "canonical_url": "https://example.com/portfolio/my-project",
  "robots_meta": "index,follow",
  "categories_ids": [1,2],
  "tags_ids": [5,7]
}
``
- DELETE http://localhost:8000/api/admin/portfolio/{id}/

Actions:
- POST http://localhost:8000/api/admin/portfolio/{id}/change_status/
```json
{ "status": "published" }
``
- POST http://localhost:8000/api/admin/portfolio/{id}/publish/
- POST http://localhost:8000/api/admin/portfolio/bulk_update_status/
```json
{ "portfolio_ids": [1,2,3], "status": "draft" }
``
- POST http://localhost:8000/api/admin/portfolio/bulk_generate_seo/
```json
{ "portfolio_ids": [1,2,3] }
``
- POST http://localhost:8000/api/admin/portfolio/{id}/generate_seo/
- GET http://localhost:8000/api/admin/portfolio/{id}/validate_seo/
- POST http://localhost:8000/api/admin/portfolio/{id}/add_media/` (multipart یا JSON)
```json
{ "media_ids": [12,15] }
``
- POST http://localhost:8000/api/admin/portfolio/{id}/set_main_image/
```json
{ "media_id": 12 }
``
- GET http://localhost:8000/api/admin/portfolio/seo_report/
- GET http://localhost:8000/api/admin/portfolio/{id}/statistics/
- POST http://localhost:8000/api/admin/portfolio/{id}/add_category/
```json
{ "category_id": 3 }
``
- POST http://localhost:8000/api/admin/portfolio/{id}/remove_category/
```json
{ "category_id": 3 }
``
- POST http://localhost:8000/api/admin/portfolio/{id}/bulk_add_tags/
```json
{ "tag_ids": [4,7,9] }
``
- POST http://localhost:8000/api/admin/portfolio/{id}/bulk_remove_tags/
```json
{ "tag_ids": [4,7] }
``

2) Portfolio (Public)
- GET http://localhost:8000/api/portfolio/
- Query params:
  - search: جستجو در `title, short_description, description, categories__name, tags__name`
  - category_slug: اسلاگ دسته
  - tag_slug: اسلاگ تگ
  - is_featured: true/false
  - created_after, created_before
  - ordering: `-is_featured,-created_at` (پیش‌فرض) یا `title, -title, created_at, -created_at`
  - limit, offset
- GET http://localhost:8000/api/portfolio/{public_id}/

3) Category (Admin)
- GET http://localhost:8000/api/admin/portfolio-category/
- Query params:
  - search: جستجو در `name, slug, description`
  - is_public: true/false
  - is_active: true/false
  - parent_id: فیلتر بر اساس والد
  - ordering: `created_at, -created_at, name, -name`
  - limit, offset
- POST http://localhost:8000/api/admin/portfolio-category/
```json
{
  "name": "Design",
  "slug": "design",
  "description": "...",
  "is_public": true,
  "is_active": true,
  "parent_id": 1,
  "image_id": 25,
  "meta_title": "...",
  "meta_description": "...",
  "og_title": "...",
  "og_description": "...",
  "canonical_url": "https://example.com/categories/design",
  "robots_meta": "index,follow"
}
``
- GET http://localhost:8000/api/admin/portfolio-category/{id}/
- PUT/PATCH http://localhost:8000/api/admin/portfolio-category/{id}/` (بدنه همان فیلدها)
- DELETE http://localhost:8000/api/admin/portfolio-category/{id}/

Category Actions:
- GET http://localhost:8000/api/admin/portfolio-category/tree/
- GET http://localhost:8000/api/admin/portfolio-category/roots/
- GET http://localhost:8000/api/admin/portfolio-category/{id}/children/
- GET http://localhost:8000/api/admin/portfolio-category/{id}/breadcrumbs/
- POST http://localhost:8000/api/admin/portfolio-category/{id}/move/
```json
{ "target_id": 10, "position": "last-child" }
``
- GET http://localhost:8000/api/admin/portfolio-category/popular/?limit=10
- POST http://localhost:8000/api/admin/portfolio-category/bulk_delete/
```json
{ "category_ids": [5,6,7] }
``
- GET http://localhost:8000/api/admin/portfolio-category/statistics/

4) Category (Public)
- GET http://localhost:8000/api/portfolio-category/
- Query params:
  - search: جستجو در `name, slug, description`
  - is_public: true/false
  - is_active: true/false
  - parent_id
  - limit, offset, ordering (`created_at, -created_at, name, -name`)
- GET http://localhost:8000/api/portfolio-category/{public_id}/

5) Option (Admin)
- GET http://localhost:8000/api/admin/portfolio-option/
- Query params:
  - search: جستجو در `key, value, description`
  - is_active: true/false
  - key: فیلتر دقیق کلید
  - ordering: `created_at, -created_at, updated_at, -updated_at, key, -key, value, -value`
  - limit, offset
- POST http://localhost:8000/api/admin/portfolio-option/
```json
{
  "name": "Color",
  "slug": "color",
  "description": "...",
  "is_active": true,
  "is_public": true
}
``
- GET http://localhost:8000/api/admin/portfolio-option/{id}/
- PUT/PATCH http://localhost:8000/api/admin/portfolio-option/{id}/` (همان فیلدها)
- DELETE http://localhost:8000/api/admin/portfolio-option/{id}/

Option Actions:
- GET http://localhost:8000/api/admin/portfolio-option/popular/?limit=10
- GET http://localhost:8000/api/admin/portfolio-option/by_key/?key=color
- GET http://localhost:8000/api/admin/portfolio-option/keys/
- POST http://localhost:8000/api/admin/portfolio-option/bulk_delete/
```json
{ "option_ids": [2,3,8] }
``
- GET http://localhost:8000/api/admin/portfolio-option/grouped/
- GET http://localhost:8000/api/admin/portfolio-option/statistics/

6) Option (Public)
- GET http://localhost:8000/api/portfolio-option/
- Query params:
  - search: جستجو در `name, slug, description`
  - is_public: true/false
  - is_active: true/false
  - limit, offset, ordering (`created_at, -created_at, name, -name`)
- GET http://localhost:8000/api/portfolio-option/{public_id}/

7) Tag (Admin)
- GET http://localhost:8000/api/admin/portfolio-tag/
- Query params:
  - search: جستجو در `name, slug, description`
  - is_active: true/false
  - ordering: `created_at, -created_at, name, -name`
  - limit, offset
- POST http://localhost:8000/api/admin/portfolio-tag/
```json
{
  "name": "UI",
  "slug": "ui",
  "description": "...",
  "is_active": true
}
``
- GET http://localhost:8000/api/admin/portfolio-tag/{id}/
- PUT/PATCH http://localhost:8000/api/admin/portfolio-tag/{id}/` (همان فیلدها)
- DELETE http://localhost:8000/api/admin/portfolio-tag/{id}/

Tag Actions:
- GET http://localhost:8000/api/admin/portfolio-tag/popular/?limit=10
- POST http://localhost:8000/api/admin/portfolio-tag/bulk_delete/
```json
{ "tag_ids": [4,6,9] }
``
- POST http://localhost:8000/api/admin/portfolio-tag/{id}/merge/
```json
{ "target_tag_id": 22 }
``
- GET http://localhost:8000/api/admin/portfolio-tag/statistics/

8) Tag (Public)
- GET http://localhost:8000/api/portfolio-tag/
- Query params:
  - search: جستجو در `name, slug, description`
  - is_active: true/false
  - limit, offset, ordering (`created_at, -created_at, name, -name`)
- GET http://localhost:8000/api/portfolio-tag/{public_id}/

---

### Media limits (Env)
برای محدودیت حجم/پسوندها از مقادیر `.env` استفاده می‌شود:
- `MEDIA_IMAGE_SIZE_LIMIT`, `MEDIA_VIDEO_SIZE_LIMIT`, `MEDIA_AUDIO_SIZE_LIMIT`, `MEDIA_PDF_SIZE_LIMIT
- `MEDIA_IMAGE_EXTENSIONS`, `MEDIA_VIDEO_EXTENSIONS`, `MEDIA_PDF_EXTENSIONS`, `MEDIA_AUDIO_EXTENSIONS

---

### Panel

Routes: `src/panel/urls.py

- Admin Panel Settings ViewSet
  - GET http://localhost:8000/api/admin/panel-settings/
  - تکی است (Singleton)، صفحه‌بندی ندارد
  - POST http://localhost:8000/api/admin/panel-settings/
  - GET http://localhost:8000/api/admin/panel-settings/{id}/
  - PUT/PATCH http://localhost:8000/api/admin/panel-settings/{id}/
  - DELETE http://localhost:8000/api/admin/panel-settings/{id}/

نمونه Raw برای ایجاد/ویرایش (بسته به مدل شما):
```json
{
  "key": "site_title",
  "value": "Webtalik",
  "is_active": true
}
``

---

### Statistics

Routes: `src/statistics/urls.py

- Admin Statistics ViewSet
  - GET http://localhost:8000/api/admin/statistics/
  - مسیرهای آماری مجموعی؛ صفحه‌بندی ندارد
  - سایر actionها بر اساس ViewSet داخلی (در صورت وجود)

---

### نکات Postman Collection
- برای مسیرهای `admin/*` کوکی Session و هدر CSRF را در Postman فعال کنید.
- برای آپلود فایل از `form-data` استفاده کنید: کلید `file`، نوع `File`.
- برای فراخوانی‌های bulk، آرایه‌های `ids` یا آبجکت‌های موردنیاز طبق نمونه‌ها ارسال شود.

نمونه‌های Query برای Postman (Collections → Params):
- لیست پورتفولیو ادمین با فیلتر و مرتب‌سازی:
  - GET `/api/admin/portfolio/?search=ui&status=published&is_featured=true&ordering=-created_at&limit=10&offset=0`
- مدیای عمومی با جستجو:
  - GET `/api/media/?title=logo&is_active=true&limit=12&offset=0`
- دسته‌بندی عمومی با جستجو و مرتب‌سازی:
  - GET `/api/portfolio-category/?search=design&ordering=name&limit=10&offset=0`









