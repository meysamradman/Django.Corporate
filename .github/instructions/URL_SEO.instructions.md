---
description: Describe when these instructions should be loaded
# applyTo: 'Describe when these instructions should be loaded' # when provided, instructions will automatically be added to the request context when the pattern matches an attached file
---
📄 URL Architecture Contract — Admin vs Public (2026)

Stack

Backend: Django + DRF + Redis

Frontend Public: Next.js (App Router)

Admin Panel: React / Next / Vite (SEO = ❌)

🎯 هدف کلان
بخش	هدف
ADMIN	حداکثر سرعت، سادگی، امنیت
PUBLIC	SEO، UX، URL پایدار، share-friendly

❗ قانون طلایی:
Admin = ID only
Public = ID + Slug

1️⃣ تفکیک فیزیکی URL در Backend
ساختار بک‌اند (اجباری)
/api/
 ├── admin/
 │    └── ...
 └── public/
      └── ...

2️⃣ ADMIN — پنل ادمین (SEO = صفر)
اصول ADMIN

❌ SEO مهم نیست

❌ slug ممنوع

✅ فقط ID

✅ سریع‌ترین Query

✅ cache ساده

✅ Redis-friendly

✅ URL های Admin
/api/admin/properties/3515221/
/api/admin/blogs/92287/
/api/admin/users/18/

❌ ممنوع در Admin
/api/admin/properties/3515221/luxury-apartment
/api/admin/blogs/real-estate-2026

دلیل فنی

PK lookup → سریع‌ترین

بدون ambiguity

بدون redirect

بدون slug sync

مناسب bulk operations

Redis (Admin)
admin:property:3515221
admin:blog:92287

3️⃣ PUBLIC — وب‌سایت (SEO محور)
اصول PUBLIC

✅ SEO مهم

✅ URL خوانا

✅ slug الزامی

✅ canonical

✅ redirect slug اشتباه

4️⃣ PUBLIC — صفحات Detail (استاندارد نهایی)
✅ الگوی نهایی
/{entity}/{id}/{slug}

مثال
/property/3515221/luxury-apartment-ocean-view
/blog/92287/real-estate-market-2026

رفتار PUBLIC

id از URL خوانده می‌شود

Backend فقط با id lookup می‌کند

slug واقعی از response می‌آید

اگر slug اشتباه بود → 301 Redirect

if (params.slug !== data.slug) {
  redirect(`/property/${params.id}/${data.slug}`)
}

Redis (Public)
public:property:3515221
public:blog:92287

5️⃣ PUBLIC — صفحات List / Category
اصل 2026

Hierarchy با Path، Filter با Query

✅ Path (SEO indexable)
/rent
/buy
/tehran/rent
/tehran/buy/apartment

✅ Filter (SEO محدود)
/tehran/buy/apartment?roomCount=1&priceMax=5000000

SEO Rule

canonical → نسخه بدون query

اغلب:

<meta name="robots" content="noindex, follow" />

6️⃣ تفاوت Admin vs Public (خلاصه جدولی)
مورد	ADMIN	PUBLIC
SEO	❌	✅
URL	ID only	ID + slug
Redirect	❌	✅
Canonical	❌	✅
Redis key	ساده	پایدار
Performance	حداکثری	کنترل‌شده
7️⃣ چرا این تصمیم درست است؟
Admin

کاربر = داخلی

URL share نمی‌شود

سرعت از هر چیزی مهم‌تر

slug فقط سربار است

Public

Google + User

URL باید قابل فهم باشد

slug برای CTR و trust

ID برای performance و scale

8️⃣ قوانین تیم (Non-Negotiable)

❌ استفاده از slug در Admin ممنوع

❌ lookup بر اساس slug ممنوع

✅ ID همیشه source of truth

✅ slug فقط cosmetic

✅ redirect فقط در Public

✅ cache فقط روی data (نه QuerySet / Model)

9️⃣ جمله قفل معماری (برای README)

Admin برای سیستم ساخته می‌شود،
Public برای انسان و گوگل.
هر کدام قانون خودش را دارد.

---

## 🔟 الحاقیه دائمی (الزامی) — اجرای واقعی در Next.js 16 + Django

این بخش مکمل قرارداد بالاست و باید همیشه رعایت شود.

### A) Public Detail باید **واقعاً با id** لود شود (نه با slug)

برای جلوگیری از loop، mismatch و خطاهای encode:

- URL صفحه وب: `/{entity}/{id}/{slug}`
- در Next.js صفحه detail باید data را با `id` بگیرد.
- slug فقط برای SEO و زیبایی URL است.
- redirect فقط وقتی لازم است که `id` اشتباه باشد.

❌ الگوی پرریسک:
- گرفتن دیتای detail با `slug` داخل route `id/slug`
- redirect بر اساس مقایسه‌های ناپایدار روی slug

✅ الگوی صحیح:
- Backend endpoint: `/api/{entity}/id/{id}/`
- Frontend fetch: `getByNumericId(id)`
- در صورت id mismatch → `permanentRedirect(canonical)`

