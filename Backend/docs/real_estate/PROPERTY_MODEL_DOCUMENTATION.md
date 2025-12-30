# 📘 داکیومنت کامل مدل Property (املاک و مستغلات)

**پروژه:** Corporate Django + Next.js  
**ورژن Django:** 5.2.6  
**دیتابیس:** PostgreSQL  
**تاریخ به‌روزرسانی:** 2025-01-30

---

## 📋 فهرست مطالب

1. [معرفی کلی](#معرفی-کلی)
2. [ساختار کلی مدل](#ساختار-کلی-مدل)
3. [فیلدهای اصلی (Core Fields)](#فیلدهای-اصلی)
4. [روابط (Relationships/FK)](#روابط-با-مدل‌های-دیگر)
5. [فیلدهای موقعیت جغرافیایی](#موقعیت-جغرافیایی)
6. [فیلدهای قیمت](#قیمت‌ها-و-مبالغ)
7. [فیلدهای مساحت و ابعاد](#مساحت-و-ابعاد)
8. [فیلدهای اتاق‌ها](#اتاق‌ها-و-فضاها)
9. [فیلدهای ساختمان](#جزئیات-ساختمان)
10. [فیلدهای امکانات](#امکانات-و-تسهیلات)
11. [فیلدهای مدارک](#مدارک-و-اسناد)
12. [روابط Many-to-Many](#روابط-چند-به-چند)
13. [فیلدهای انتشار و وضعیت](#وضعیت-انتشار)
14. [فیلدهای آمار](#آمار-و-تعاملات)
15. [فیلدهای SEO](#سئو-و-بهینه‌سازی)
16. [فیلدهای پیشرفته](#فیلدهای-پیشرفته)
17. [Index ها و بهینه‌سازی](#ایندکس‌ها-و-بهینه‌سازی)
18. [متدها و Property ها](#متدها-و-توابع)
19. [نمونه کوئری‌ها](#نمونه-کوئری‌ها)
20. [نکات مهم](#نکات-مهم)

---

## معرفی کلی

### مدل `Property` چیست؟

مدل اصلی برای مدیریت **املاک و مستغلات** که شامل:
- آپارتمان‌ها
- ویلاها
- زمین‌های مسکونی/تجاری
- مغازه‌ها
- دفاتر اداری
- اجاره کوتاه‌مدت
- پیش‌فروش

### ویژگی‌های کلیدی:

✅ **59 فیلد مستقیم** برای فیلترهای سریع  
✅ **9 رابطه Foreign Key** با مدل‌های دیگر  
✅ **3 رابطه Many-to-Many** برای برچسب‌ها و ویژگی‌ها  
✅ **PostgreSQL Full-Text Search** برای جستجوی پیشرفته  
✅ **GIN Index** روی JSON attributes  
✅ **18+ Index پیشرفته** برای performance بالا  
✅ **SEO Mixin** برای بهینه‌سازی موتورهای جستجو

---

## ساختار کلی مدل

```python
from django.db import models
from src.core.models import BaseModel
from src.real_estate.models.seo import SEOMixin

class Property(BaseModel, SEOMixin):
    """
    مدل اصلی املاک و مستغلات
    
    ارث‌بری:
    - BaseModel: فیلدهای پایه (id, created_at, updated_at, is_active)
    - SEOMixin: فیلدهای سئو (meta_title, meta_description, og_*, canonical_url)
    """
```

### جدول دیتابیس:
```
جدول: real_estate_properties
Schema: public (PostgreSQL)
```

---

## فیلدهای اصلی

### 1. **title** (عنوان ملک)
```python
title = models.CharField(max_length=100, db_index=True)
```

**نوع:** متن کوتاه (حداکثر 100 کاراکتر)  
**الزامی:** بله  
**Index:** بله (برای جستجوی سریع)  
**مثال:** `"آپارتمان 85 متری در ولنجک"`

**کاربرد:**
- عنوان اصلی برای نمایش در لیست‌ها
- استفاده در جستجو
- نمایش در کارت‌های املاک

---

### 2. **slug** (نامک URL)
```python
slug = models.SlugField(
    max_length=120, 
    unique=True, 
    db_index=True, 
    allow_unicode=True
)
```

**نوع:** Slug (برای URL)  
**الزامی:** بله  
**یکتا:** بله  
**Index:** بله  
**مثال:** `"apartment-85m-valanjak-tehran-12345"`

**کاربرد:**
- آدرس صفحه ملک: `/property/apartment-85m-valanjak/`
- باید یکتا باشه (نمی‌تونه تکرار بشه)
- سئو-friendly URL

---

### 3. **short_description** (توضیحات کوتاه)
```python
short_description = models.CharField(max_length=300, blank=True)
```

**نوع:** متن کوتاه (حداکثر 300 کاراکتر)  
**الزامی:** خیر  
**مثال:** `"آپارتمان نوساز با نما مدرن در بهترین لوکیشن ولنجک"`

**کاربرد:**
- نمایش در کارت‌های کوچک
- خلاصه سریع برای کاربر
- استفاده در meta description اگر خالی نباشه

---

### 4. **description** (توضیحات کامل)
```python
description = models.TextField()
```

**نوع:** متن بلند (بدون محدودیت)  
**الزامی:** بله  
**مثال:**
```
"این ملک یک آپارتمان 85 متری در طبقه 3 از 5 طبقه است.
دارای 2 اتاق خواب، آشپزخانه مدرن، پارکینگ و انباری.
نزدیک به مترو، پارک و مراکز خرید."
```

**کاربرد:**
- نمایش در صفحه جزئیات ملک
- جستجوی متنی (Full-Text Search)

---

## روابط با مدل‌های دیگر

### 5. **agent** (کارگزار املاک)
```python
agent = models.ForeignKey(
    PropertyAgent,
    on_delete=models.PROTECT,
    related_name='properties',
    db_index=True
)
```

**نوع:** Foreign Key (یک‌به‌چند)  
**الزامی:** بله  
**حذف:** PROTECT (نمی‌تونی agent رو حذف کنی اگه ملک داره)  
**رابطه معکوس:** `agent.properties.all()`

**توضیح:**
- هر ملک **یک کارگزار** داره
- هر کارگزار می‌تونه **چند ملک** داشته باشه
- مثال: آقای احمدی 50 ملک داره

**کوئری:**
```python
# دریافت تمام املاک یک کارگزار
agent = PropertyAgent.objects.get(id=5)
properties = agent.properties.all()

# دریافت کارگزار یک ملک
property = Property.objects.get(id=10)
agent_name = property.agent.full_name
```

---

### 6. **agency** (آژانس املاک)
```python
agency = models.ForeignKey(
    RealEstateAgency,
    on_delete=models.PROTECT,
    related_name='properties',
    null=True,
    blank=True,
    db_index=True
)
```

**نوع:** Foreign Key (یک‌به‌چند)  
**الزامی:** خیر (اختیاری)  
**حذف:** PROTECT  
**رابطه معکوس:** `agency.properties.all()`

**توضیح:**
- ملک می‌تونه متعلق به یک **آژانس** باشه (اختیاری)
- اگه آژانس نداشته باشه، فقط کارگزار مستقل داره

**کوئری:**
```python
# املاک یک آژانس
agency = RealEstateAgency.objects.get(id=3)
properties = agency.properties.filter(is_published=True)

# املاک بدون آژانس (کارگزارهای مستقل)
independent = Property.objects.filter(agency__isnull=True)
```

---

### 7. **property_type** (نوع ملک)
```python
property_type = models.ForeignKey(
    PropertyType,
    on_delete=models.PROTECT,
    related_name='properties',
    db_index=True
)
```

**نوع:** Foreign Key  
**الزامی:** بله  
**حذف:** PROTECT  
**Index:** بله (فیلتر خیلی پرکاربرد)

**مقادیر ممکن (در جدول PropertyType):**
- آپارتمان (Apartment)
- ویلا (Villa)
- زمین مسکونی (Residential Land)
- زمین تجاری (Commercial Land)
- مغازه (Shop)
- دفتر اداری (Office)
- انبار (Warehouse)
- اجاره کوتاه‌مدت (Short-term Rental)

**کوئری:**
```python
# تمام آپارتمان‌ها
apartments = Property.objects.filter(
    property_type__slug='apartment'
)

# تمام ویلاها در شمال
villas = Property.objects.filter(
    property_type__slug='villa',
    province__slug='mazandaran'
)
```

---

### 8. **state** (وضعیت معامله)
```python
state = models.ForeignKey(
    PropertyState,
    on_delete=models.PROTECT,
    related_name='properties',
    db_index=True
)
```

**نوع:** Foreign Key  
**الزامی:** بله  
**Index:** بله

**مقادیر ممکن (در جدول PropertyState):**
- فروش (For Sale)
- رهن و اجاره (Rent & Mortgage)
- اجاره (Rent Only)
- رهن کامل (Full Mortgage)
- پیش‌فروش (Pre-sale)
- فروش فوری (Urgent Sale)
- معاوضه (Exchange)

**کوئری:**
```python
# املاک برای فروش
for_sale = Property.objects.filter(state__slug='for-sale')

# املاک اجاره
for_rent = Property.objects.filter(state__slug='rent')
```

---

### 9-12. **موقعیت جغرافیایی** (Location)

```python
country = models.ForeignKey(
    Country, 
    on_delete=models.PROTECT, 
    default=1  # Iran
)

province = models.ForeignKey(
    Province,
    on_delete=models.PROTECT,
    related_name='real_estate_properties',
    db_index=True
)

city = models.ForeignKey(
    City,
    on_delete=models.PROTECT,
    related_name='real_estate_properties',
    db_index=True
)

region = models.ForeignKey(
    CityRegion,
    on_delete=models.SET_NULL,
    null=True,
    blank=True,
    db_index=True
)
```

**توضیح:**
- **country:** کشور (پیش‌فرض ایران)
- **province:** استان (مثلاً تهران، مازندران)
- **city:** شهر (مثلاً تهران، کرج، رامسر)
- **region:** منطقه شهری (مثلاً منطقه 1، 2، 3 تهران) - اختیاری

**سلسله مراتب:**
```
Country (ایران)
  └── Province (تهران)
        └── City (تهران)
              └── Region (منطقه 1) [اختیاری]
```

**کوئری:**
```python
# املاک در تهران
tehran_properties = Property.objects.filter(
    city__slug='tehran'
)

# املاک در منطقه 1 تهران
region1 = Property.objects.filter(
    city__slug='tehran',
    region__code=1
)

# املاک در استان مازندران
mazandaran = Property.objects.filter(
    province__slug='mazandaran'
)
```

---

## موقعیت جغرافیایی

### 13. **neighborhood** (محله)
```python
neighborhood = models.CharField(max_length=120, blank=True, db_index=True)
```

**نوع:** متن  
**الزامی:** خیر  
**Index:** بله  
**مثال:** `"ولنجک"`, `"نیاوران"`, `"فرمانیه"`

**کاربرد:**
- فیلتر دقیق‌تر از منطقه
- نمایش در آدرس ملک

---

### 14. **address** (آدرس کامل)
```python
address = models.TextField()
```

**نوع:** متن بلند  
**الزامی:** بله  
**مثال:** `"تهران، ولنجک، خیابان فلان، کوچه بهمان، پلاک 25"`

**کاربرد:**
- نمایش آدرس دقیق برای کاربران
- استفاده در نقشه

---

### 15. **postal_code** (کد پستی)
```python
postal_code = models.CharField(max_length=20, blank=True, db_index=True)
```

**نوع:** متن (20 کاراکتر)  
**الزامی:** خیر  
**مثال:** `"1234567890"`

---

### 16-17. **latitude, longitude** (مختصات جغرافیایی)
```python
latitude = models.DecimalField(
    max_digits=10, 
    decimal_places=8, 
    null=True, 
    blank=True,
    db_index=True
)

longitude = models.DecimalField(
    max_digits=11, 
    decimal_places=8, 
    null=True, 
    blank=True,
    db_index=True
)
```

**نوع:** عدد اعشاری (دقت بالا)  
**الزامی:** خیر  
**Index:** بله (برای جستجوی نقشه)  
**مثال:**
- `latitude: 35.7219`
- `longitude: 51.4251`

**کاربرد:**
- نمایش روی نقشه (Google Maps / OpenStreetMap)
- جستجوی املاک نزدیک به من
- فیلتر بر اساس شعاع (در دایره 2 کیلومتری)

**کوئری (جستجوی نقشه):**
```python
# املاک روی نقشه
on_map = Property.objects.filter(
    latitude__isnull=False,
    longitude__isnull=False
)

# در دایره 2 کیلومتر (نیاز به PostGIS)
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D

point = Point(51.4251, 35.7219, srid=4326)
nearby = Property.objects.filter(
    location__distance_lte=(point, D(km=2))
)
```

---

## قیمت‌ها و مبالغ

### 18. **price** (قیمت اصلی)
```python
price = models.BigIntegerField(null=True, blank=True, db_index=True)
```

**نوع:** عدد بزرگ (تا 9,223,372,036,854,775,807)  
**الزامی:** خیر  
**Index:** بله (فیلتر قیمت)  
**واحد:** تومان  
**مثال:** `5000000000` (5 میلیارد تومان)

**کاربرد:**
- قیمت نهایی ملک
- فیلتر بازه قیمت (از 2 تا 5 میلیارد)
- مرتب‌سازی بر اساس قیمت

---

### 19. **sale_price** (قیمت فروش)
```python
sale_price = models.BigIntegerField(null=True, blank=True, db_index=True)
```

**نوع:** عدد بزرگ  
**کاربرد:**
- قیمت فروش (اگه از price متفاوت باشه)
- قیمت تخفیف‌خورده

---

### 20. **pre_sale_price** (قیمت پیش‌فروش)
```python
pre_sale_price = models.BigIntegerField(null=True, blank=True, db_index=True)
```

**کاربرد:**
- قیمت پیش‌فروش پروژه‌های در حال ساخت

---

### 21. **price_per_sqm** (قیمت هر متر)
```python
price_per_sqm = models.IntegerField(
    null=True, 
    blank=True, 
    db_index=True,
    editable=False  # محاسبه خودکار
)
```

**نوع:** عدد (محاسبه خودکار)  
**فرمول:** `قیمت / مساحت بنا`  
**مثال:** `5,000,000,000 / 85 = 58,823,529` تومان به ازای هر متر

**کاربرد:**
- مقایسه املاک با متراژ مختلف
- فیلتر قیمت متری
- نمایش به کاربر

**محاسبه خودکار در save():**
```python
if self.built_area and self.built_area > 0:
    if self.price:
        self.price_per_sqm = int(self.price / float(self.built_area))
```

---

### 22-25. **اجاره و رهن**

```python
monthly_rent = models.BigIntegerField(
    null=True, blank=True, db_index=True
)  # اجاره ماهانه

rent_amount = models.BigIntegerField(
    null=True, blank=True, db_index=True
)  # مبلغ اجاره

mortgage_amount = models.BigIntegerField(
    null=True, blank=True, db_index=True
)  # رهن

security_deposit = models.BigIntegerField(
    null=True, blank=True
)  # ودیعه
```

**کاربرد:**
- **monthly_rent:** اجاره‌ای که ماهانه پرداخت می‌شه
- **rent_amount:** مبلغ کل اجاره
- **mortgage_amount:** رهن (ودیعه اولیه)
- **security_deposit:** ودیعه امانت

**مثال:**
```python
# رهن: 500 میلیون
# اجاره: 10 میلیون ماهانه
mortgage_amount = 500_000_000
monthly_rent = 10_000_000
```

**کوئری:**
```python
# اجاره تا 15 میلیون
affordable_rent = Property.objects.filter(
    monthly_rent__lte=15_000_000
)
```

---

## مساحت و ابعاد

### 26. **land_area** (مساحت زمین)
```python
land_area = models.DecimalField(
    max_digits=10,
    decimal_places=2,
    validators=[MinValueValidator(0)],
    db_index=True
)
```

**نوع:** عدد اعشاری (10 رقم، 2 رقم اعشار)  
**الزامی:** بله  
**واحد:** متر مربع  
**مثال:** `250.50` (250 متر و نیم)

**کاربرد:**
- مساحت کل زمین/ملک
- فیلتر بر اساس متراژ زمین
- برای ویلا، زمین، باغ

---

### 27. **built_area** (مساحت بنا)
```python
built_area = models.DecimalField(
    max_digits=10,
    decimal_places=2,
    validators=[MinValueValidator(0)],
    db_index=True
)
```

**نوع:** عدد اعشاری  
**الزامی:** بله  
**واحد:** متر مربع  
**مثال:** `85.00` (85 متر)

**کاربرد:**
- زیربنای ساختمان
- فیلتر اصلی (70 تا 100 متر)
- محاسبه قیمت متری

**کوئری:**
```python
# آپارتمان 70 تا 100 متر
medium_size = Property.objects.filter(
    built_area__gte=70,
    built_area__lte=100
)
```

---

## اتاق‌ها و فضاها

### 28. **bedrooms** (اتاق خواب) 🔥
```python
BEDROOM_CHOICES = [
    (0, 'Studio'),      # استودیو (بدون اتاق خواب)
    (1, '1 Bedroom'),
    (2, '2 Bedrooms'),
    ...
    (20, '20+ Bedrooms'),
]

bedrooms = models.SmallIntegerField(
    choices=BEDROOM_CHOICES,
    default=1,
    validators=[MinValueValidator(0), MaxValueValidator(20)],
    db_index=True,
    help_text="Number of bedrooms (0 = Studio)"
)
```

**نوع:** عدد کوچک (0 تا 20)  
**الزامی:** بله  
**پیش‌فرض:** 1  
**Index:** بله (فیلتر خیلی پرکاربرد)  
**مقادیر:**
- `0` = استودیو (بدون اتاق خواب جداگانه)
- `1` = یک خوابه
- `2` = دو خوابه
- `3` = سه خوابه
- ...

**کوئری:**
```python
# آپارتمان‌های 2 خوابه
two_bedroom = Property.objects.filter(bedrooms=2)

# حداقل 2 خواب
min_two = Property.objects.filter(bedrooms__gte=2)
```

---

### 29. **bathrooms** (حمام/سرویس) 🔥
```python
BATHROOM_CHOICES = [
    (0, 'No Bathroom'),
    (1, '1 Bathroom'),
    (2, '2 Bathrooms'),
    ...
]

bathrooms = models.SmallIntegerField(
    choices=BATHROOM_CHOICES,
    default=1,
    validators=[MinValueValidator(0), MaxValueValidator(20)],
    db_index=True
)
```

**کاربرد:**
- تعداد حمام و سرویس بهداشتی
- فیلتر: حداقل 2 سرویس

---

### 30. **capacity** (ظرفیت نفرات) 🆕🔥
```python
CAPACITY_CHOICES = [
    (1, '1 Person'),
    (2, '2 People'),
    (3, '3 People'),
    ...
    (30, '30+ People'),
]

capacity = models.SmallIntegerField(
    null=True,
    blank=True,
    choices=CAPACITY_CHOICES,
    validators=[MinValueValidator(1), MaxValueValidator(50)],
    db_index=True,
    help_text="Maximum number of people (mainly for short-term rentals)"
)
```

**نوع:** عدد کوچک (1 تا 50)  
**الزامی:** خیر  
**Index:** بله ⚡  
**کاربرد اصلی:** اجاره کوتاه‌مدت (ویلا، سوئیت)

**چرا فیلد مستقیم؟**
- فیلتر اصلی UI: "حداقل 4 نفر"
- سرعت بالا (بدون JSON query)
- مرتب‌سازی ممکن

**کوئری:**
```python
# ویلا برای 6 نفر
short_term_villa = Property.objects.filter(
    property_type__slug='villa',
    state__slug='short-term-rental',
    capacity__gte=6
)
```

---

### 31. **kitchens** (آشپزخانه)
```python
kitchens = models.SmallIntegerField(
    choices=KITCHEN_CHOICES,
    default=1,
    validators=[MinValueValidator(0), MaxValueValidator(10)]
)
```

**کاربرد:**
- تعداد آشپزخانه (معمولاً 1)
- برای ویلاهای بزرگ ممکنه بیشتر باشه

---

### 32. **living_rooms** (پذیرایی)
```python
living_rooms = models.SmallIntegerField(
    choices=LIVING_ROOM_CHOICES,
    default=1,
    validators=[MinValueValidator(0), MaxValueValidator(10)]
)
```

**کاربرد:**
- تعداد پذیرایی/هال
- برای املاک لوکس بیشتر از 1

---

## جزئیات ساختمان

### 33. **year_built** (سال ساخت)
```python
year_built = models.SmallIntegerField(
    null=True,
    blank=True,
    db_index=True,
    verbose_name="Year Built (Shamsi)",
    help_text="Year built in Solar calendar (e.g., 1402)"
)
```

**نوع:** عدد کوچک  
**الزامی:** خیر  
**واحد:** سال شمسی  
**محدوده:** 1300 تا (سال جاری + 5)  
**مثال:** `1398`, `1402`

**اعتبارسنجی:**
```python
# حداقل: 1300
# حداکثر: سال جاری + 5
if year_built < 1300 or year_built > (current_year + 5):
    raise ValidationError("Invalid year")
```

**کوئری:**
```python
# ساخت 5 سال اخیر
recent = Property.objects.filter(
    year_built__gte=1399
)
```

---

### 34. **build_years** (عمر ساختمان)
```python
build_years = models.SmallIntegerField(
    null=True,
    blank=True,
    db_index=True,
    help_text="Number of years since the property was built"
)
```

**نوع:** عدد (محاسبه خودکار)  
**مثال:** اگه سال ساخت 1395 باشه → عمر = 9 سال

**محاسبه (در property):**
```python
@property
def age_years(self):
    if not self.year_built:
        return None
    current_year = jdatetime.datetime.now().year
    return current_year - self.year_built
```

---

### 35. **floors_in_building** (تعداد طبقات)
```python
floors_in_building = models.SmallIntegerField(
    null=True,
    blank=True,
    help_text="Total floors in the building"
)
```

**مثال:** `5` (ساختمان 5 طبقه)

---

### 36. **floor_number** (شماره طبقه)
```python
FLOOR_CHOICES = [
    (-2, '2nd Basement'),    # زیرزمین دوم
    (-1, 'Basement'),        # زیرزمین
    (0, 'Ground Floor'),     # همکف
    (1, '1st Floor'),        # طبقه اول
    ...
    (50, '50+ Floor'),
]

floor_number = models.SmallIntegerField(
    null=True,
    blank=True,
    choices=FLOOR_CHOICES,
    db_index=True,
    help_text="Floor number (-2 to 50)"
)
```

**محدوده:** -2 (زیرزمین دوم) تا 50+  
**مثال:**
- `-1` = زیرزمین
- `0` = همکف
- `3` = طبقه سوم

**کوئری:**
```python
# طبقات بالا (3 به بالا)
high_floors = Property.objects.filter(floor_number__gte=3)

# همکف و طبقه اول
low_floors = Property.objects.filter(floor_number__lte=1)
```

---

## امکانات و تسهیلات

### 37. **parking_spaces** (پارکینگ) 🔥
```python
PARKING_CHOICES = [
    (0, 'No Parking'),
    (1, '1 Parking'),
    (2, '2 Parkings'),
    ...
    (20, '20+ Parkings'),
]

parking_spaces = models.SmallIntegerField(
    choices=PARKING_CHOICES,
    default=0,
    validators=[MinValueValidator(0), MaxValueValidator(20)],
    db_index=True
)
```

**کاربرد:**
- تعداد پارکینگ
- فیلتر: حتماً پارکینگ داشته باشه

**کوئری:**
```python
# حداقل 1 پارکینگ
with_parking = Property.objects.filter(parking_spaces__gte=1)
```

---

### 38. **storage_rooms** (انباری) 🔥
```python
STORAGE_CHOICES = [
    (0, 'No Storage'),
    (1, '1 Storage'),
    ...
]

storage_rooms = models.SmallIntegerField(
    choices=STORAGE_CHOICES,
    default=0,
    validators=[MinValueValidator(0), MaxValueValidator(5)],
    db_index=True
)
```

**کاربرد:**
- تعداد انباری
- فیلتر: با انباری/بدون انباری

---

## مدارک و اسناد

### 39. **document_type** (نوع سند)
```python
document_type = models.CharField(
    max_length=32,
    null=True,
    blank=True,
    db_index=True,
    help_text="Type of ownership document"
)
```

**مقادیر ممکن:**
- `"official"` - سند رسمی (تک‌برگ)
- `"contract"` - قولنامه‌ای
- `"cooperative"` - تعاونی
- `"endowment"` - وقفی
- `"judicial"` - در دست اقدام قضایی

**کوئری:**
```python
# فقط سند رسمی
official_docs = Property.objects.filter(
    document_type='official'
)
```

---

### 40. **has_document** (دارای سند)
```python
has_document = models.BooleanField(
    default=True,
    db_index=True,
    help_text="Whether the property has any ownership document"
)
```

**کاربرد:**
- آیا اصلاً سند داره یا نه
- برای املاک بدون سند = False

---

## روابط چند به چند

### 41. **labels** (برچسب‌ها)
```python
labels = models.ManyToManyField(
    PropertyLabel,
    blank=True,
    related_name='properties'
)
```

**نوع:** Many-to-Many  
**مثال:**
- "فوری" (Urgent)
- "ویژه" (Featured)
- "تخفیف دار" (Discounted)
- "قیمت توافقی" (Negotiable)

**کوئری:**
```python
# املاک با برچسب "فوری"
urgent = Property.objects.filter(labels__slug='urgent')

# چند برچسب همزمان
special = Property.objects.filter(
    labels__slug__in=['urgent', 'featured']
).distinct()
```

---

### 42. **tags** (تگ‌ها)
```python
tags = models.ManyToManyField(
    PropertyTag,
    blank=True,
    related_name='properties'
)
```

**مثال:**
- "نوساز" (Brand New)
- "بازسازی شده" (Renovated)
- "نما مدرن" (Modern Facade)
- "نزدیک مترو" (Near Metro)

---

### 43. **features** (ویژگی‌ها/امکانات)
```python
features = models.ManyToManyField(
    PropertyFeature,
    blank=True,
    related_name='properties'
)
```

**مثال:**
- آسانسور (Elevator)
- استخر (Pool)
- سونا (Sauna)
- باشگاه (Gym)
- لابی (Lobby)
- سرایدار (Caretaker)
- درب ریموت (Remote Door)
- دوربین مداربسته (CCTV)
- آب گرمکن (Water Heater)
- پکیج (Central Heating)

**کوئری:**
```python
# املاک با آسانسور
with_elevator = Property.objects.filter(
    features__slug='elevator'
)

# آسانسور + پارکینگ + استخر
luxury = Property.objects.filter(
    features__slug__in=['elevator', 'pool', 'gym']
).annotate(
    feature_count=Count('features')
).filter(
    feature_count__gte=3
)
```

---

## وضعیت انتشار

### 44. **is_published** (منتشر شده)
```python
is_published = models.BooleanField(
    default=False,
    db_index=True,
    help_text="Whether property is published"
)
```

**کاربرد:**
- آیا ملک منتشر شده و قابل نمایش عمومی هست؟
- پیش‌فرض: False (باید دستی publish بشه)

---

### 45. **is_featured** (ویژه)
```python
is_featured = models.BooleanField(
    default=False,
    db_index=True,
    help_text="Whether property is featured"
)
```

**کاربرد:**
- املاک منتخب/ویژه برای نمایش در صفحه اصلی
- اولویت نمایش بالاتر

---

### 46. **is_public** (عمومی)
```python
is_public = models.BooleanField(
    default=True,
    db_index=True,
    help_text="Publicly visible"
)
```

**کاربرد:**
- آیا برای همه قابل دیدن هست؟
- False = فقط کاربران خاص می‌بینن

---

### 47. **is_verified** (تأیید شده)
```python
is_verified = models.BooleanField(
    default=False,
    db_index=True,
    help_text="Whether property is verified"
)
```

**کاربرد:**
- آیا ملک توسط ادمین بررسی و تأیید شده؟

---

### 48. **published_at** (تاریخ انتشار)
```python
published_at = models.DateTimeField(
    null=True,
    blank=True,
    db_index=True,
    help_text="When property was published"
)
```

**کاربرد:**
- زمان دقیق انتشار
- مرتب‌سازی بر اساس جدیدترین
- محاسبه خودکار اولین بار که is_published=True می‌شه

---

## آمار و تعاملات

### 49. **views_count** (تعداد بازدید)
```python
views_count = models.IntegerField(
    default=0,
    db_index=True,
    help_text="Total number of views"
)
```

**کاربرد:**
- شمارش تعداد بازدیدها
- مرتب‌سازی بر اساس محبوب‌ترین
- نمایش "پربازدیدترین"

---

### 50. **favorites_count** (تعداد علاقه‌مندی)
```python
favorites_count = models.IntegerField(
    default=0,
    help_text="Total number of favorites"
)
```

**کاربرد:**
- تعداد دفعاتی که به علاقه‌مندی‌ها اضافه شده

---

### 51. **inquiries_count** (تعداد استعلام)
```python
inquiries_count = models.IntegerField(
    default=0,
    help_text="Total number of inquiries"
)
```

**کاربرد:**
- تعداد درخواست اطلاعات/تماس

---

## سئو و بهینه‌سازی

### 52-57. **فیلدهای SEO (از SEOMixin)**

```python
# از SEOMixin ارث‌بری شده:
meta_title = models.CharField(max_length=70, blank=True)
meta_description = models.CharField(max_length=300, blank=True)
meta_keywords = models.CharField(max_length=255, blank=True)
og_title = models.CharField(max_length=70, blank=True)
og_description = models.CharField(max_length=300, blank=True)
og_image = models.ForeignKey(Media, ...)
canonical_url = models.URLField(blank=True)
```

**کاربرد:**
- **meta_title:** عنوان در گوگل
- **meta_description:** توضیحات در گوگل
- **meta_keywords:** کلمات کلیدی (کمتر مهم)
- **og_title/og_description:** برای شبکه‌های اجتماعی
- **og_image:** تصویر در اشتراک‌گذاری
- **canonical_url:** URL اصلی (duplicate content جلوگیری)

**مثال خروجی HTML:**
```html
<title>آپارتمان 85 متری در ولنجک تهران</title>
<meta name="description" content="...">
<meta property="og:title" content="...">
<meta property="og:image" content="...">
```

---

### 58. **search_vector** (بردار جستجو)
```python
search_vector = SearchVectorField(
    null=True,
    blank=True,
    help_text="Full-text search vector (PostgreSQL)"
)
```

**نوع:** PostgreSQL Full-Text Search  
**کاربرد:**
- جستجوی سریع در عنوان، توضیحات، تگ‌ها
- پشتیبانی از زبان فارسی
- رتبه‌بندی نتایج

**کوئری:**
```python
from django.contrib.postgres.search import SearchQuery

search_query = SearchQuery('آپارتمان ولنجک')
results = Property.objects.filter(
    search_vector=search_query
).order_by('-rank')
```

---

## فیلدهای پیشرفته

### 59. **extra_attributes** (ویژگی‌های اضافی) 🔥
```python
extra_attributes = models.JSONField(
    default=dict,
    blank=True,
    help_text="Flexible attributes for specific property types"
)
```

**نوع:** JSON  
**کاربرد:**
- فیلدهای ویژه هر نوع ملک که فیلتر اصلی نیستن
- بدون نیاز به migration

**مثال محتوا:**
```json
{
  "nightly_price": 500000,
  "min_stay_nights": 2,
  "max_stay_nights": 30,
  "pet_allowed": true,
  "checkin_time": "14:00",
  "checkout_time": "12:00",
  "cancellation_policy": "flexible",
  "amenities": ["wifi", "tv", "kitchen"],
  "view_type": "mountain",
  "balcony_area": 15,
  "heating_type": "central",
  "cooling_type": "split"
}
```

**کوئری (PostgreSQL JSON):**
```python
# املاک با pet_allowed
pet_friendly = Property.objects.filter(
    extra_attributes__pet_allowed=True
)

# قیمت شبانه کمتر از 1 میلیون
cheap_nightly = Property.objects.filter(
    extra_attributes__nightly_price__lt=1000000
)

# املاک با wifi
has_wifi = Property.objects.filter(
    extra_attributes__amenities__contains=['wifi']
)
```

**چرا برخی چیزها در extra_attributes هستن؟**

✅ **در extra_attributes:**
- فیلدهای نادر (فقط برای اجاره کوتاه‌مدت)
- چیزهایی که ممکنه تغییر کنن
- فیلدهایی که فیلتر اصلی UI نیستن

❌ **نباید در extra_attributes:**
- فیلدهای پرکاربرد (bedrooms, area)
- چیزهایی که باید سریع فیلتر بشن
- چیزهایی که sort می‌شن

---

## ایندکس‌ها و بهینه‌سازی

### Index های مهم:

```python
indexes = [
    # 1. جستجوی اصلی (ترکیبی)
    models.Index(
        fields=['is_published', 'is_public', 'city', 'property_type', 'bedrooms', '-price'],
        condition=Q(is_published=True, is_public=True, is_active=True),
        name='idx_main_search'
    ),
    
    # 2. جستجوی موقعیت
    models.Index(
        fields=['city', 'region', 'neighborhood', '-created_at'],
        condition=Q(is_published=True, is_public=True),
        name='idx_location_search'
    ),
    
    # 3. بازه قیمت
    models.Index(
        fields=['is_published', 'is_public', 'price', 'sale_price', 'monthly_rent'],
        condition=Q(is_published=True, is_public=True),
        name='idx_price_range'
    ),
    
    # 4. جزئیات ملک
    models.Index(
        fields=['city', 'year_built', 'floor_number', 'parking_spaces', 'storage_rooms'],
        condition=Q(is_published=True, year_built__isnull=False),
        name='idx_property_details'
    ),
    
    # 5. نوع سند
    models.Index(
        fields=['city', 'document_type', '-price'],
        condition=Q(is_published=True, is_public=True),
        name='idx_document_type'
    ),
    
    # 6. املاک ویژه
    models.Index(
        fields=['is_featured', '-views_count', '-created_at'],
        condition=Q(is_published=True, is_public=True, is_featured=True),
        name='idx_featured_props'
    ),
    
    # 7. داشبورد کارگزار
    models.Index(
        fields=['agent', 'is_published', '-created_at'],
        name='idx_agent_dashboard'
    ),
    
    # 8. داشبورد آژانس
    models.Index(
        fields=['agency', 'is_published', '-created_at'],
        name='idx_agency_dashboard'
    ),
    
    # 9. جستجوی نقشه
    models.Index(
        fields=['latitude', 'longitude', 'city'],
        condition=Q(latitude__isnull=False, longitude__isnull=False),
        name='idx_map_search'
    ),
    
    # 10. Full-Text Search (GIN)
    GinIndex(
        fields=['search_vector'],
        name='idx_gin_fulltext'
    ),
    
    # 11. JSON Attributes (GIN)
    GinIndex(
        fields=['extra_attributes'],
        name='idx_gin_json_attrs'
    ),
    
    # 12. Time Series (BRIN)
    BrinIndex(
        fields=['created_at'],
        pages_per_range=128,
        name='idx_brin_created'
    ),
    BrinIndex(
        fields=['published_at'],
        pages_per_range=128,
        name='idx_brin_published'
    ),
]
```

**توضیح انواع Index:**

- **B-Tree Index (معمولی):** برای فیلترهای دقیق و sort
- **GIN Index:** برای JSON و Full-Text Search
- **BRIN Index:** برای فیلدهای زمانی (سریع‌تر و کوچک‌تر)
- **Partial Index:** فقط روی رکوردهای خاص (is_published=True)

---

## متدها و توابع

### Property Methods (متدهای محاسباتی):

```python
@property
def decade_built(self):
    """دهه ساخت (مثلاً 1390)"""
    if not self.year_built:
        return None
    return (self.year_built // 10) * 10

@property
def age_years(self):
    """عمر ملک (سال)"""
    if not self.year_built:
        return None
    current_year = jdatetime.datetime.now().year
    return current_year - self.year_built

@property
def has_region(self):
    """آیا منطقه داره؟"""
    return self.region is not None and self.city is not None
```

### متدهای اصلی:

```python
def __str__(self):
    """نمایش رشته‌ای"""
    return self.title

def get_public_url(self):
    """URL صفحه ملک"""
    return f"/property/{self.slug}/"

def get_main_image(self):
    """تصویر اصلی ملک"""
    # از PropertyMedia گرفته می‌شه
    ...

def generate_structured_data(self):
    """JSON-LD برای گوگل"""
    return {
        "@context": "https://schema.org",
        "@type": "RealEstateListing",
        "name": self.title,
        ...
    }
```

### متد save() (محاسبات خودکار):

```python
def save(self, *args, **kwargs):
    # 1. اگه meta_title خالیه، از title استفاده کن
    if not self.meta_title and self.title:
        self.meta_title = self.title[:70]
    
    # 2. قیمت متری رو محاسبه کن
    if self.built_area and self.built_area > 0:
        if self.price:
            self.price_per_sqm = int(self.price / float(self.built_area))
    
    # 3. اگه شهر داره ولی استان نداره، استان رو set کن
    if self.city_id and not self.province_id:
        self.province = self.city.province
    
    # 4. اولین بار که publish می‌شه، published_at رو set کن
    if self.is_published and not self.published_at:
        from django.utils import timezone
        self.published_at = timezone.now()
    
    super().save(*args, **kwargs)
    
    # 5. کش رو invalidate کن
    PropertyCacheManager.invalidate_property(self.pk)
```

---

## نمونه کوئری‌ها

### 1. جستجوی ساده:

```python
# آپارتمان در تهران
apartments = Property.objects.filter(
    property_type__slug='apartment',
    city__slug='tehran',
    is_published=True
)
```

### 2. جستجوی پیشرفته (با فیلترهای متعدد):

```python
# آپارتمان 2 خوابه، 70-100 متر، قیمت 3-5 میلیارد
filtered = Property.objects.filter(
    property_type__slug='apartment',
    city__slug='tehran',
    bedrooms=2,
    built_area__gte=70,
    built_area__lte=100,
    price__gte=3_000_000_000,
    price__lte=5_000_000_000,
    is_published=True,
    is_public=True
).select_related(
    'agent', 'agency', 'property_type', 'city', 'province'
).prefetch_related(
    'features', 'labels', 'images'
)[:20]
```

### 3. جستجوی اجاره کوتاه‌مدت:

```python
# ویلا برای 6 نفر با استخر
short_term = Property.objects.filter(
    property_type__slug='villa',
    state__slug='short-term-rental',
    capacity__gte=6,
    features__slug='pool',
    is_published=True
).annotate(
    nightly_price=KeyTextTransform('nightly_price', 'extra_attributes')
).filter(
    nightly_price__lt=2000000  # کمتر از 2 میلیون شبانه
)
```

### 4. محبوب‌ترین املاک:

```python
popular = Property.objects.filter(
    is_published=True,
    is_public=True
).order_by('-views_count', '-favorites_count')[:10]
```

### 5. املاک یک کارگزار:

```python
agent = PropertyAgent.objects.get(id=5)
agent_properties = agent.properties.filter(
    is_published=True
).order_by('-created_at')
```

### 6. جستجوی متنی (Full-Text):

```python
from django.contrib.postgres.search import SearchQuery, SearchRank

search_query = SearchQuery('آپارتمان ولنجک نوساز')
results = Property.objects.annotate(
    rank=SearchRank('search_vector', search_query)
).filter(
    search_vector=search_query
).order_by('-rank')
```

### 7. املاک با ویژگی‌های خاص:

```python
# آسانسور + پارکینگ + استخر
luxury = Property.objects.filter(
    features__slug__in=['elevator', 'parking', 'pool']
).annotate(
    feature_count=Count('features')
).filter(
    feature_count__gte=3
).distinct()
```

---

## نکات مهم

### ✅ بهترین روش‌ها (Best Practices):

1. **همیشه select_related و prefetch_related استفاده کن:**
```python
properties = Property.objects.select_related(
    'agent', 'city', 'property_type'
).prefetch_related('features', 'labels')
```

2. **برای فیلترهای پیچیده از Q objects استفاده کن:**
```python
from django.db.models import Q

results = Property.objects.filter(
    Q(price__lte=5000000000) | Q(monthly_rent__lte=15000000),
    bedrooms__gte=2
)
```

3. **Index ها رو درست استفاده کن:**
```python
# خوب: استفاده از فیلدهای index شده
.filter(city__slug='tehran', bedrooms=2)

# بد: فیلترهای پیچیده روی JSON بدون index
.filter(extra_attributes__some_nested__value=True)
```

4. **برای count از `.count()` استفاده کن نه `len()`:**
```python
# خوب
total = Property.objects.filter(city__slug='tehran').count()

# بد (همه رو load می‌کنه)
total = len(Property.objects.filter(city__slug='tehran'))
```

5. **برای exist check از `.exists()` استفاده کن:**
```python
# خوب
has_properties = Property.objects.filter(agent=agent).exists()

# بد
has_properties = Property.objects.filter(agent=agent).count() > 0
```

### ⚠️ احتیاط‌ها:

1. **N+1 Query Problem:**
```python
# بد
for prop in Property.objects.all():
    print(prop.agent.name)  # هر بار یک query اضافی

# خوب
for prop in Property.objects.select_related('agent'):
    print(prop.agent.name)  # یک query فقط
```

2. **JSON Query Performance:**
```python
# کُند: query روی JSON بدون index
Property.objects.filter(
    extra_attributes__deep__nested__value=True
)

# سریع: فیلد مستقیم با index
Property.objects.filter(capacity__gte=4)
```

3. **Bulk Operations:**
```python
# بد: هر کدوم یک query
for prop in properties:
    prop.views_count += 1
    prop.save()

# خوب: یک query
Property.objects.filter(id__in=property_ids).update(
    views_count=F('views_count') + 1
)
```

### 🔥 نکات Performance:

1. **استفاده از only() و defer():**
```python
# فقط فیلدهای مورد نیاز
Property.objects.only('id', 'title', 'price', 'slug')

# به جز فیلدهای سنگین
Property.objects.defer('description', 'search_vector')
```

2. **Pagination:**
```python
from django.core.paginator import Paginator

properties = Property.objects.filter(is_published=True)
paginator = Paginator(properties, 20)  # 20 تا در هر صفحه
page = paginator.get_page(1)
```

3. **Caching:**
```python
from django.core.cache import cache

cache_key = f"property_{property_id}"
property_data = cache.get(cache_key)

if not property_data:
    property_data = Property.objects.get(id=property_id)
    cache.set(cache_key, property_data, 300)  # 5 minutes
```

---

## خلاصه

### تعداد فیلدها:
- **59 فیلد مستقیم**
- **9 Foreign Key**
- **3 Many-to-Many**
- **1 JSON Field**
- **18+ Index**

### فیلدهای کلیدی:
1. ✅ **capacity** (تازه اضافه شد) - ظرفیت نفرات
2. ✅ **bedrooms, bathrooms** - فیلترهای اصلی
3. ✅ **price, built_area** - فیلترهای پرکاربرد
4. ✅ **city, property_type** - دسته‌بندی اصلی
5. ✅ **features** (M2M) - امکانات (آسانسور، استخر...)
6. ✅ **extra_attributes** (JSON) - فیلدهای انعطاف‌پذیر

### قوانین طلایی:
1. 🔥 **فیلترهای اصلی UI = فیلد مستقیم** (با index)
2. 📦 **فیلدهای نادر = extra_attributes** (JSON)
3. ⚡ **همیشه select_related/prefetch_related**
4. 🎯 **Index ها رو درست استفاده کن**
5. 💾 **Cache کن (5 دقیقه)**

---

**تاریخ به‌روزرسانی:** 2025-01-30  
**نسخه:** 1.0  
**وضعیت:** ✅ Production Ready
