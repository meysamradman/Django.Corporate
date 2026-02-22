---
description: Describe when these instructions should be loaded
# applyTo: 'Describe when these instructions should be loaded' # when provided, instructions will automatically be added to the request context when the pattern matches an attached file
---
# 📘 داکیومنت سیستم Messages
### پنل ادمین | React + Vite + TypeScript + Django API
> بهترین روش‌ها بر اساس تحقیقات 2026 | بررسی کامل کد پروژه

---

## ۱. نگاه کلی — چرا سیستم Messages؟

پنل ادمین این پروژه با Django REST API ارتباط دارد. بخشی از پیام‌هایی که از بک‌اند می‌آیند به انگلیسی هستند (مثل کدهای خطا، وضعیت‌ها). سیستم messages در Core وظیفه دارد این پیام‌ها را به فارسی نگه‌داری کند و در جاهای درست نمایش دهد.

### ✅ وضعیت فعلی پروژه — خوب طراحی شده
- ساختار `core/messages/` با فایل‌های جداگانه به ازای هر دامنه وجود دارد
- `createMessageGetter` یک utility تمیز و بدون سربار performance است
- شیء `msg` در `index.ts` تمام getterها را یکجا در اختیار می‌گذارد
- فایل‌های `errors.ts`، `ui.ts`، `validation.ts`، `permissions.ts` به درستی جدا شده‌اند

### ⚠️ مشکلاتی که در کد پروژه پیدا شد — لیست کامل

| فایل | مشکل | اولویت |
|---|---|---|
| `useHybridExport.ts` | `toast.loading/success/error/info` همه hardcode — بدترین مورد | 🔴 بالا |
| `usePdfExport.ts` (blogs) | `toast.success/error` hardcode | 🔴 بالا |
| `usePortfolioPdfExport.ts` | `toast.success/error` hardcode | 🔴 بالا |
| `usePropertyPdfExport.ts` | `toast.success/error` hardcode | 🔴 بالا |
| `core/toast/index.ts` | `checkFormMessage = 'لطفاً خطاهای فرم را بررسی کنید'` hardcode در حالی که در `ERROR_MESSAGES.checkForm` موجود است | 🟠 مهم |
| `ValueFallback.tsx` | `fallback = "تعیین نشده"` hardcode در default prop | 🟠 مهم |
| `ChatMessageList.tsx` | متن هشدار ذخیره‌سازی چت hardcode در JSX | 🟡 متوسط |
| `ProtectedLink.tsx` | default prop `denyMessage` hardcode فارسی | 🟡 متوسط |
| `ProtectedButton.tsx` | default prop `denyMessage` hardcode فارسی | 🟡 متوسط |

---

## ۲. ساختار فایل‌های Messages

```
src/
└── core/
    └── messages/
        ├── index.ts          ← export مرکزی + شیء msg
        ├── utils.ts          ← createMessageGetter (یک‌بار اجرا می‌شود)
        ├── errors.ts         ← HTTP errors + Network errors
        ├── validation.ts     ← اعتبارسنجی فرم‌ها
        ├── ui.ts             ← CRUD / AUTH / STATUS / ACTION / EXPORT
        ├── analytics.ts      ← ترجمه مسیرهای صفحه
        ├── permissions.ts    ← ترجمه مجوزها و نقش‌ها
        └── modules/
            ├── ai.ts         ← پیام‌های هوش مصنوعی
            ├── blog.ts       ← پیام‌های وبلاگ
            ├── portfolio.ts  ← پیام‌های نمونه‌کار
            └── real_estate.ts← پیام‌های املاک
```

### نحوه کار createMessageGetter

این تابع یک‌بار در module level اجرا می‌شود و یک getter برمی‌گرداند. هیچ re-render ایجاد نمی‌کند و هیچ state ندارد:

```typescript
// core/messages/utils.ts
const replaceParams = (message: string, params?: Record<string, string | number>) => {
  if (!params) return message;
  return Object.entries(params).reduce((msg, [key, value]) =>
    msg.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value)), message
  );
};

// این تابع یک‌بار ساخته می‌شود — reference ثابت دارد
export const createMessageGetter = <T extends Record<string, string>>(messages: T) => {
  return (key: keyof T, params?: Record<string, string | number>): string => {
    const message = messages[key] || String(key);
    return replaceParams(message, params);
  };
};
```

---

## ۳. Performance — تأثیر روی سرعت

