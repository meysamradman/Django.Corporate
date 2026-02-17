---
description: Cache strategy policy for Django + DRF + Redis + Admin + Web
# applyTo: '**/*'
---

# Cache Strategy — قرارداد رسمی تیم

> **استک:** Django + DRF + Redis + React Vite (Admin) + Next.js (وب)
> **آخرین بروزرسانی:** 2026

---

## ۱. معماری کلی — Source of Truth

```
┌─────────────────────────────────────────────────────┐
│                   Django + Redis                    │
│           ← Source of Truth اصلی کش               │
└────────────────────┬────────────────────────────────┘
					 │ invalidate / revalidate
		  ┌──────────┴──────────┐
		  ▼                     ▼
   Next.js (وب)         React Vite (Admin)
   fetch + revalidate    React Query
   فقط HTML/SEO          فقط UI state
```

**قانون اول:** هیچ‌وقت دو لایه به‌صورت موازی و مستقل کش نمی‌کنند. Redis اصله، بقیه فقط presentation.

---

## ۲. هر لایه چه می‌کند؟

| لایه | ابزار | نقش | مجاز؟ |
|------|-------|------|--------|
| Django Backend | Redis | کش واقعی داده‌ها | ✅ اصلی |
| Next.js | `fetch revalidate` / `revalidateTag` | کش HTML برای SEO | ⚠️ محدود |
| React Vite (Admin) | React Query | کش UI/request dedup | ⚠️ TTL کوتاه |
| React state / localStorage | — | هرگز | ❌ ممنوع |

---

## ۳. Redis — چی ذخیره می‌شود؟

### ✅ مجاز

```python
# فقط این‌ها داخل Redis برن
serializer.data            # خروجی DRF Serializer
list(qs.values())          # QuerySet تبدیل‌شده به list
{"key": "value"}         # dict خالص
[1, 2, 3]                  # list خالص
"string", 42, True        # primitive
```

### ❌ ممنوع — با JSONSerializer خطای runtime می‌دهد

```python
MyModel.objects.all()       # QuerySet
MyModel.objects.get(pk=1)   # Model instance
Response(data)              # DRF Response object
SomeClass()                 # هر object سفارشی
```

---

## ۴. کش کجا نوشته می‌شود؟ (Service Layer)

### ❌ اشتباه — در Model

```python
class Property(models.Model):
	@classmethod
	def get_cached_list(cls):
		# ❌ coupling شدید، invalidation سخت
		return cache.get_or_set("list", cls.objects.all(), 60)
```

### ❌ اشتباه — در Serializer

```python
class PropertySerializer(serializers.ModelSerializer):
	def to_representation(self, instance):
		# ❌ serializer نباید IO/cache داشته باشد
		cached = cache.get(f"prop:{instance.pk}")
		...
```

### ✅ درست — در Service Layer

```python
# services/property_service.py

class PropertyPublicService:
	PREFIX = "public:property"

	@classmethod
	def get_list(cls, filters: dict) -> list:
		key = cls._build_key("list", filters)
		cached = cache.get(key)
		if cached is not None:
			return cached

		qs = Property.objects.filter(**filters).select_related("category")
		data = list(PropertyListSerializer(qs, many=True).data)  # فقط .data
		cache.set(key, data, timeout=120)
		return data

	@classmethod
	def get_detail(cls, pk: int) -> dict | None:
		key = f"{cls.PREFIX}:detail:{pk}"
		cached = cache.get(key)
		if cached is not None:
			return cached

		try:
			obj = Property.objects.select_related("category").get(pk=pk)
		except Property.DoesNotExist:
			return None

		data = dict(PropertyDetailSerializer(obj).data)
		cache.set(key, data, timeout=300)
		return data

	@classmethod
	def invalidate_list(cls):
		invalidate_by_prefix(f"{cls.PREFIX}:list")

	@classmethod
	def invalidate_detail(cls, pk: int):
		cache.delete(f"{cls.PREFIX}:detail:{pk}")

	@classmethod
	def _build_key(cls, resource: str, params: dict) -> str:
		import hashlib, json
		h = hashlib.sha256(
			json.dumps(params, sort_keys=True, ensure_ascii=False).encode()
		).hexdigest()[:10]
		return f"{cls.PREFIX}:{resource}:{h}"


# ─── utils/cache_helpers.py ───────────────────────────────────────────────────
# این helper را در core/utils قرار بده — همه Service ها از اینجا استفاده کنند

from django.core.cache import cache

def invalidate_by_prefix(prefix: str) -> None:
	"""
	همه کلیدهایی که prefix مشخص دارند را حذف می‌کند.
	از django-redis delete_pattern استفاده می‌کند.
	تست‌پذیر است چون cache را mock می‌توان کرد.
	"""
	cache.delete_pattern(f"*{prefix}*")
```

