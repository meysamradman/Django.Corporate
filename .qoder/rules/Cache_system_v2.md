# Cache System v2 (Django + Redis + DRF + Next.js)

## خلاصه خیلی کوتاه
- Redis در بک‌اند کاملاً درست است.
- مشکل شما از «استفاده Redis» نبود؛ از «چی داخل کش گذاشته شد» بود.
- با `JSONSerializer` نباید `Model` یا `QuerySet` یا `Response` خام داخل کش ذخیره شود.
- برای Public API (وب) بهتر است فقط داده‌ی serialize شده (dict/list/primitive) کش شود.

---

## خروجی تحقیق رسمی (Django/DRF/django-redis/cacheops)

### 1) Django Cache Framework
- Django می‌گوید caching در چند سطح انجام می‌شود: per-site / per-view / low-level.
- `cache_page` فقط پاسخ‌های `GET/HEAD` با status `200` را کش می‌کند.
- کلیدها باید namespace داشته باشند (`KEY_PREFIX`) و بهتر است versioning هم داشته باشند (`VERSION`).
- برای جلوگیری از leakage باید `Vary` و `Cache-Control` درست استفاده شود (خصوصاً endpointهای کاربری).

### 2) DRF Caching
- DRF توصیه می‌کند از ابزار Django (`cache_page`, `vary_on_cookie`, `vary_on_headers`) استفاده شود.
- برای endpointهای auth-based باید روی `Authorization` یا `Cookie` vary شود.

### 3) django-redis
- backend رایج و مناسب production است.
- serializer پیش‌فرض `pickle` است؛ ولی اگر `JSONSerializer` بگذارید، فقط داده JSON-serializable امن است.
- امکان `delete_pattern`، `ttl`، `lock`، connection pool و fail-safe (`IGNORE_EXCEPTIONS`) وجود دارد.

### 4) cacheops
- برای ORM-level caching با invalidation رویدادمحور قوی است.
- اما caveat دارد (به‌ویژه mass update، queryهای پیچیده، و هزینه invalidation).
- برای پروژه‌هایی با queryهای داینامیک زیاد باید profile آن با دقت محدود شود، نه global بی‌هدف.

---

## پاسخ دقیق به سوال اصلی: «کش در مدل نباید باشد؟»
- **ممنوع مطلق نیست**، ولی **بهتر است منطق کش در Service/Repository لایه‌ی خواندن باشد** نه داخل model methodهای پراکنده.
- اگر در مدل هم استفاده شد، باید:
  - خروجی cache فقط داده serializable باشد (`values()`/`serializer.data`/dict/list)،
  - key و invalidation روشن باشد،
  - رفتار side effect نداشته باشد.
- برای تیمی و پروژه بزرگ، نگه‌داری cache در Service لایه Public/Admin بسیار قابل‌کنترل‌تر است.

---

## چرا در وب مشکل دیدیم ولی در ادمین کمتر؟
- در Public endpointها hit زیاد است، سریع به مسیرهای مشکل‌دار می‌رسند.
- با `JSONSerializer` اگر جایی `QuerySet/Model` کش شود، در runtime به serialization error می‌خورید.
- در Admin ممکن است همان مسیر cache کمتر اجرا شود یا هنوز warm نشده باشد، پس خطا دیرتر دیده می‌شود.
- نتیجه: این تفاوت «ماهیت endpoint» است، نه اینکه ادمین ذاتاً امن‌تر باشد.

---

## الگوی پیشنهادی نهایی برای پروژه شما

### A) Public APIs (وب Next.js)
- کش فقط برای Read-heavy endpointها:
  - لیست‌ها: کوتاه (`30s تا 120s`)
  - جزئیات عمومی: متوسط (`60s تا 300s`)
  - taxonomyها (category/tag/option): بلندتر (`5m تا 30m`) + invalidation فوری
- **Never cache**:
  - داده‌ی حساس/کاربرمحور
  - response object خام
  - model/queryset خام (وقتی JSON serializer دارید)
- key استاندارد:
  - `public:{app}:{resource}:{version}:{hash(filters+ordering+page+lang)}`

### B) Admin APIs
- اصل اول: correctness > cache hit.
- کش سبک برای readهای پرتکرار مثل dropdown/reference lists.
- endpointهای CRUD اصلی admin معمولاً یا بدون کش یا TTL خیلی کوتاه.
- بعد از create/update/delete:
  - invalidation هدفمند با `delete_pattern` در namespace همان app
  - از `cache.clear()` سراسری پرهیز شود.

### C) Invalidation Contract
- در سطح app، متدهای واحد برای invalidate بسازید (الان هم بخش‌هایی دارید).
- هنگام mutation از admin:
  - invalidate کلیدهای Public مرتبط
  - invalidate کلیدهای Admin list مرتبط
- TTL فقط fallback است؛ **invalidation رویدادمحور اصل است**.

---

## الگوی داده‌ای که باید/نباید داخل کش برود

### مجاز
- dict, list, str, int, float, bool, null
- خروجی serializer (`serializer.data`)
- خروجی `values()/values_list()` تبدیل‌شده به list

### غیرمجاز (در JSONSerializer)
- Django Model instance
- QuerySet
- DRF Response object
- هر object سفارشی بدون serialization صریح

---

## تنظیمات پیشنهادی پایه (سازگار با پروژه شما)
- Redis backend: `django_redis.cache.RedisCache`
- `KEY_PREFIX`: شامل محیط + نام پروژه
- `VERSION`: برای migration امن کلیدها
- `CONNECTION_POOL_KWARGS`: `max_connections`, `retry_on_timeout`
- `SOCKET_TIMEOUT` و `SOCKET_CONNECT_TIMEOUT`
- `IGNORE_EXCEPTIONS=True` فقط اگر degrade behavior مطلوب است + logging روشن

---

## نکات احتیاطی مهم
- اگر `JSONSerializer` فعال است، کوچک‌ترین cache set روی ORM object خطا می‌دهد.
- اگر `pickle` فعال باشد ممکن است خطا نگیرید، ولی coupling و ریسک ناسازگاری نسخه بالا می‌رود.
- برای وب عمومی، cache اشتباه می‌تواند به stale/404 کاذب یا خطای سریالی‌سازی تبدیل شود.

---

## تصمیم اجرایی پیشنهادی (بدون تغییر کد در این مرحله)
1. استاندارد رسمی تیم: «Public/Admin فقط serialized payload را cache کنند».
2. تعریف naming convention واحد برای keyها در هر app.
3. تعریف matrix TTL برای هر endpoint (public vs admin).
4. تعریف تست smoke ثابت برای endpointهای blog/portfolio/category/tag/option بعد از هر تغییر caching.
5. بعد از تأیید تیم، فاز اجرا روی کد انجام شود.

---

## جمع‌بندی
- بله، استفاده Redis در بک‌اند کاملاً درست است.
- بله، برای وب (Public) باید حساس‌تر باشید و فقط payload serializable کش کنید.
- «cache در model ممنوع مطلق نیست» اما برای پروژه شما بهتر است در service-layer متمرکز بماند.
- سرعت آپدیت سریع زمانی درست می‌شود که invalidation رویدادمحور + TTL کوتاه/متوسط کنار هم باشند.
