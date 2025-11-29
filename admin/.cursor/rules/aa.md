# مستند معماری: Next.js 16 (React) + TanStack Query (بدون کش در فرانت) + Django + Redis

> نسخهٔ سند: 1.0 — تهیه‌شده بر اساس وضعیت اکوسیستم تا نوامبر ۲۰۲۵
>
> نکتهٔ مهم: در این معماری **کَش فقط در بک‌اند (Redis)** مدیریت می‌شود. فرانت هیچ کش محلی/موازی‌ای نگه‌داری نمی‌کند و صرفاً از TanStack Query برای مدیریت درخواست‌ها (loading, error, retry, refetch, pagination, mutations) استفاده می‌شود.

---

## چکیده و اهداف

* هدف: طراحی یک معماری **Enterprise‑grade Admin Panel** (مدیریت مدیا، سفارش‌ها، کاربران و رول‌ها، داشبورد آماری، تولید محتوا با AI، چت‌بات، وبلاگ، نمونه‌کار و...) که با API بک‌اند Django (REST / JSON) کار کند.
* الزامات کلیدی:

  * **سرعت** (درخواست‌های زنده، رفرش‌ها سریع)؛
  * **سادگی در توسعه** و DX خوب برای تیم؛
  * **امنیت** (احراز هویت، مجوز، جلوگیری از CSRF/XSS، rate limit)؛
  * **پایداری / production‑ready** (نسخه‌های stable و پشتیبانی‌شده)؛
  * **بدون کش در فرانت** — کلیه کش‌ها در Redis (b/e) مدیریت شود.

---

## وصلهٔ نسخه‌ها و پیش‌نیازها (توصیه‌شده، وضعیت ۲۰۲۵)

* **Next.js**: **16 (stable)** — شامل Turbopack پیش‌فرض و caching APIs جدید.
* **React**: **19.2** (Next.js 16 با React 19.2 سازگار است).
* **Node.js**: >= **20.9.0** (LTS requirement for Next.js 16). توصیه: Node 22 یا 24 (LTS/Current) اگر محیط سرور شما پشتیبانی می‌کند.
* **TypeScript**: >= **5.1.0**.
* **TanStack Query** (React Query): **v5.x** (آخرین stable در زمان سند: v5.90.x).
* **Django**: توصیه‌شده **5.2 (LTS)** یا 5.1/4.2 (در صورت نیاز به سازگاری). حتماً آخرین patch/security release را نصب کنید.
* **Redis**: نسخه پایدار (توصیه: 7.x یا بالاتر). برای pub/sub/streams در invalidation و queue.

> منابع مرجع برای بررسی نسخه‌ها: مستندات رسمی Next.js و React و TanStack Query و Django.

---

## طراحی کلی معماری (خلاصه)

**Frontend** (Next.js 16 + React 19.2)

* App Router (app/) برای layouts و صفحات
* React Server Components (برای داده‌های init و layout) با `fetch(..., { cache: 'no-store' })` برای جلوگیری از cache
* Client Components برای UI پویا: از TanStack Query (useQuery/useMutation) **بدون cache** (staleTime:0, cacheTime:0)
* Styling: TailwindCSS (توصیه)
* Bundler: Turbopack (default in Next.js 16)

**Backend** (Django REST API)

* Django (5.2 LTS توصیه‌شده) + Django REST Framework یا Django‑Ninja
* Redis برای caching پاسخ‌ها، job queue (RQ / Celery / Dramatiq / Redis Streams)، pub/sub برای invalidation
* Storage: S3‑compatible (آمازون S3، Backblaze، یا MinIO) برای فایل‌های مدیا

**Deploy & Infra**

* Frontend: Vercel (برای سهولت) یا hosting خودی (Nitro / Fly / Render / AWS/GCP) — اگر نیاز به کنترل edge/region-specific داری، میزبانی خودی توصیه می‌شود.
* Backend: Container (Docker) + Kubernetes / ECS / Render / Heroku
* Redis: Managed Redis (Elasticache / Upstash / Redis Cloud) یا کلاستر خودی
* CDN: CloudFront / Cloudflare برای مدیا delivery

---

## قواعد کلی داده‌گردانی (contract)