### B) رفتار canonical redirect در Next.js 16

- از `permanentRedirect` برای canonical استفاده شود.
- مسیر redirect باید معتبر URL-safe باشد.
- برای segmentهای فارسی یا کاراکتر خاص، از `encodeURIComponent` استفاده شود.
- redirect loop ممنوع است؛ شرط redirect باید deterministic باشد.

### C) قرارداد Serializer Public (برای همه اپ‌ها)

در list و detail عمومی این فیلدها باید **حتماً** باشند:

- `id` (int)
- `public_id` (uuid)
- `slug` (string)

بدون `id`، فرانت ناچار به fallback روی `public_id` می‌شود و URL canonical ناقص/غیراستاندارد می‌گردد.

### D) قرارداد View/Service/Caching در Backend

برای هر entity عمومی (blog/property/portfolio/...):

1. Service:
  - `get_detail_by_id_data(id)`
2. ViewSet Action:
  - `GET /api/{entity}/id/{id}/`
3. Cache Key:
  - `public:{app}:{entity}:detail:id:{id}`
4. Legacy compatibility (اختیاری):
  - detail by `slug`
  - detail by `public_id`

### E) قوانین Cache + Freshness (Public Web)

- Source of Truth داده: Redis در Backend
- Next cache فقط برای HTML/SEO
- بعد از mutation در Admin:
  - invalidate کلیدهای detail/list در Redis
  - notify برای revalidation در Next (tag/path)

TTL پیشنهادی:
- Public list: `30-120s`
- Public detail: `60-300s`
- Taxonomy: `5-30m` + invalidate فوری هنگام تغییر

### F) قوانین Throttle (برای اینکه وب خالی/کند نشود)

- throttle امنیتی باید روی endpointهای حساس باشد:
  - login / captcha / security-sensitive
- throttle global روی همه endpointهای public می‌تواند باعث:
  - `429`
  - empty UI
  - refresh loop سمت کاربر

الزام:
- `DRF_ENABLE_GLOBAL_THROTTLE` باید قابل کنترل env باشد.
- در dev پیش‌فرض safe و بدون شکستن Public باشد.

### G) چک‌لیست اجرای همین قرارداد برای همه اپ‌ها

#### Backend
- [ ] serializer public شامل `id/public_id/slug`
- [ ] endpoint جدید `id/{id}` برای detail
- [ ] service + cache key برای detail:id
- [ ] invalidation کامل list/detail بعد از mutation

#### Frontend Web
- [ ] route detail فقط `[{id}]/[{slug}]`
- [ ] fetch detail با `id` (نه slug)
- [ ] redirect فقط برای canonical id mismatch
- [ ] لینک کارت‌ها/لیست‌ها: `/{entity}/{id}/{slug}`

#### SEO
- [ ] metadata سروری فعال
- [ ] canonical یکتا
- [ ] بدون redirect loop

### H) مهاجرت فازبندی‌شده (الگوی تیم)

1. Blog ✅
2. Real Estate
3. Portfolio
4. سایر public modules
5. پاکسازی routeهای legacy بعد از اطمینان کامل

### I) جمله قفل اجرایی

در Public، URL باید `id + slug` باشد،
اما lookup واقعی همیشه با `id` انجام شود.

### J) استاندارد اختصاصی Blog (Post + Category + Tag)

این بخش برای جلوگیری از ناهماهنگی URL/Cache در وبلاگ الزامی است.

#### Blog Post

- Web list: `/blogs`
- Web detail canonical: `/blogs/{id}/{slug}`
- API list: `/api/blog/`
- API detail by id (استاندارد): `/api/blog/id/{id}/`
- API detail by slug (legacy): `/api/blog/{slug}/`
- API detail by public_id (legacy): `/api/blog/p/{public_id}/`

Cache keys:
- `public:blog:list:{hash}`
- `public:blog:detail:id:{id}`
- `public:blog:detail:slug:{slug}` (legacy)
- `public:blog:detail:public_id:{public_id}` (legacy)

#### Blog Category

- Web category list/filter page باید slug-based و SEO-friendly باشد.
- API category list: `/api/blog-category/`
- API category detail by id (استاندارد): `/api/blog-category/id/{id}/`
- API category detail by slug (legacy): `/api/blog-category/{slug}/`

Cache keys:
- `public:blog:category:list:{hash}`
- `public:blog:category:detail:id:{id}`
- `public:blog:category:detail:slug:{slug}`

#### Blog Tag

- Web tag list/filter page باید slug-based و SEO-friendly باشد.
- API tag list: `/api/blog-tag/`
- API tag detail by id (استاندارد): `/api/blog-tag/id/{id}/`
- API tag detail by slug (legacy): `/api/blog-tag/{slug}/`

Cache keys:
- `public:blog:tag:list:{hash}`
- `public:blog:tag:detail:id:{id}`
- `public:blog:tag:detail:slug:{slug}`

