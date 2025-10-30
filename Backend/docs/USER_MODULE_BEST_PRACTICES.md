## User App Standards (Performance + Messages)

این سند استانداردهای اپ `user` را برای جلوگیری از N+1 و یکپارچه‌سازی پیام‌ها مشخص می‌کند.

### 1) Performance - جلوگیری از N+1

الزام‌ها:
- در تمام Queryها و Serviceها برای آبجکت کاربر از الگوی زیر استفاده شود:
  - `select_related('user_profile')`
  - `prefetch_related('user_profile__profile_picture')`

نمونه‌ها:
```python
# لیست کاربران عادی
qs = User.objects.select_related('user_profile').prefetch_related(
    'user_profile__profile_picture'
).filter(user_type='user', is_staff=False)

# جزئیات یک کاربر عادی
user = User.objects.select_related('user_profile').prefetch_related(
    'user_profile__profile_picture'
).get(id=user_id, user_type='user', is_staff=False)

# بعد از به‌روزرسانی برای بازگشت پاسخ تازه
user = User.objects.select_related('user_profile').prefetch_related(
    'user_profile__profile_picture'
).get(id=user_id)
```

قوانین:
- در حلقه‌ها هرگز به `obj.user_profile` یا `obj.user_profile.profile_picture` بدون `prefetch_related` دسترسی ندهید.
- Serializerها فقط از داده‌های از پیش prefetch شده استفاده کنند؛ کوئری جدید نزنند.

چک‌لیست نقاط حساس:
- Services:
  - `user/services/admin/user_management_service.py` (DONE)
  - `user/services/user/user_profile_service.py` (دسترسی‌های تک‌شی بهینه است)
- Views (در صورت Query مستقیم): اطمینان از استفاده از Serviceهای بهینه

### 2) Messages - استفاده سراسری از ماژول پیام‌ها

الزام‌ها:
- تمام پیام‌های خطا/موفقیت از `src/user/messages` فراخوانی شوند.
- پاسخ‌ها با `src/core/responses.APIResponse` فرمت دهی شوند.

الگو:
```python
from src.core.responses import APIResponse
from src.user.messages import AUTH_ERRORS, AUTH_SUCCESS

return APIResponse.success(
    message=AUTH_SUCCESS["user_updated_successfully"],
    data=serializer.data
)

return APIResponse.error(
    message=AUTH_ERRORS["auth_validation_error"],
    errors=serializer.errors,
)
```

کلیدهای متداول در `AUTH_ERRORS`/`AUTH_SUCCESS`:
- `auth_validation_error`, `not_found`, `auth_user_not_found`, `auth_email_exists`, `auth_mobile_exists`, `national_id_exists`, `user_updated_successfully`, ...

### 3) قراردادهای ورودی/خروجی پروفایل

- ورودی تنظیم عکس پروفایل (توصیه‌شده):
```json
{ "profile": { "profile_picture": 56 } }
```
- حذف عکس:
```json
{ "remove_profile_picture": "true" }
```
- پاسخ باید شامل آبجکت کامل `profile.profile_picture` باشد (با `file_url`).

### 4) تست و مانیتورینگ

- از Postman/HTTP client برای PUT تست استفاده کنید؛ سپس GET همان آیدی را بررسی کنید.
- در DevTools (Django) تعداد کوئری‌ها را در لیست‌ها بررسی کنید؛ هدف: ثابت بماند با افزایش سطرها (به لطف prefetch).

### 5) چک‌لیست PR

- [ ] تمام Queryها دارای `select_related('user_profile')` و `prefetch_related('user_profile__profile_picture')` هستند
- [ ] هیچ حلقه‌ای بدون prefetch روی `user_profile` اجرا نشده
- [ ] تمام پیام‌ها از `src/user/messages` خوانده می‌شوند
- [ ] پاسخ‌ها با `APIResponse.success/error` استاندارد شده‌اند


