## راهنمای ثبت/ویرایش عکس پروفایل (Admin و Regular User)

این راهنما الگوی درست ارسال درخواست، رفتار بک‌اند و نکات فرانت برای ذخیره و به‌روزرسانی عکس پروفایل را یکپارچه می‌کند.

### 1) مسیرهای API

- کاربران عادی (Regular Users):
  - PUT `/api/admin/users-management/{user_id}/`
  - فقط برای کاربران غیرادمین (`is_staff=False`)

- ادمین‌ها (Admin Users):
  - PUT `/api/admin/management/{admin_id}/`
  - فقط برای ادمین‌ها (`is_staff=True`)

نکته: اگر برای ادمین به مسیر `users-management` درخواست بدهید، پاسخ 400 برمی‌گردد (عمداً مسدود است).

### 2) Payload استاندارد (JSON)

- توصیه‌شده (ارسال داخل `profile`):
```json
{
  "profile": {
    "first_name": "نام",
    "last_name": "نام خانوادگی",
    "profile_picture": 56
  }
}
```

- جایگزین (top-level فقط در موارد خاص):
```json
{ "profile_picture": 56 }
```

- حذف عکس پروفایل (دو روش):
```json
{ "remove_profile_picture": "true" }
```
یا
```json
{ "profile": { "profile_picture": null } }
```

الزامات:
- `profile_picture` باید ID معتبر از مدل `ImageMedia` و `is_active=true` باشد.
- کلیدها `snake_case` باشند (مثلاً `first_name`, `last_name`).
- Header: `Content-Type: application/json`
- احراز هویت: کوکی سشن ادمین (Session) همراه درخواست باشد.

### 3) رفتار بک‌اند (Backend)

- Serializer: `UserUpdateSerializer` ورودی‌های زیر را می‌پذیرد:
  - `profile.profile_picture` (توصیه‌شده)
  - `profile_picture` (top-level)
  - سایر فیلدهای پروفایل مانند `first_name`, `last_name`, `province`, `city`, ...

- Service: `UserManagementService.update_user`
  - فهرست فیلدهای پروفایل شامل `profile_picture` نیز هست؛ لذا مقدار داخل `profile.profile_picture` پردازش می‌شود.
  - پس از ذخیره، کاربر دوباره با `select_related('user_profile')` و `prefetch_related('user_profile__profile_picture')` از DB بارگذاری می‌شود تا پاسخ نهایی، تصویر جدید را فوراً برگرداند.

### 4) پاسخ موفق (نمونه)

- Status: `200 OK`
- ساختار: فیلد `data.profile.profile_picture` باید آبجکت تصویر را شامل کند:
  - `id`, `public_id`, `title`, `file_url`, `alt_text`, `created_at`, `updated_at`

مثال خلاصه:
```json
{
  "metaData": { "status": "success", "AppStatusCode": 200 },
  "data": {
    "id": 75,
    "profile": {
      "first_name": "نام",
      "last_name": "نام خانوادگی",
      "profile_picture": {
        "id": 56,
        "file_url": "/media/image/2025/10/17/a0ff6dab.jpg"
      }
    }
  }
}
```

### 5) تست با Postman

- Regular User:
  - `PUT http://localhost:8000/api/admin/users-management/{user_id}/`
  - Body:
```json
{
  "profile": {
    "first_name": "نام جدید",
    "last_name": "نام خانوادگی جدید",
    "profile_picture": 56
  }
}
```

- Admin:
  - `PUT http://localhost:8000/api/admin/management/{admin_id}/`
  - Body مشابه، در صورت نیاز فقط `profile_picture` را بفرستید.

چک‌ها:
- اگر پاسخ 400 بود:
  - مسیر را با نوع کاربر هدف تطبیق دهید (ادمین ↔ users-management اشتباه نباشد).
  - `profile_picture` وجود داشته باشد و `is_active=true` باشد.
  - از ارسال ایمیل/موبایل تکراری پرهیز کنید.

### 6) الگوی صحیح در فرانت (Next.js Admin Panel)

انتخاب از MediaLibrary → دریافت `Media.id` → فراخوانی API:
```ts
await adminApi.updateUserByType(userId, {
  profile: { profile_picture: mediaId }
}, 'user'); // برای ادمین: 'admin'
```

Invalidate کش React Query بعد از موفقیت:
- کاربران: `['user-profile']`, `['current-user-profile']`, و در صفحات ویرایش `['user', userId]`
- ادمین‌ها: `['admin-profile']`, `['current-admin-profile']`, و `['admin', adminId]`

### 7) نکات اپ مدیا

- همه آپلودها از اپ مدیای مرکزی انجام می‌شود؛ محدودیت حجم/پسوند از `.env` خوانده می‌شود.
- برای استفاده به‌عنوان عکس پروفایل، فقط `ImageMedia` معتبر و فعال استفاده شود.

### 8) دیباگ سریع

- اگر `profile_picture` در پاسخ null بود:
  - صحت ID مدیا و فعال بودن آن را بررسی کنید.
  - Cache فرانت را invalidate کنید (کلیدهای بالا).
  - برای Regular User حتماً مسیر `users-management` و برای Admin مسیر `management` را استفاده کنید.

### 9) فایل‌های مرتبط

- Backend:
  - `src/user/serializers/user/user_profile_serializer.py`
  - `src/user/serializers/admin/user_management_serializer.py`
  - `src/user/services/admin/user_management_service.py`
  - `src/user/services/user/user_profile_service.py`
- Frontend:
  - `admin/src/api/admins/route.ts`
  - `admin/src/components/users/profile/ProfileHeader.tsx`
  - `admin/src/components/admins/profile/ProfileHeader.tsx`


