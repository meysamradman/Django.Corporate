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

## معماری پیشنهادی هر فرم (الزامی)

هر فرم باید 3 لایه داشته باشد:

1) **Schema دامنه‌ای** در `components/<domain>/validations/*Schema.ts`
2) **Mapper خطای سرور دامنه‌ای** در `components/<domain>/validations/*ApiError.ts`
3) **Page/Form** که فقط orchestration انجام دهد (submit, setError, alert, toast)

نمونه users:
- `components/users/validations/userSchema.ts`
- `components/users/validations/userEditSchema.ts`
- `components/users/validations/userApiError.ts`

---

## قرارداد دقیق submit فرم

1) `schema.safeParse` یا `react-hook-form + zodResolver`
2) اگر invalid بود → فقط inline errors
3) submit API
4) اگر `errors.field_name` داشتیم:
   - map با فایل `*ApiError.ts`
   - `setError(...)`
  - `resolve<Field>ErrorTab(...)` (local) و `setActiveTab(...)`
   - بدون Toast
5) اگر `errors.non_field_errors` داشتیم:
   - Form Alert
   - بدون Toast
6) اگر system/network/5xx:
   - `notifyApiError(...)` با `fallbackMessage`
   - `dedupeKey` پایدار

---

## Performance Guidelines (خیلی مهم)

### چیزی که سرعت را کم نمی‌کند (عملاً ناچیز)
- داشتن فایل Schema جدا
- داشتن فایل `*ApiError.ts` جدا
- import از `core/validation/index.ts`
- استفاده از `msg` به‌جای hardcode

### چیزی که واقعاً سرعت را کم می‌کند
- درخواست‌های اضافی شبکه
- rerender زیاد و state سنگین
- toastهای تکراری و بدون dedupe
- query invalidation بی‌هدف
- پردازش سنگین در هر keypress بدون debounce

نتیجه: جدا کردن فایل‌های validation/mapping نه‌تنها مشکل سرعت ایجاد نمی‌کند، بلکه خطاهای تکراری را کم و نگهداری را سریع‌تر می‌کند.

---

## Anti-pattern ها (ممنوع)

1) validate دستی پراکنده داخل page/form بدون schema
2) hardcode پیام فارسی داخل validator/page
3) Toast برای field errors
4) تکرار field map در چند فایل (باید در `*ApiError.ts` باشد)
5) mix کردن پیام‌های سیستمی و فیلدی در یک مسیر
6) نادیده گرفتن `non_field_errors`
7) شکستن قرارداد Backend response در endpointها
8) باقی ماندن روی تب اشتباه وقتی خطا در تب دیگر است

---

## Checklist برای PR

- [ ] schema فرم در `components/<domain>/validations`
- [ ] استفاده از validator مشترک از `core/validation`
- [ ] استفاده از `msg.validation` به‌جای hardcode
- [ ] mapper خطای سرور (`*ApiError.ts`) دارد
- [ ] field errors فقط inline هستند
- [ ] non-field فقط Form Alert
- [ ] system errors فقط `notifyApiError`
- [ ] همه error toastها `dedupeKey` دارند
- [ ] با قرارداد بک‌اند (`metaData/data/errors`) سازگار است

---

## وضعیت فعلی users (مرجع)

- Create user: مطابق قرارداد
- Edit user: مطابق قرارداد
- Validation shared: یکپارچه از `core/validation/index.ts`
- Server error mapping: یکپارچه از `userApiError.ts`
- Tab auto-switch on field errors: local per form در `users/create` و `users/edit`

## وضعیت فعلی admins (مرجع)

- Create admin: مطابق قرارداد (field inline، non-field alert، system toast)
- Edit admin: مطابق قرارداد (field inline، non-field alert، system toast)
- Server error mapping: یکپارچه در `components/admins/validations/adminApiError.ts`
- Tab auto-switch on field errors: local per form در `admins/create` و `admins/[id]/edit`

## وضعیت فعلی agencies / consultant (مرجع)

- Create agency: مطابق قرارداد (field inline، non-field alert، system toast)
- Edit agency: مطابق قرارداد (field inline، non-field alert، system toast)
- Consultant fields (داخل admin create/edit): مطابق قرارداد و map‌شده از `adminApiError.ts`
- Server error mapping agencies: یکپارچه در `components/real-estate/validations/agencyApiError.ts`
- Tab auto-switch on field errors: local per form در `admins/agencies/create` و `agencies/edit/EditForm`

## وضعیت فعلی blog (مرجع)

- Create/Edit blog: مطابق قرارداد (field inline، non-field alert، system toast)
- Server error mapping blog form: یکپارچه در `components/blogs/validations/blogApiError.ts`
- Tab auto-switch on field errors: local per form در `blogs/create` و `blogs/[id]/edit`
- پیام `checkForm` در Blog Create/Edit اکنون هم‌الگوی نمونه‌کار است (از `showError` در `core/toast`)
- پیام `checkForm` در Blog Create/Edit برای سناریوهای تب‌دار (مثل نامشخص بودن دسته/تگ در تب دیگر) باید حفظ شود و حذف نشود.
- Category/Tag sidebar: مطابق قرارداد (field inline، non-field alert، system toast)
- Backend create/update blog: خطاهای validation به‌صورت ساختاری در `errors` برمی‌گردد (نه فقط `message`)

## وضعیت فعلی portfolio (مرجع)

- Create/Edit portfolio: مطابق قرارداد (field inline، non-field alert، system toast)
- Server error mapping portfolio form: یکپارچه در `components/portfolios/validations/portfolioApiError.ts`
- Tab auto-switch on field errors: local per form در `portfolios/create` و `portfolios/[id]/edit`
- در Portfolio Create/Edit، فیلدهای دسته‌بندی/تگ/گزینه داخل سایدبار تب `account` هستند؛ در خطاهای این فیلدها باید همان تب فعال شود.
- پیام `checkForm` در Portfolio Create/Edit برای سناریوهای تب‌دار/سایدبار (مثل نامشخص بودن دسته‌بندی، تگ یا گزینه) باید حفظ شود و حذف نشود.
- Category/Tag/Option sidebar actions: خطاهای سیستمی فقط از مسیر `notifyApiError` با `dedupeKey` پایدار نمایش داده شوند.

از این به بعد همین الگو باید برای admins / agencies / auth / سایر فرم‌ها اجرا شود.
