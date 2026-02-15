# راهنمای جامع Error Handling + Validation (Admin Panel)

این سند قرارداد رسمی تیم برای مدیریت خطا، اعتبارسنجی، پیام‌ها و هماهنگی Frontend/Backend در کل پنل ادمین است.

---

## هدف‌های اصلی

1) UX واضح: خطا باید دقیقاً جایی دیده شود که کاربر باید اصلاح کند.
2) یکنواختی: همه فرم‌ها با یک الگوی ثابت کار کنند.
3) سرعت و نگهداری: منطق مشترک در `core` باشد، منطق دامنه‌ای در هر ماژول.

---

## قانون طلایی نمایش خطا

### 1) خطاهای فیلدی (Field Validation)
- Toast نکن.
- کنار همان input نمایش بده (inline).
- اگر خطا از بک‌اند آمده و قابل map است، مستقیم به فیلد map کن.

### 2) خطاهای غیر فیلدی (Business / Non-field)
- در Form Alert بالای فرم نمایش بده.
- Toast پیش‌فرض نده (مگر مورد خاص).

### 3) خطاهای سیستمی/شبکه (500, timeout, network)
- Toast error نمایش بده.
- در صورت نیاز، Form Alert هم برای context صفحه نمایش بده.

### 4) موفقیت عملیات
- فقط Toast success.
- نیاز به پیام موفقیت داخل فرم نیست.

### 5) اکشن‌های لیستی/سایدبار (Delete/Toggle/Bulk)
- خطاهای سروری در hookهای لیستی باید با `notifyApiError` هندل شوند.
- `showError("خطای سرور...")` هاردکد در hookهای API-driven ممنوع است.
- برای هر اکشن یک `dedupeKey` پایدار تعریف شود.
- فقط پیام‌های محلیِ غیرسروری (مثل "داده‌ای برای پرینت یافت نشد") مجاز به `showError` مستقیم هستند.

---

## Source of Truth در Frontend

### پیام‌ها
- `core/messages/errors.ts` → پیام‌های سیستم/HTTP
- `core/messages/validation.ts` → پیام‌های اعتبارسنجی فرم
- `core/messages/modules/*.ts` → پیام‌های دامنه‌ای ماژول‌ها
- `core/messages/index.ts` → API واحد `msg`

### Validation مشترک
- `core/validation/index.ts` → ورودی واحد همه validatorها
- `core/validation/mobile.ts`
- `core/validation/email.ts`
- `core/validation/password.ts`
- `core/validation/nationalId.ts`
- `core/validation/phone.ts`

### Toast/Error Helpers
- `core/toast/index.ts`
  - `extractFieldErrors`
  - `handleFormApiError`
  - `notifyApiError`
  - `showSuccess/showError`

### قرارداد رسمی Sonner (خیلی مهم)

برای جلوگیری از ناهماهنگی رنگ/UX، این قرارداد باید ثابت بماند:

1) **Toaster فقط از Element لایه UI**
- فقط از `components/elements/Sonner.tsx` استفاده شود.
- در کل اپ فقط یک‌بار mount شود (در `App.tsx`).

2) **ارسال پیام فقط از Core Toast**
- در ماژول‌ها و page/componentها فقط از `core/toast/index.ts` استفاده شود.
- import مستقیم از پکیج `sonner` در feature/module ممنوع است.

3) **اگر API خام toast لازم شد**
- فقط از `toast` که از `core/toast` export شده استفاده شود، نه از `sonner` مستقیم.
- هدف: همه پیام‌ها زیر کانفیگ یکسان `Toaster` بمانند.

4) **هماهنگی رنگ‌ها**
- رنگ/variant از طریق کانفیگ `components/elements/Sonner.tsx` کنترل می‌شود.
- فرم‌ها نباید رنگ toast را با استایل محلی override کنند، مگر نیاز دامنه‌ای واقعی.

### Tab Error Navigation (فرم‌های تب‌دار)
- منطق navigation تب خطا باید داخل همان فرم/ماژول پیاده‌سازی شود (local per form).
- هر فرم تب‌دار باید `field -> tab` map مخصوص خودش را داشته باشد.
- هدف: اگر خطای فیلدی در تب دیگر باشد، تب همان فیلد به‌صورت خودکار فعال شود.

### Tabbed RHF Re-render Contract (خیلی مهم)
- در فرم‌های تب‌دار با `react-hook-form`، اگر parent روی `formState` subscribe نباشد، ممکن است خطاهای inline بعد از `trigger()` فقط بعد از جابه‌جایی تب دیده شوند.
- راه‌حل اجباری:
  - در parent فرم از `useFormState({ control: form.control })` استفاده شود تا re-render تضمین شود.
  - اگر `tabs` با `useMemo` ساخته می‌شوند، dependency تغییر خطا داشته باشند (مثل یک `formErrorVersion` امن).
