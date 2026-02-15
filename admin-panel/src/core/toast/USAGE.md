# اصول اساسی نمایش خطا در فرم‌های پیچیده (Admin Panel)

## 1) خطاهای اعتبارسنجی فرم (Field Errors)
- نباید Toast شوند.
- باید دقیقاً کنار همان فیلد نمایش داده شوند (inline).
- اگر از سرور آمده‌اند باید به فیلد مناسب map شوند.
- اگر فرانت بتواند تشخیص دهد (reactive validation)، باید قبل از submit و سریع‌تر از سرور نمایش داده شود.

قاعده UX: خطای کاربر باید نزدیک همان input دیده شود، نه به‌صورت پیام سراسری.

## 2) خطاهای کسب‌وکاری سرور (Backend Business Errors)
مثال‌ها:
- شماره موبایل تکراری
- ملک قبلاً فروخته شده
- کمیسیون غیرمجاز

سیاست نمایش:
- اگر قابل map شدن به فیلد باشد: inline field
- اگر غیر فیلدی باشد: Form-level Alert (بالای فرم)
- این نوع خطاها پیش‌فرض نباید Toast شوند

دلیل: کاربر باید همان‌جا مشکل را اصلاح کند، نه اینکه پیام گذرا ببیند.

## 3) خطاهای عمومی/سیستمی/شبکه
مثال‌ها:
- 500
- timeout
- network/disconnected
- session expire

سیاست نمایش:
- Toast خطای عمومی مجاز و مناسب است
- در صورت نیاز یک Alert غیراضطراری بالای فرم هم نمایش داده شود

## 4) پیام‌های موفقیت
- create/update/delete/close deal → Toast success
- پس از بازگشت به لیست هم Toast کافی است
- نیاز به تکرار پیام موفقیت داخل فرم نیست

## الگوی UI پیشنهادی

### Field-level UI
- Label
- Input
- Error text (قرمز، کوچک)

مثال:
- شماره موبایل
- 0912xxx
- شماره تکراری است

### Form-level UI
- Alert area بالای فرم
- مثال: خطای غیرمنتظره رخ داد

### Toast UI
- موفقیت عملیات
- خطای عمومی (Network / Timeout)
- خطاهای سیستمی (500)
- پیام‌هایی که قابل inline کردن نیستند

## چک‌لیست تصمیم‌گیری
| نوع خطا | نمایش UX |
|---|---|
| خطای فرانت (format/required) | inline field |
| خطای سرور مرتبط با field | inline field |
| خطای سرور غیر field | form alert (بالای فرم) |
| خطای سیستم/500/timeout | toast error |
| عملیات موفق | toast success |

## دلیل علمی/تجربی
- Proximity Principle: خطا باید همان‌جایی دیده شود که کاربر اشتباه کرده است.
- Cognitive Load: Toast زیاد باعث شلوغی ذهنی و سردرگمی می‌شود.
- Guided Correction: خطای سرور مثل duplicate mobile باید روی همان فیلد نمایش داده شود تا اصلاح سریع انجام شود.

## رفرنس UI Framework
- MUI: https://mui.com/components/text-fields/#validation
- Ant Design: https://ant.design/components/form/

## قرارداد فنی تیم (الزامی)
- API layer فقط `ApiError` برگرداند؛ خودش Toast ندهد.
- فرم‌ها از `handleFormApiError` برای map خطاهای فیلدی استفاده کنند.
- پیش‌فرض فرم‌ها: `showToastForFieldErrors: false`.
- برای non-field/server-system فقط `notifyApiError` یا Form Alert استفاده شود.
- همه toastهای خطا `dedupeKey` پایدار داشته باشند تا اسپم نشوند.

## منبع واحد پیام‌ها (Source of Truth)

### 1) پیام خطای سیستمی/HTTP
- فایل مرجع: `core/messages/errors.ts`
- کاربرد: خطاهای عمومی، شبکه، timeout، 5xx و mapping status code
- نکته: این لایه برای فرم‌فیلد نیست؛ برای global/system است.

### 2) پیام‌های اعتبارسنجی فرم در فرانت
- فایل مرجع: `core/messages/validation.ts`
- دسترسی از طریق `msg.validation(...)`
- کاربرد: required, format, min/max و پیام‌های سریع قبل از submit

### 3) پیام‌های دامنه‌ای ماژول‌ها
- فایل‌ها: `core/messages/modules/*.ts` (مثل `ai.ts`, `blog.ts`, `portfolio.ts`, `real_estate.ts`)
- کاربرد: متن‌های domain-specific (غیرسیستمی)

## قرارداد Validation Schema در اپ‌ها
- هر اپ باید schema خودش را در `components/<app>/validations/*Schema.ts` نگه دارد.
- مثال‌های موجود: users, admins, blogs, portfolios, real-estate, settings, auth, roles
- همه schemaها باید:
  - تا حد ممکن از `msg.validation(...)` استفاده کنند
  - از validatorهای مشترک `core/validation/*` استفاده کنند
  - نام فیلدها را طوری نگه دارند که mapping خطا از سرور ساده و پایدار بماند

## قرارداد همگام‌سازی errors.ts با فرم‌ها
- `errors.ts` فقط سیاست عمومی خطا را تعیین می‌کند.
- برای فرم‌ها، اولویت با `handleFormApiError` است (inline field و form alert).
- اگر خطای form-field از سرور آمد، باید map شود و Toast نشود.
- `preferBackendMessage` برای فرم‌ها پیش‌فرض `false` است؛ فقط در موارد مشخص non-field می‌تواند `true` شود.

## ترتیب استاندارد تصمیم‌گیری در submit فرم
1. validate فرانت توسط schema
2. submit
3. اگر `errors.field_name` داشتیم → `setError(field)` (inline)
4. اگر `errors.non_field_errors` داشتیم → Alert بالای فرم
5. اگر خطای system/network/5xx بود → Toast error

## نکته API (برای map دقیق)
ساختار پاسخ خطا باید قابل map باشد:
- `errors.field_name = [message]` برای خطاهای فیلدی
- `errors.non_field_errors = [message]` برای خطاهای غیر فیلدی

نمونه:

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