---

## ۵. Invalidation — بعد از هر Mutation

**اصل طلایی:** TTL فقط fallback است — invalidation رویدادمحور اصل است.

```python
# views/property_views.py

class PropertyViewSet(viewsets.ModelViewSet):

	def perform_create(self, serializer):
		instance = serializer.save()
		PropertyPublicService.invalidate_list()
		PropertyAdminService.invalidate_list()

	def perform_update(self, serializer):
		instance = serializer.save()
		PropertyPublicService.invalidate_detail(instance.pk)
		PropertyPublicService.invalidate_list()
		PropertyAdminService.invalidate_list()

	def perform_destroy(self, instance):
		pk = instance.pk
		instance.delete()
		PropertyPublicService.invalidate_detail(pk)
		PropertyPublicService.invalidate_list()
		PropertyAdminService.invalidate_list()
```

### ❌ ممنوع

```python
cache.clear()  # سراسری — هرگز استفاده نشود
```

### ✅ درست

```python
cache.delete_pattern("public:property:*")   # هدفمند
cache.delete("public:property:detail:42")   # دقیق
```

---

## ۶. Key Naming Convention

```
{scope}:{app}:{resource}:{identifier_or_hash}
```

| مثال | توضیح |
|------|-------|
| `public:property:list:a3f1b2c4` | لیست property عمومی با فیلتر hash شده |
| `public:property:detail:42` | جزئیات property با pk=42 |
| `public:blog:list:fa2c9e11` | لیست بلاگ عمومی |
| `admin:property:list:b7d3a1f9` | لیست property پنل ادمین |
| `public:taxonomy:category:all` | همه دسته‌بندی‌ها |

---

## ۶.۱ ساختار فایل‌ها (الزامی برای هر اپ)

برای جلوگیری از تکرار، coupling و خطای invalidate، ساختار کش هر اپ باید این باشد:

```text
src/<app>/utils/
	cache_shared.py   # helper مشترک (hash payload, common helpers)
	cache_public.py   # کلیدها و manager مربوط به public
	cache_admin.py    # کلیدها و manager مربوط به admin
	cache.py          # facade/re-export برای backward compatibility
```

قواعد:

- `public` و `admin` در یک فایل سنگین ادغام نشوند.
- helper تکراری فقط در `cache_shared.py` باشد.
- import جدید در سرویس‌ها مستقیم از `cache_public` یا `cache_admin` انجام شود.
- فایل `cache.py` فقط نقش facade داشته باشد تا importهای قدیمی نشکنند.

---

## ۷. Matrix TTL

| نوع Endpoint | TTL | توضیح |
|---|---|---|
| Public list | 30–120s | پر بازدید، کوتاه برای freshness |
| Public detail | 60–300s | کمتر تغییر می‌کند |
| Taxonomy (category/tag/option) | 5–30m | + invalidation فوری هنگام تغییر |
| Admin list | 10–30s | correctness مهم‌تر از cache hit |
| Admin CRUD endpoints | بدون کش | همیشه fresh |

---

## ۸. Next.js — نحوه استفاده درست