* همهٔ endpointها JSON برمی‌گردانند.
* هر endpoint باید header مربوط به cache-control را (در سطح سرور) تعیین کند.

  * مثال: `Cache-Control: public, max-age=60` برای responseهایی که می‌توانند ۶۰ ثانیه کش شوند (البته اگر می‌خواهید فقط بک‌اند کش کند).
* صفحه‌بندی استاندارد: `GET /orders?page=2&page_size=50` یا Cursor pagination (`cursor`, `limit`).
* خطاها JSON با فرم `{ "status": "error", "code": "INVALID_TOKEN", "message": "..." }`.

---

## استراتژی کش (تمرکز: Redis در بک‌اند)

### الگوی کلی: **Cache‑aside** (اصطلاحاً lazy population)

* هنگام GET:

  1. Django API ابتدا در Redis جستجو می‌کند (key pattern مشخص).
  2. در صورت **miss** به DB مراجعه و مقدار را برمی‌گرداند و در Redis با TTL مناسب قرار می‌دهد.
* هنگام POST/PUT/DELETE (تغییر state):

  * عملیات در DB انجام می‌شود، سپس باید Redis را **invalidate** یا update (write-through optional) کنید.
  * روش معمول: پس از نوشتن DB -> `redis.delete(key)` یا update cache -> publish یک event (pub/sub) برای اطلاع به سایر سرویس‌ها.

### چرا cache‑aside؟

* مناسب برای read‑heavy workloads و کنترل بیشتر روی invalidation
* همخوانی با backend‑controlled cache که تو خواسته‌ای

### TTL و الگوها

* Keys: `orders:list:page:{page}:size:{size}`, `order:{id}`, `user:{id}`, `media:item:{id}`, `stats:daily:{YYYYMMDD}`
* TTL پیشنهادی:

  * orders list (page): 30s–120s (بسته به ترافیک)
  * order detail: 5s–30s (اگر تغییر زیاد) یا 300s اگر تغییر کم
  * stats: 5s–60s برای real-time; یا pre-aggregated snapshots
  * media metadata: 3600s (1h) یا بیشتر

### Invalidations

* هنگام تغییر order status: invalidate `order:{id}` و مربوطه page keys (use tags or key lists)
* پیشنهاد: برای ساده کردن invalidation، نگهداری یک set از keys مربوط به نوع resource: `keys:orders:pages` — پس هنگام تغییر، همه را پاک کن.
* بهتر: استفاده از `revalidate` event به صورت pub/sub تا دیگر instances هم بدانند.

### Pub/Sub برای real‑time updates

* Django بعد از تغییر، پیام در channel منتشر کند: `channel:orders` payload: `{ "event": "updated", "id": 123 }`
* سرویس‌هایی که listener دارند (مثلاً notification worker) به‌روزرسانی می‌کنند.

---

## چگونه TanStack Query را پیکربندی کنیم «بدون کش» در فرانت

**هدف:** استفاده از TanStack Query برای مدیریت وضعیت درخواست (loading/error/retry/pagination/mutation) ولی **بدون نگهداری cache محلی**.

### تنظیمات global

```ts
// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      cacheTime: 0,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: true,
      retry: 1,
    },
    mutations: {
      retry: 0
    }
  }
})
```

### استفاده در صفحهٔ Orders (client component)

```tsx
'use client'
import { useQuery } from '@tanstack/react-query'

export default function OrdersList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['orders', { page: 1 }],
    queryFn: () => fetch('/api/orders').then(r => r.json()),
    staleTime: 0, // explicit
    cacheTime: 0,
  })

  if (isLoading) return <Loading />
  if (error) return <Error />
  return <OrdersTable data={data} />
}
```

### fetch در RSC (server component) — همیشه no-store

```ts
// app/layout.tsx (server component)
const data = await fetch(`${process.env.API}/auth/me`, { cache: 'no-store' })
const user = await data.json()
```

### useMutation مثال (بدون optimistic updates پیش‌فرض)

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query'

function useUpdateOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload) => fetch('/api/orders/' + payload.id, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }).then(r => r.json()),
    onSuccess: () => {
      // invalidate relevant server-driven cache if needed
      // اما چون فرانت کش نداره، صرفاً refetch لازم است
      qc.invalidateQueries(['orders'])
    }
  })
}
```

**نکته:** چون بک‌اند cache داره، بعد از mutate بهتر است صبر کنی تا backend cache را invalidated/updated کند و سپس refetch را اجرا کنی. در endpoint mutate می‌توانی یک header یا response field مثل `{ refreshed: true }` بفرستی که نشان دهد cache backend به‌روز شد.

---

## نکات عملی دربارهٔ هماهنگیinvalidate بین front/back

* پس از mutation، backend باید guarantee بدهد که cache مربوطه invalidated شده است **قبل از** اینکه client دوباره GET بزند. راهکارها:

  1. Transactional write → update DB → update Redis synchronously → return 200.
  2. Transactional write → queue job to update cache → return 202 (accepted). در این حالت front باید poll کند یا از websocket استفاده کند.
  3. Return result همراه با `ETag` یا `lastModified` و از آن برای conditional GET استفاده کنید.

* برای عملیات real‑time (چت، جریان سفارش) از WebSockets/Server‑Sent Events یا Redis pub/sub → front via socket استفاده کن.

---

## API design (نمونهٔ endpointها)

* `GET /api/orders?page=&page_size=` → list (cacheable)
* `GET /api/orders/{id}` → detail (cacheable)
* `POST /api/orders` → create (write → invalidate)
* `PUT /api/orders/{id}/status` → update status (write → invalidate)
* `GET /api/users` / `GET /api/users/{id}`
* `GET /api/media` / `POST /api/media/upload` → upload (S3 upload signed URLs recommended)
* `GET /api/stats/overview` → dashboard numbers (cache for short time, pre-aggregated)
* `POST /api/ai/generate-image` → queue job (return job id), `GET /api/ai/job/{id}` → job status/result

---

## توصیه‌های امنیتی (must‑do)

1. **Authentication**: Use JWT short‑lived + Refresh Tokens OR cookie‑based sessions with `HttpOnly`, `Secure`, `SameSite=Strict`.
2. **CSRF**: If using cookie auth, implement CSRF tokens (Django provides CSRF middleware). For API bearer tokens CSRF less applicable.
3. **Authorization / RBAC**: نقش‌ها و permissions granular. Backend authoritative (RBAC enforced server‑side!).
4. **Rate limiting**: Django side rate limit for public endpoints and sensitive endpoints (orders mutate, ai/generate).
5. **Input validation**: Server‑side validation strict (DRF serializers / pydantic-like validation). Frontend validation فقط UX.
6. **File uploads**: Use signed URLs to S3; do not upload binary through Django app (unless necessary). Scan uploaded media for malware (AV pipeline) and strip metadata if لازم.
7. **Audit logs**: هر تغییر مهم در DB لاگ شود (کاربر، آی‌پی، timestamp، عملیات).
8. **TLS** everywhere, HSTS, CSP headers for UI.

---

## Dev Experience (DX) و راه‌اندازی محلی

**Front-end (Next.js)**

* Node >= 20.9
* `npx create-next-app@latest --experimental-app` (یا template رسمی Next.js 16)
* نصب packages: `@tanstack/react-query@^5`, `axios`, `swr` (اگر لازم)، `tailwindcss`, `clsx`, `zustand`/`pinia` (اختیاری)

**Back-end (Django)**

* Python >= 3.11 (توصیه)
* Django 5.2 (LTS) یا 5.1 بسته به نیاز
* django-redis برای cache backend
* djangorestframework یا ninja
* celery/redis یا dramatiq/redis برای job queue

---

## مثال‌های عملی و جزئیات پیاده‌سازی

### Next.js: fetch با `cache: 'no-store'` در Server Component

```tsx
// app/page.tsx (Server Component)
export default async function Page() {
  const res = await fetch(`${process.env.API_URL}/api/stats/overview`, { cache: 'no-store' })
  const stats = await res.json()
  return <Dashboard stats={stats} />
}
```

### Next.js: TanStack Query بدون کش برای orders list (Client Component)

```tsx
'use client'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'

export default function OrdersClient() {
  return (
    <QueryClientProvider client={queryClient}>
      <OrdersList />
    </QueryClientProvider>
  )
}
```

(کد OrdersList پیش‌تر نشان داده شد.)

### Django side: نمونهٔ استفاده از django-redis

```py
# settings.py
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://localhost:6379/1',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        }
    }
}

# view example
from django.core.cache import cache