- روی جابه‌جایی دستی تب (`onTabChange`) فقط `formAlert` پاک شود؛ `form.clearErrors()` نزنید (باعث UX اشتباه و حذف خطاهای لازم می‌شود).
- هرگز `JSON.stringify(formState.errors)` نزنید؛ به خاطر `ref` ممکن است circular structure بدهد.
  - به‌جای آن از کلید امن مثل `Object.keys(errors).sort().join('|')` استفاده کنید.

---

## Source of Truth در Backend (الزامی - حذف نشود)

### Response Envelope استاندارد
- `Backend/src/core/responses/response.py`
- خروجی استاندارد:
  - `metaData.status`
  - `metaData.message`
  - `metaData.AppStatusCode`
  - `data`
  - `errors` (در خطاهای validation)

### Exception Handler استاندارد
- `Backend/src/core/handlers.py`
- هدف: یکدست کردن خطاهای DRF/Django در همان قرارداد API

### تنظیمات سراسری DRF
- `Backend/config/django/base.py`
- کلیدهای مهم:
  - `REST_FRAMEWORK.DEFAULT_RENDERER_CLASSES`
  - `REST_FRAMEWORK.EXCEPTION_HANDLER`

### Utility مشترک بک‌اند برای Validation Messages
- `Backend/src/core/utils/validation_helpers.py`
- استفاده برای جلوگیری از خروجی‌های ناهماهنگ مثل لیست‌نمایی متن خطا

---

## API Error Contract (Backend → Frontend)

فرانت انتظار دارد:

```json
{
  "metaData": {
    "status": "error",
    "message": "خطا در اعتبارسنجی",
    "AppStatusCode": 400
  },
  "errors": {
    "mobile": ["این شماره موبایل قبلاً ثبت شده است"],
    "non_field_errors": ["در حال حاضر امکان ثبت وجود ندارد"]
  }
}
```

قواعد:
- خطاهای فیلدی حتماً در `errors.<field>`
- خطاهای غیر فیلدی در `errors.non_field_errors`
- `metaData.message` برای پیام کلی پاسخ

### قرارداد الزامی Consultant در Backend
- در `admin create` اگر `admin_role_type=consultant` باشد:
  - `license_number` الزامی است.
  - `first_name` و `last_name` الزامی هستند.
- در `admin edit` برای کاربر consultant:
  - اگر `agent_profile.license_number` خالی ارسال شود یا consultant فعلی اصلاً license نداشته باشد، خطای فیلدی الزامی برگردد.
- پیام این خطاها باید فقط از `AUTH_ERRORS` بیاید (hardcode ممنوع).
- کلیدهای خطای فیلدی consultant باید قابل map به فرم باشند (مثل `agent_profile.license_number`).

---

## قرارداد خطا برای ماژول املاک (Real Estate)

### فرانت‌اند:
- تمام فرم‌های املاک (ایجاد/ویرایش ملک، دسته‌بندی، تگ، ویژگی و ...) باید از `extractMappedPropertyFieldErrors` برای map و نمایش خطاهای فیلدی استفاده کنند.
- خطاهای غیر فیلدی (non_field_errors) باید در Form Alert بالای فرم نمایش داده شوند.
- منطق فعال‌سازی تب بر اساس فیلد خطادار باید دقیقاً مثل بلاگ/نمونه‌کار پیاده‌سازی شود.
- در جابه‌جایی تب‌ها فقط `formAlert` پاک شود و خطاهای فیلدی پاک نشوند.
- اکشن‌های سایدبار/لیست املاک (type/state/tag/feature/label) باید از `notifyApiError` استفاده کنند (hardcoded toast message ممنوع).
- هیچ خطای غیرضروری از سرور نباید نمایش داده شود؛ اعتبارسنجی‌های ساده فقط در فرانت انجام شود (Zod).

### بک‌اند:
- خروجی create/update در property_views.py باید همیشه خطاهای فیلدی را با کلید `errors` و ساختار استاندارد (dict فیلد به لیست پیام) برگرداند (با استفاده از `normalize_validation_error`).
- پیام خطا در کلید `message` و خطاهای فیلدی در کلید `errors` قرار می‌گیرد.
- اگر خطا فقط non_field باشد، فقط همان در `errors` بیاید.
- پیام‌های خطا باید از PROPERTY_ERRORS باشد و قابل map به فرانت.

### مثال خروجی استاندارد:
```json
{
  "metaData": {
    "status": false,
    "message": "خطا در اعتبارسنجی داده‌های ملک. لطفاً فیلدهای الزامی را بررسی کنید.",
    "AppStatusCode": 400
  },
  "errors": {
    "title": ["عنوان الزامی است"],
    "property_type": ["نوع ملک الزامی است"],
    "non_field_errors": ["خطای کلی"]
  },
  "data": null
}
```

---

## تست سناریویی (End-to-End)
- ایجاد/ویرایش ملک با خطاهای فیلدی و غیر فیلدی باید دقیقاً مثل بلاگ/نمونه‌کار رفتار کند.
- خطاهای غیرضروری از سرور نباید نمایش داده شود.
- تست با خطاهای ۴۰۰ و ۵۰۰ و خطاهای دسته‌بندی/تگ/ویژگی نیز انجام شود.

---