بر اساس تحقیقات 2025-2026 از منابع Vercel، Sentry، UXPin و Vite، این قوانین کلی برای performance در React + Vite اعمال می‌شوند:

### ۳.۱ — چرا Messages خارج از Component سریع است؟

وقتی یک ثابت (constant) در سطح module تعریف می‌شود، Vite آن را در build time به صورت static در می‌آورد:

- فقط یک‌بار در حافظه بارگذاری می‌شود
- هیچ re-render ایجاد نمی‌کند
- Vite با Rollup می‌تواند آن را **Tree-shake** کند — فقط پیام‌هایی که استفاده می‌شوند در bundle نهایی می‌مانند
- `Object.is` comparison در React برای آن انجام نمی‌شود

```typescript
// ✅ MODULE LEVEL — بهترین جا — یک‌بار اجرا، صفر re-render
export const CRUD_MESSAGES = {
  created: '{item} با موفقیت ایجاد شد',
  updated: '{item} با موفقیت به‌روزرسانی شد',
  deleted: '{item} با موفقیت حذف شد',
} as const;

// این getter هم یک‌بار ساخته می‌شود
export const getCrud = createMessageGetter(CRUD_MESSAGES);
```

### ۳.۲ — جدول کامل: کجا می‌شه و کجا نمی‌شه

| مکان | مجاز؟ | تأثیر سرعت | دلیل |
|---|---|---|---|
| فایل constants (module level) | ✅ بهترین | صفر | یک‌بار load — static reference |
| خارج از تابع component | ✅ عالی | صفر | re-render ندارد |
| داخل JSX — نمایش مستقیم | ✅ خوب | صفر | فقط read از object ثابت |
| داخل event handler (onClick) | ✅ خوب | صفر | فقط موقع کلیک اجرا می‌شود |
| داخل onSuccess/onError (mutation) | ✅ بهترین | صفر | مثل الان پروژه — درست است |
| داخل `useMemo` | ✅ اگه لازم | صفر | cache دارد، dependency درست |
| داخل `useCallback` | ✅ خوب | صفر | reference ثابت می‌ماند |
| داخل render بدون memo | ⚠️ با احتیاط | ناچیز | هر render یک function call اضافه |
| داخل `onChange` / `onScroll` | ❌ نه | بد | هزاران بار در ثانیه اجرا می‌شود |
| داخل `useEffect` بدون deps درست | ❌ خیلی بد | خیلی بد | loop بی‌نهایت ایجاد می‌کند |

### ۳.۳ — نکته مهم درباره Barrel Files در Vite

> بر اساس مستندات رسمی Vite (`vite.dev/guide/performance`)، barrel files (فایل‌های `index.ts` که همه چیز را export می‌کنند) می‌توانند باعث شوند Vite تمام فایل‌های یک پوشه را load کند، حتی اگر فقط یک export استفاده شود.

**⚡ راه‌حل برای پروژه شما:**

```typescript
// ✅ بهتر — import مستقیم از فایل
import { getError } from '@/core/messages/errors';

// ⚠️ barrel file — Vite ممکن است همه messages/ را load کند
import { getError } from '@/core/messages';
```

در production این تفاوت بزرگ‌تر است چون Rollup tree-shake می‌کند.

---

## ۴. کجاها باید از Messages استفاده کرد

### ۴.۱ — onSuccess و onError در React Query Mutations

این بهترین جای استفاده از messages است. بر اساس کد پروژه، این pattern درست است:

```typescript
// ✅ CORRECT — الان در پروژه درست استفاده شده
const deleteMutation = useMutation({
  mutationFn: deleteUser,
  onSuccess: () => {
    toast.success(getCrud('deleted', { item: 'کاربر' }));
    // خروجی: 'کاربر با موفقیت حذف شد'
  },
  onError: (error) => {
    notifyApiError(error, { fallbackMessage: getError('serverError') });
  },
});
```

### ۴.۲ — Toast Notifications

هر جایی که `toast.success` یا `toast.error` فراخوانی می‌شود، متن باید از messages بیاید:

```typescript
// ❌ WRONG — usePdfExport.ts فعلی
toast.success('فایل PDF با موفقیت دانلود شد');  // hardcode
toast.error('خطا در دانلود فایل PDF');           // hardcode

// ✅ CORRECT — باید باشد
import { getExport } from '@/core/messages/ui';

toast.success(getExport('pdfSuccess'));  // 'فایل PDF با موفقیت دانلود شد'
toast.error(getExport('pdfError'));      // 'خطا در دانلود فایل PDF'
```