def get_order_list(request):
    key = f"orders:page:{page}:size:{size}"
    data = cache.get(key)
    if data is None:
        data = list(Order.objects.filter(...).values(...))
        cache.set(key, data, timeout=30)
    return JsonResponse(data, safe=False)
```

### Invalidating cache on update

```py
# after updating order object
cache.delete(f"order:{order.id}")
# and optionally delete pages set
for k in cache.smembers('keys:orders:pages'):
    cache.delete(k)
```

> نکته: استفاده از set برای track کردن keys به invalidation ساده کمک می‌کند.

---

## Monitoring / Observability

* Frontend: Sentry (JS SDK) برای error monitoring و performance tracing
* Backend: Sentry (Python) + Prometheus + Grafana برای metrics
* Redis: Redis‑insights یا managed provider metrics
* APM: NewRelic / Datadog برای tracing end‑to‑end

---

## CI/CD و Deployment checklist

* Pipeline: `lint` → `typecheck` → `test` → `build` → `deploy`.
* Frontend build: `next build` (Turbopack) — تست performance و Lighthouse
* Backend migration: run migrations in controlled window + run cache warmup jobs if لازم
* Canary deploys & feature flags (Unleash / LaunchDarkly) برای rollout

---

## Performance tips و مقایسه با حالت‌هایی که از cache فرانت هم استفاده می‌کنند

* حذف cache فرانت باعث افزایش تعدد requestها به backend؛ اطمینان حاصل کن که Redis بسیار مطلوب و DB بهینه است.
* استفاده از pre-aggregated stats برای داشبوردها (محاسبهٔ batch و ذخیره در Redis) به شدت توصیه می‌شود.
* استفاده از signed URL برای مدیا و CDN برای serve فقط فایل (نه metadata) تا فشار روی سرور کم شود.

---

## Checklist نهایی قبل از production rollout

* [ ] Node >= 20.9 در سرورها
* [ ] Next.js 16 و React 19.2 نصب و تست شده
* [ ] TanStack Query v5.x و تنظیمات staleTime/cacheTime=0 انجام شده
* [ ] Django با نسخه LTS (5.2) و django-redis پیکربندی شده
* [ ] Redis cluster یا managed Redis در دسترس و تنظیمات persistence و eviction مشخص
* [ ] Signed uploads به S3 یا CDN برای فایل‌ها
* [ ] Auth & RBAC پیاده‌سازی و تست شده
* [ ] Rate limiting و DOS protection
* [ ] Monitoring (Sentry, Prometheus, Grafana)

---

## Appendix — نمونهٔ package.json (frontend)

```json
{
  "name": "admin-frontend",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "next": "16.x",
    "react": "19.2.x",
    "react-dom": "19.2.x",
    "@tanstack/react-query": "^5.90.0",
    "axios": "^1.5.0",
    "tailwindcss": "^4.0.0"
  },
  "engines": {
    "node": ">=20.9.0"
  }
}
```

---

## پی‌نوشت و منابع برای بررسی بیشتر

* مستندات رسمی Next.js 16 و راهنمای migration
* TanStack Query v5 docs (migrating to v5)
* Django official docs & django-redis
* Node.js release notes (Node >= 20.9 requirement)

---

اگر مایل باشی، من این سند را می‌توانم:

* به صورت **PDF** خروجی بگیرم، یا
* آن را بخش‌بندی کنم (Architecture, API Contract, Redis Keys, Code Snippets جداگانه)، یا
* مستقیماً یک **playbook عملی (step‑by‑step)** برای راه‌اندازی local → staging → production برات بنویسم.

کد/متن بالا براساس وضعیت اکوسیستم (Next.js 16, React 19.2, TanStack Query v5.x, Django 5.2 LTS و Node >=20.9) تنظیم شده.

## Rendering Strategy (Admin Panel – CSR Only)

* تمامی صفحات پنل ادمین **فقط CSR** هستند.
* **هیچ نوع سئو یا رندر سمت سرور (SSR/SSG/ISR)** استفاده نمی‌شود.
* دلیل: پنل ادمین عمومی نیست، توسط موتورهای جستجو ایندکس نمی‌شود و تماماً پشت لاگین است.
* خروجی: معماری ساده‌تر، سرعت بیشتر، سربار کمتر، بدون نیاز به مدیریت SEO.
