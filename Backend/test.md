200 GET
/api/real-estate/properties/
309ms overall
20ms on queries
2 queries
Query Parameters
{
    "order_by": "created_at",
    "order_desc": "true",
    "page": "1",
    "size": "9"
}
Request Headers
CONTENT-LENGTH	
CONTENT-TYPE	text/plain
HOST	localhost:8000
CONNECTION	keep-alive
ACCEPT	application/json
ACCEPT-LANGUAGE	*
SEC-FETCH-MODE	cors
USER-AGENT	node
ACCEPT-ENCODING	gzip, deflate
Response Headers

200 GET
/api/real-estate/properties/
309ms overall
20ms on queries
2 queries
At	Action	Tables	Num. Joins	Execution Time (ms)
+0:00:00.244949	UPDATE	"django_session"	0	11.784000
+0:00:00.198849	SELECT	"a", "django_session"	0	8.088000
Page 1 of 1.
previous | next

---

## تحلیل اختلاف سرعت وب (Public) با پنل (Admin) برای لیست املاک

### 1) شواهد Silk که شما ثبت کردید
- `GET /api/real-estate/properties/`
- `309ms overall`
- `20ms on queries`
- فقط `2 queries` و هر دو مربوط به `django_session` هستند.

نتیجه: در این درخواست، زمان اصلی از دیتابیس لیست املاک نیامده و بیشتر صرف لایه‌های غیر-Query شده (session/middleware/serialization/network).

### 2) مقایسه مستقیم داخلی (با پارامتر مشابه: `limit=9, ordering=-created_at`)
- Public list: `status=200`, `queries=5`, `bytes=10398`
- Admin list: `status=200`, `queries=3`, `bytes=15245`

نتیجه: تعداد Query لزوماً تعیین‌کننده نهایی نیست. پنل با وجود Query کمتر، payload بزرگ‌تری برمی‌گرداند.

### 3) چرا Public در عمل سریع‌تر دیده می‌شود؟
1. **Public cache hit خیلی قوی‌تر است**
    - در Public service، خروجی لیست property مستقیم cache می‌شود:
      - `PropertyPublicService.get_property_list_data()`
      - `PUBLIC_PROPERTY_LIST_TTL = 120`
    - در حالت cache hit، عملاً Queryهای مدل property حذف می‌شوند (مثل لاگ شما که فقط session دیده شده).

2. **Admin list در View مستقیم از queryset می‌خواند (بدون cache list endpoint)**
    - `PropertyAdminViewSet.list()` مستقیم `filter_queryset(get_queryset())` را serialize می‌کند.
    - بنابراین cache-hit رفتار Public را برای list ندارد.

3. **هزینه‌های پنل خارج از Query بیشتر است**
    - احراز هویت، permission check، session update، و ساخت payload مدیریتی.
    - حتی اگر Query کم باشد، این بخش‌ها `overall` را بالا می‌برند.

4. **Payload پنل سنگین‌تر از وب است**
    - پنل فیلدهای مدیریتی بیشتری برمی‌گرداند (SEO status/counters/agent/agency/...) و پاسخ حجیم‌تر می‌شود.

### 4) جمع‌بندی نهایی
- اختلاف سرعتی که می‌بینی طبیعی است و تناقضی با «استفاده از یک بک‌اند» ندارد.
- Public به‌خاطر cache و خروجی سبک‌تر، سریع‌تر دیده می‌شود.
- Admin حتی با Query کمتر هم می‌تواند `overall` بالاتری داشته باشد چون bottleneck آن فقط SQL نیست.