### ۴.۳ — Default Props در Components

مقادیر default در props کامپوننت‌ها نباید hardcode فارسی باشند:

```typescript
// ❌ WRONG — ProtectedLink.tsx فعلی
denyMessage = 'شما دسترسی لازم برای این عملیات را ندارید'

// ✅ CORRECT
import { getAuth } from '@/core/messages/ui';

const {
  denyMessage = getAuth('accessDenied'), // 'دسترسی غیر مجاز'
  ...rest
} = props;
```

### ۴.۴ — Confirm Dialogs

```typescript
// ✅ با پارامتر — getCrud آماده است
const confirmQuestion = getConfirm('delete', { item: 'این کاربر' });
// خروجی: 'آیا از حذف این کاربر اطمینان دارید؟'

const bulkConfirm = getConfirm('bulkDelete', { count: 5, item: 'پست' });
// خروجی: 'آیا از حذف 5 پست اطمینان دارید؟'
```

### ۴.۵ — Status Display

```typescript
// ✅ STATUS_MESSAGES — برای نمایش وضعیت‌ها
import { getStatus } from '@/core/messages/ui';

getStatus('active')    // 'فعال'
getStatus('published') // 'منتشر شده'
getStatus('draft')     // 'پیش‌نویس'

// در JSX:
<Badge>{getStatus(item.status)}</Badge>
```

---

## ۵. کجاها نباید استفاده کرد

### ۵.۱ — داخل onChange / onInput

این توابع با هر keystroke صدا زده می‌شوند:

```typescript
// ❌ WRONG — هر keystroke یک بار اجرا می‌شود
const MyInput = () => (
  <input
    onChange={(e) => {
      const errorMsg = getError('validation'); // هر حرف!
      validate(e.target.value);
    }}
  />
);

// ✅ CORRECT — پیام را بیرون بذار
const validationMsg = getError('validation'); // یک‌بار

const MyInput = () => {
  const [error, setError] = useState(false);
  return (
    <>
      <input onChange={handleChange} />
      {error && <span>{validationMsg}</span>}
    </>
  );
};
```

### ۵.۲ — داخل useEffect بدون dependency درست

```typescript
// ❌ WRONG
useEffect(() => {
  setMessage(CRUD_MESSAGES[key]);
}, [CRUD_MESSAGES, key]); // CRUD_MESSAGES در deps اشتباه است

// ✅ CORRECT — فقط key را در deps بذار
useEffect(() => {
  setMessage(getCrud(key));
}, [key]); // getCrud یک تابع ثابت است، نیازی به deps ندارد
```

### ۵.۳ — داخل Hot Path Functions (onScroll, onResize)

```typescript
// ❌ WRONG — onScroll هر فریم اجرا می‌شود (60fps)
window.addEventListener('scroll', () => {
  const msg = getAction('loading'); // اضافه و بی‌معنی
  updateLoadingState();
});

// ✅ CORRECT — پیام را یک‌بار fetch کن
const loadingMsg = getAction('loading');
window.addEventListener('scroll', () => {
  updateLoadingState(loadingMsg);
});
```

### ۵.۴ — PERMISSION_TRANSLATIONS بزرگ بدون Memoization

```typescript
// ⚠️ برای object بزرگ مثل PERMISSION_TRANSLATIONS
// ❌ هر render یک lookup در object بزرگ
const MyComponent = ({ permKey }) => {
  const label = PERMISSION_TRANSLATIONS.resources[permKey];
  return <div>{label}</div>;
};

// ✅ CORRECT با useMemo
const MyComponent = ({ permKey }) => {
  const label = useMemo(
    () => PERMISSION_TRANSLATIONS.resources[permKey],
    [permKey]
  );
  return <div>{label}</div>;
};
```

---

## ۶. اصلاحات پیشنهادی — فایل به فایل

### ۶.۱ — useHybridExport.ts — بدترین مورد، اولویت فوری