### ✅ مجاز — ISR برای صفحات عمومی

```typescript
// app/properties/page.tsx
async function getProperties() {
  const res = await fetch(`${process.env.API_URL}/api/properties/`, {
	next: {
	  revalidate: 60,         // هر ۶۰ ثانیه
	  tags: ["properties"],  // برای on-demand invalidation
	},
  })
  return res.json()
}
```

### ✅ مجاز — On-demand revalidation از بک‌اند

```typescript
// app/api/revalidate/route.ts
import { revalidateTag } from "next/cache"

export async function POST(request: Request) {
  const { tag, secret } = await request.json()

  if (secret !== process.env.REVALIDATE_SECRET) {
	return Response.json({ error: "unauthorized" }, { status: 401 })
  }

  revalidateTag(tag)  // مثلاً "properties" یا "blog"
  return Response.json({ revalidated: true })
}
```

```python
# Django: بعد از mutation، Next.js را notify کن
import requests

def notify_nextjs_revalidate(tag: str):
	try:
		requests.post(
			f"{settings.NEXTJS_URL}/api/revalidate",
			json={"tag": tag, "secret": settings.REVALIDATE_SECRET},
			timeout=2,
		)
	except Exception:
		pass  # fail silently — Redis TTL جبران می‌کند
```

### ❌ ممنوع در Next.js

```typescript
// هرگز داده mutation را cache نکنید
fetch("/api/create-property", { cache: "force-cache" })  // ❌

// هرگز برای consistency به Next cache تکیه نکنید
// اگر Redis invalidate شد، Next.js هم باید revalidate شود
```

> 🔴 **قانون طلایی:** Next.js یک **consumer cache** است — فقط HTML می‌سازد.
> Redis یک **authoritative cache** است — داده واقعی اینجاست.
> این دو هرگز نباید جای هم را بگیرند.

---

## ۹. React Vite (Admin Panel)

Admin به **React Query** نیاز دارد، نه Redis. اینجا کش فقط برای جلوگیری از request تکراری است.

```typescript
// hooks/useProperties.ts
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"

export function usePropertyList(filters: PropertyFilters) {
  return useQuery({
	queryKey: ["admin", "properties", filters],
	queryFn: () => propertyApi.getList(filters),
	staleTime: 0,       // admin همیشه fresh می‌خواهد
	gcTime: 30_000,     // ۳۰ ثانیه در memory نگه می‌دارد
  })
}

export function useUpdateProperty() {
  const queryClient = useQueryClient()

  return useMutation({
	mutationFn: propertyApi.update,
	onSuccess: () => {
	  // بعد از update، همه query های property را invalidate کن
	  queryClient.invalidateQueries({ queryKey: ["admin", "properties"] })
	},
  })
}
```

---

## ۱۰. تنظیمات Redis پیشنهادی

```python
# config/django/base.py

CACHES = {
	"default": {
		"BACKEND": "django_redis.cache.RedisCache",
		"LOCATION": env("REDIS_URL", default="redis://127.0.0.1:6379/1"),
		"OPTIONS": {
			"CLIENT_CLASS": "django_redis.client.DefaultClient",
			"SERIALIZER": "django_redis.serializers.json.JSONSerializer",
			"CONNECTION_POOL_KWARGS": {
				"max_connections": 50,
				"retry_on_timeout": True,
			},
			"SOCKET_TIMEOUT": 5,
			"SOCKET_CONNECT_TIMEOUT": 5,
			"IGNORE_EXCEPTIONS": True,  # اگر Redis down بود، سایت crash نکند
		},
		"KEY_PREFIX": f"{env('ENV', default='dev')}:myproject",
		"VERSION": 1,
		"TIMEOUT": 300,
	}
}
```

> ⚠️ `IGNORE_EXCEPTIONS=True` فعال است — یعنی اگر Redis قطع شود، cache miss می‌گیرید نه خطا. **Logging اجباری است** وگرنه Redis down می‌شود، performance می‌ریزد و کسی نمی‌فهمد چرا.

