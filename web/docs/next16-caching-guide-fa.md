# راهنمای کامل کش در Next.js 16 (برای پروژه `web`)

این سند مخصوص ساختار فعلی پروژه شما نوشته شده است:
- Next.js: `16.1.6`
- مسیرهای دیتا: `src/api/*`
- fetch wrapper: `src/core/config/fetch.ts`
- config: `next.config.ts` با `cacheComponents: true`

---

## 1) خلاصه خیلی مهم (TL;DR)

1. در Next.js 16، مدل توصیه‌شده کش بر پایه `Cache Components` + `"use cache"` است.
2. وقتی `cacheComponents: true` روشن است، route segment configهای قدیمی مثل `dynamic`, `revalidate`, `fetchCache` عملاً برای App Router غیرفعال/نادیده گرفته می‌شوند.
3. برای invalidation:
   - `revalidateTag(tag, "max")` برای SWR-like stale-while-revalidate
   - `updateTag(tag)` برای immediate update (معمولاً در Server Actions)
4. `revalidateTag` در 16 نیاز به آرگومان دوم دارد (مثل `"max"`)؛ بدون آن deprecated است.
5. بهترین الگو برای پروژه شما: کش را در سطح فانکشن/resource تعریف کنید، نه به صورت default سراسری در wrapper.

---

## 2) وضعیت فعلی پروژه شما

### 2.1 `next.config.ts`
- `cacheComponents: true` فعال است (خوب و مطابق مدل جدید).
- rewrites برای `/api/*` به بک‌اند Django دارید (درست).

### 2.2 `fetch.ts`
در سرور برای همه GETها به‌صورت پیش‌فرض این رفتار را دارید:
- `cache: "force-cache"`
- اگر `next.revalidate` داده نشده باشد: `revalidate: 60`

این رفتار اگرچه خطای "Blocking Route" را کم می‌کند، اما یک ریسک دارد:
- هر GET جدید به‌صورت ناخواسته cache می‌شود، حتی اگر endpoint dynamic یا user-specific باشد.

### 2.3 `src/api/*`
بعضی جاها policy خوب تعریف شده (مثل `real-estate/route.ts` با `tags`/`revalidate`)، ولی چون wrapper default کش می‌کند، consistency کامل نیست.

---

## 3) مدل درست کش در Next 16

### 3.1 دو لایه اصلی
1. **Data Cache** (برای داده/fetch)
2. **Router/Full Route cache** (برای خروجی رندر)

در 16، مدیریت cache با `use cache`, `cacheLife`, `cacheTag` و invalidation با tag پررنگ‌تر شده است.

### 3.2 `fetch` هنوز معتبر است
روی `fetch` همچنان می‌توانید بگذارید:
- `cache: "force-cache" | "no-store"`
- `next: { revalidate, tags }`

اما در مدل جدید بهتر است default global نگذارید؛ policy را نزدیک resource تعریف کنید.

### 3.3 Invalidation در 16
- `revalidateTag("tag", "max")` => داده stale می‌شود و در درخواست بعدی refresh می‌شود.
- `updateTag("tag")` => معمولاً برای Server Action و به‌روزرسانی فوری.

---

## 4) الگوی پیشنهادی برای `src/api` شما

### 4.1 قانون اصلی
- wrapper نباید برای GET به‌صورت global `force-cache` بگذارد.
- هر endpoint خودش policy داشته باشد.

### 4.2 الگوی policy per-resource

```ts
// src/api/cache-policies.ts
export const CACHE_POLICIES = {
  publicShort: { next: { revalidate: 60, tags: ["public:short"] } },
  publicMedium: { next: { revalidate: 300, tags: ["public:medium"] } },
  realtime: { cache: "no-store" as const },
};
```

```ts
// src/api/settings/branding.ts
import { fetchApi } from "@/core/config/fetch";

const BRANDING_CACHE = { next: { revalidate: 120, tags: ["settings:branding"] } };

export const brandingApi = {
  async getSliders() {
    const res = await fetchApi.get("/settings/public/sliders/", BRANDING_CACHE);
    return res.data;
  },
};
```