```typescript
// ❌ قبل — همه hardcode
const toastId = toast.loading(`در حال آماده‌سازی فایل Excel (${itemLabel})...`);
toast.success(`فایل Excel با ${data.length} رکورد آماده شد`, { id: toastId });
toast.info(`تعداد ${totalCount} رکورد از سرور دریافت می‌شود...`, { id: toastId });
toast.success(`فایل ${itemLabel} با موفقیت دریافت شد`, { id: toastId });
toast.error(error instanceof Error ? error.message : `خطا در Export ${itemLabel}`, { id: toastId });

// ✅ بعد — پیام‌ها در EXPORT_MESSAGES اضافه شوند
// در ui.ts اضافه کن:
// excelPreparing: 'در حال آماده‌سازی فایل Excel...',
// excelReady: 'فایل Excel با {count} رکورد آماده شد',
// fetchingFromServer: 'در حال دریافت {count} رکورد از سرور...',
// excelFetched: 'فایل با موفقیت دریافت شد',

import { getExport } from '@/core/messages/ui';

const toastId = toast.loading(getExport('excelPreparing'));
toast.success(getExport('excelReady', { count: data.length }), { id: toastId });
toast.info(getExport('fetchingFromServer', { count: totalCount }), { id: toastId });
toast.success(getExport('excelFetched'), { id: toastId });
toast.error(getExport('excelError'), { id: toastId });
```

### ۶.۲ — usePdfExport.ts (blogs) — اولویت بالا

```typescript
// ❌ قبل — hardcode
onSuccess: () => {
  toast.success('فایل PDF با موفقیت دانلود شد');
},
onError: () => {
  toast.error('خطا در دانلود فایل PDF');
},

// ✅ بعد
import { getExport } from '@/core/messages/ui';

onSuccess: () => {
  toast.success(getExport('pdfSuccess'));
},
onError: (error) => {
  toast.error(getExport('pdfError'));
  console.error('PDF export error:', error);
},
```

### ۶.۲ — usePdfExport.ts (blogs) — اولویت بالا

```typescript
// ❌ قبل — hardcode
onSuccess: () => {
  toast.success('فایل PDF با موفقیت دانلود شد');
},
onError: () => {
  toast.error('خطا در دانلود فایل PDF');
},

// ✅ بعد
import { getExport } from '@/core/messages/ui';

onSuccess: () => {
  toast.success(getExport('pdfSuccess'));
},
onError: (error) => {
  toast.error(getExport('pdfError'));
  console.error('PDF export error:', error);
},
```

### ۶.۳ — usePortfolioPdfExport.ts و usePropertyPdfExport.ts — همان مشکل

```typescript
// ❌ usePortfolioPdfExport.ts — hardcode
toast.success('فایل PDF پروژه با موفقیت دانلود شد');
toast.error('خطا در دانلود فایل PDF پروژه');

// ❌ usePropertyPdfExport.ts — hardcode
toast.success('سند ملک با موفقیت دانلود شد');
toast.error('خطا در دانلود سند ملک');

// ✅ هر دو با messages
import { getExport } from '@/core/messages/ui';
toast.success(getExport('pdfSuccess'));
toast.error(getExport('pdfError'));
```

### ۶.۴ — core/toast/index.ts — مشکل داخل Core خودش!

```typescript
// ❌ قبل — hardcode در تابع handleFormApiError
export function handleFormApiError(error: unknown, options?: HandleFormApiErrorOptions) {
  const {
    checkFormMessage = 'لطفاً خطاهای فرم را بررسی کنید', // hardcode!
    ...
  } = options || {};

// ⚠️ جالب: ERROR_MESSAGES.checkForm دقیقاً همین مقدار را دارد!
// ✅ بعد — فقط import کن
import { getError } from '@/core/messages/errors';

export function handleFormApiError(error: unknown, options?: HandleFormApiErrorOptions) {
  const {
    checkFormMessage = getError('checkForm'),
    ...
  } = options || {};
```

### ۶.۵ — ValueFallback.tsx — مشکل در component مشترک

```typescript
// ❌ قبل — hardcode default prop
export function ValueFallback({ value, fallback = "تعیین نشده", className }: ValueFallbackProps) {

// ✅ بعد — اضافه کردن key در ACTION_MESSAGES در ui.ts:
// notSet: 'تعیین نشده',

import { getAction } from '@/core/messages/ui';
export function ValueFallback({ value, fallback = getAction('notSet'), className }: ValueFallbackProps) {
```

### ۶.۶ — ProtectedLink.tsx و ProtectedButton.tsx