```python
# config/django/logging.py — حتماً این را اضافه کنید
LOGGING = {
	"loggers": {
		"django_redis": {
			"handlers": ["console", "sentry"],  # یا هر handler که دارید
			"level": "ERROR",
			"propagate": True,
		},
	},
}
```

---

## ۱۱. چک‌لیست اجرایی تیم

### قبل از هر cache گذاشتن:

- [ ] خروجی فقط `dict/list/primitive` است؟
- [ ] Key از convention استاندارد پیروی می‌کند؟
- [ ] TTL مناسب endpoint انتخاب شده؟
- [ ] Invalidation بعد از create/update/delete نوشته شده؟
- [ ] در Service Layer است نه Model/Serializer؟

### قبل از deploy:

- [ ] smoke test روی endpointهای public (blog/property/category/tag)
- [ ] تست invalidation بعد از یک mutation از ادمین
- [ ] بررسی که `cache.clear()` در هیچ کجا استفاده نشده باشد

---

## ۱۲. چرا Admin دیرتر به مشکل می‌خورد؟

این سوال مهمیه. Admin اشکال ذاتی ندارد — فقط:

- Admin hit کمتری دارد → cache کمتر warm می‌شود
- وقتی cache warm نیست → همیشه از DB می‌خواند → خطای serialization ظاهر نمی‌شود
- Public endpointها hit زیاد دارند → cache سریع warm می‌شود → اگر چیز اشتباهی کش شده باشد (مثل QuerySet)، سریع به خطا می‌خورید

**نتیجه:** این تفاوت معماری است، نه اینکه Admin ذاتاً امن‌تر باشد.

---

## ۱۳. گام‌های بعدی (Optional — فاز بعد)

اینها الان اجباری نیستند ولی برای پروژه‌های در حال رشد ارزش دارند:

| آیتم | توضیح |
|------|-------|
| Cache hit/miss metrics | با `django-prometheus` یا Sentry performance |
| Feature flag برای cache | خاموش کردن cache یک endpoint بدون deploy |
| Unit test برای invalidation | mock کردن `cache.delete_pattern` در tests |
| Cache warming | بعد از deploy، endpointهای پرتکرار را pre-warm کن |

---

## ۱۴. Rollout یکپارچه برای همه اپ‌ها (الزامی)

این بخش برای اجرای یکدست در `blog`, `portfolio`, `real_estate`, `page`, `ticket`, ... الزامی است.

### ترتیب ثابت اجرا در هر اپ

1. ساختار فایل کش را طبق بند `۶.۱` ایجاد کن (`cache_shared`, `cache_public`, `cache_admin`, `cache`).
2. endpointهای `public` را در service layer با serializer `.data` کش کن.
3. endpointهای `admin list` را با TTL کوتاه کش کن؛ `admin CRUD` بدون کش بماند.
4. تمام mutationها (`create/update/delete/status/bulk/media`) را به invalidation هدفمند وصل کن.
5. در صورت استفاده از Next.js ISR، revalidate tag/path را بعد از mutation فعال کن.

### Definition of Done هر اپ

- بعد از mutation، اولین request دیتای تازه برگرداند.
- keyها فقط با convention استاندارد (`{scope}:{app}:{resource}:{id/hash}`) باشند.
- هیچ cache IO در model/serializer وجود نداشته باشد.
- هیچ `cache.clear()` در اپ استفاده نشده باشد.
- smoke test: list/detail public + list admin + یک mutation end-to-end پاس شود.

### Rule تغییرات

- هر اپ قبل از merge باید همین DoD را پاس کند.
- هر exception فقط با ثبت در همین سند و دلیل فنی قابل قبول است.

---

## جمع‌بندی یک‌خطی

> **Redis کش داده، Next.js کش HTML، React Query کش request. هیچ‌کدام جای دیگری را نمی‌گیرند.**