### 4.3 invalidate بعد از mutation
اگر در Server Action یا Route Handler تغییر تنظیمات دارید:

```ts
import { revalidateTag } from "next/cache";

revalidateTag("settings:branding", "max");
```

برای immediate UX بعد از action:

```ts
import { updateTag } from "next/cache";

updateTag("settings:branding");
```

---

## 5) پیشنهاد دقیق برای `fetch.ts` پروژه

### 5.1 رفتار پیشنهادی
- `POST/PUT/PATCH/DELETE` => `cache: "no-store"`
- `GET` => بدون default cache اجباری؛ فقط اگر caller policy داد اعمال شود.

یعنی این بخش را حذف/تغییر دهید:
- default `force-cache` + `revalidate: 60` روی همه GET سرور

و تبدیل کنید به:
- pass-through (policy-driven)

### 5.2 نمونه ساده‌تر

```ts
if (options?.next) fetchOptions.next = options.next;
if (options?.cache) fetchOptions.cache = options.cache;
if (method !== "GET" && !options?.cache) fetchOptions.cache = "no-store";
```

نتیجه:
- کش فقط جایی فعال می‌شود که شما explicitly تعریف کرده‌اید.

---

## 6) درباره `next.config.ts` در Next 16

### 6.1 چیزهایی که باید بماند
- `cacheComponents: true`
- rewrites برای `/api/*`
- image config

### 6.2 چیزهایی که دیگر محور اصلی نیست
در App Router + cache components:
- route segment exports مثل `revalidate`, `dynamic`, `fetchCache` روش توصیه‌شده اصلی نیستند و ممکن است نادیده گرفته شوند.

پس تمرکز روی:
- `use cache`
- `cacheLife`
- `cacheTag`
- `revalidateTag` / `updateTag`

---

## 7) راهنمای عملی برای تیم (Checklist)

1. هر فایل `src/api/*` باید policy کش مشخص داشته باشد.
2. endpointهای user-specific یا auth-sensitive همیشه `no-store` باشند.
3. endpointهای public با `next.revalidate + tags` تعریف شوند.
4. بعد از mutationها tagهای مرتبط invalid شوند.
5. از default caching سراسری در wrapper اجتناب شود.
6. در dev اگر رفتار عجیب دیدید، HMR fetch cache را در نظر بگیرید (Dev-only).

---

## 8) نقشه پیشنهادی tagها برای همین پروژه

- `settings:branding`
- `settings:footer`
- `re:properties:list`
- `re:properties:detail`
- `re:properties:featured`
- `blogs:list`
- `blogs:detail`
- `portfolio:list`
- `portfolio:detail`

قاعده: `domain:resource[:scope]`

---

## 9) نتیجه برای سوال شما

برای Next.js 16 در پروژه شما:
- بله، رفتار کش نسبت به نسل قبلی عملاً به سمت Cache Components و APIs جدید رفته.
- در `api folder` باید policy-driven caching داشته باشید.
- در `fetch wrapper` default cache برای GET را global نگذارید.
- در `next.config` نگه داشتن `cacheComponents: true` درست است.

---

## منابع رسمی

- Next.js 16 Release Notes: https://nextjs.org/blog/next-16
- Fetch API (App Router): https://nextjs.org/docs/app/api-reference/functions/fetch
- Route Segment Config (و محدودیت با cache components): https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config
- Caching and Revalidating Guide: https://nextjs.org/docs/app/getting-started/caching-and-revalidating
- revalidateTag: https://nextjs.org/docs/app/api-reference/functions/revalidateTag
- updateTag: https://nextjs.org/docs/app/api-reference/functions/updateTag
- cacheTag: https://nextjs.org/docs/app/api-reference/functions/cacheTag
- cacheLife: https://nextjs.org/docs/app/api-reference/functions/cacheLife
- Cache Components: https://nextjs.org/docs/app/api-reference/directives/use-cache
- next.config.js options: https://nextjs.org/docs/app/api-reference/config/next-config-js