```typescript
// ❌ قبل
denyMessage = 'شما دسترسی لازم برای این عملیات را ندارید'

// ✅ بعد
import { getAuth } from '@/core/messages/ui';

interface ProtectedLinkProps {
  denyMessage?: string;
}

const {
  denyMessage = getAuth('accessDenied'),
  ...rest
} = props;
```

### ۶.۷ — ChatMessageList.tsx

```typescript
// ❌ قبل — متن hardcode در JSX
<p>
  <strong>توجه:</strong> چت‌های شما به صورت موقت در مرورگر ذخیره می‌شوند...
</p>

// ✅ بعد — اضافه کردن به modules/ai.ts
// در AI_UI_MESSAGES:
chatStorageNote: 'چت‌های شما به صورت موقت در مرورگر ذخیره می‌شوند (حداکثر 50 پیام)',

// در component:
import { getAIUI } from '@/core/messages/modules/ai';
<p>{getAIUI('chatStorageNote')}</p>
```

### ۶.۸ — پیدا کردن همه hardcodeها

این دستور را در terminal پروژه اجرا کن:

```bash
# پیدا کردن toast با متن مستقیم
grep -rn "toast\.success('" src/ | grep -v 'messages'
grep -rn "toast\.error('" src/ | grep -v 'messages'

# پیدا کردن string های فارسی مستقیم در TS/TSX
grep -rn "'[\\u0600-\\u06FF]" src/ --include='*.ts' --include='*.tsx'
```

---

## ۷. چطور Module جدید اضافه کنیم

### مرحله ۱: فایل جدید در modules/

```typescript
// core/messages/modules/ticket.ts
import { createMessageGetter } from '../utils';

export const TICKET_MESSAGES = {
  titleRequired: 'عنوان تیکت الزامی است',
  messageRequired: 'متن تیکت الزامی است',
  submitted: 'تیکت با موفقیت ثبت شد',
  closed: 'تیکت با موفقیت بسته شد',
  reopened: 'تیکت دوباره باز شد',
  statusOpen: 'باز',
  statusClosed: 'بسته',
  statusPending: 'در انتظار',
} as const;

export const getTicket = createMessageGetter(TICKET_MESSAGES);
```

### مرحله ۲: export از index.ts

```typescript
// core/messages/index.ts
export { TICKET_MESSAGES, getTicket } from './modules/ticket';

export const msg = {
  // ... بقیه
  ticket: getTicket,
} as const;
```

### مرحله ۳: استفاده در کامپوننت

```typescript
// ✅ import مستقیم (بهتر برای tree-shaking در Vite)
import { getTicket } from '@/core/messages/modules/ticket';

const submitMutation = useMutation({
  mutationFn: createTicket,
  onSuccess: () => toast.success(getTicket('submitted')),
  onError: (err) => notifyApiError(err, {
    fallbackMessage: getError('serverError')
  }),
});
```

---

## ۸. خلاصه — قوانین طلایی

| شماره | قانون | اهمیت |
|---|---|---|
| ۱ | هر متن فارسی یا انگلیسی که نمایش داده می‌شود → باید در messages باشد | 🔴 حیاتی |
| ۲ | Messages را همیشه در سطح module تعریف کن، نه داخل component | 🔴 حیاتی |
| ۳ | `toast.success()` و `toast.error()` هرگز متن مستقیم نگیرند | 🔴 حیاتی |
| ۴ | داخل `onChange` و `onScroll` هرگز message lookup نکن | 🟠 مهم |
| ۵ | `useEffect` فقط key را در dependency داشته باشد، نه کل object | 🟠 مهم |
| ۶ | برای import مستقیم از فایل استفاده کن — بهتر برای Vite tree-shaking | 🟡 توصیه |
| ۷ | برای `PERMISSION_TRANSLATIONS` بزرگ، از `useMemo` استفاده کن | 🟡 توصیه |
| ۸ | module جدید = فایل جدید در `modules/` + export در `index.ts` | 🟢 روند |

---

## منابع تحقیقات 2026

- `vite.dev/guide/performance` — مستندات رسمی Vite درباره Barrel Files و Performance
- `vercel.com/blog/introducing-react-best-practices` — 40+ قانون performance از production
- `blog.sentry.io/react-js-performance-guide` — راهنمای جامع React Performance 2025
- `uxpin.com/studio/blog/react-components-rendering-performance` — useMemo vs useCallback

---

*Admin Panel — Core Messages Documentation | 2026*