#### Blog invalidation matrix (الزامی)

- تغییر پست: invalidate پست detail + لیست پست + لیست‌های category/tag مرتبط
- تغییر category: invalidate detail category + list category + list پست‌های متاثر
- تغییر tag: invalidate detail tag + list tag + list پست‌های متاثر

### K) استاندارد اختصاصی Portfolio (نمونه‌کار)

#### Portfolio Item

- Web list: `/portfolios`
- Web detail canonical: `/portfolios/{id}/{slug}`
- API list: `/api/portfolio/`
- API detail by id (استاندارد): `/api/portfolio/id/{id}/`
- API detail by slug (legacy): `/api/portfolio/{slug}/`
- API detail by public_id (legacy): `/api/portfolio/p/{public_id}/`

Cache keys:
- `public:portfolio:list:{hash}`
- `public:portfolio:detail:id:{id}`
- `public:portfolio:detail:slug:{slug}` (legacy)
- `public:portfolio:detail:public_id:{public_id}` (legacy)

#### Portfolio taxonomy (اگر category/tag دارد)

- برای هر taxonomy همین قرارداد اجرا شود:
  - list: `public:portfolio:{taxonomy}:list:{hash}`
  - detail id: `public:portfolio:{taxonomy}:detail:id:{id}`
  - detail slug: `public:portfolio:{taxonomy}:detail:slug:{slug}`

#### Portfolio invalidation matrix (الزامی)

- تغییر portfolio item: invalidate detail + list + taxonomy lists متاثر
- تغییر taxonomy: invalidate detail taxonomy + list taxonomy + لیست portfolio متاثر

### L) چک‌لیست تکمیلی نهایی برای Blog/Portfolio

- [ ] endpoint `id/{id}` برای detail پیاده شده
- [ ] serializer public شامل `id/public_id/slug`
- [ ] route وب canonical = `/{module}/{id}/{slug}`
- [ ] fetch detail در فرانت فقط با `id`
- [ ] redirect فقط برای id mismatch (بدون loop)
- [ ] cache key `detail:id` اضافه شده
- [ ] invalidation وابستگی‌های taxonomy کامل انجام شده
- [ ] revalidation Next برای tag/pathهای مرتبط فعال است



PUBLIC — وب‌سایت (SEO)
وضعیت
/rent
/buy
/pre-sale
/mortgage

وضعیت + شهر
/rent/tehran
/buy/shiraz
/pre-sale/mashhad

وضعیت + شهر + نوع ملک
/rent/tehran/apartment
/buy/tehran/villa
/pre-sale/shiraz/apartment

لیست پایه (قبل از انتخاب شهر)
/rent
/buy

فیلترها (Query)
/rent/tehran/apartment?rooms=2
/rent/tehran/apartment?min_price=5000000000
/rent/tehran/apartment?rooms=2&has_parking=true

pagination
/rent/tehran/apartment?page=2

تگ / برچسب (صفحه اختصاصی)
/tag/luxury
/tag/new-build
/tag/sea-view

لیست + تگ
/rent/tehran/apartment?tag=luxury

جزئیات ملک
/property/3515234/luxury-apartment-in-tehran

✅ صفحات اصلی (Indexable – canonical دارند)
/properties
نوع معامله
/properties/sale
/properties/rent
نوع ملک
/properties/apartment
/properties/villa
/properties/land
موقعیت
/properties/tehran
/properties/east-azerbaijan
ترکیب‌های اصلی (در صورت نیاز)
/properties/sale/tehran
/properties/rent/east-azerbaijan
برچسب (صفحه مستقل)
/properties/tag/لوکس
/properties/tag/نوساز

📌 این‌ها:

index می‌شن

تو sitemap میان

canonical = خودشون

⚠️ صفحات فیلتر (NOT indexable – canonical ندارند به خودشون)
فیلتر روی صفحه اصلی
/properties?price=5-10
/properties?rooms=2
فیلتر روی موقعیت
/properties/tehran?price=5-10
/properties/east-azerbaijan?rooms=3
فیلتر برچسب (به‌صورت query)
/properties/tehran?tag=لوکس
فیلتر ترکیبی
/properties/sale/tehran?price=5-10&rooms=2&tag=لوکس

📌 این‌ها:

در sitemap ❌

لینک منو ❌

canonical → path بدون query

🔗 Canonical rule (خلاصه قطعی)
URL فعلی	canonical
/properties/tehran?tag=لوکس	/properties/tehran
/properties/sale?price=5-10	/properties/sale
/properties/sale/tehran?rooms=2	/properties/sale/tehran
🧠 جمع‌بندی خیلی کوتاه

Path = هویت صفحه

Query = فیلتر موقت

فقط pathها index

فیلترها هیچ‌وقت صفحه مستقل نیستند

این دقیقاً همون ساختاریه که «برگ‌برگ»، «دیوار»، «سایت‌های املاک حرفه‌ای» می‌رن.