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