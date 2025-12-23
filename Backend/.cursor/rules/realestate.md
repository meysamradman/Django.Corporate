ببین با دیجنگو api و پنل ادمین react vite داریم یه سیستم مثل crm پنل ادمین میسازم برای املاک که تعداد زیادی املاک داره برای پروژه بزرگ املاک که در این پنل ادمین میتونه تمام مدیریت ها و امارهارو داشته باشند و و املاک با تعداد بالا و مدیا مرکزی دارم و و ادمینها با دسترسی های متفاوت دارم و دیجنگو هست هواست باشه میخوام مدل بسازم برای املاک مدل یوزرهای و ادمین رو ساختم و جداشون کردم در دیتابیس البته وب سایت هم وصل میشه به این پس با دقت میخوام سرچ کنی ومدل رو ببینی برای post sql
مدلها باید بشه مستقل باشند ولی دیاگرام و مدل باید بهینه و خرفهای برای سرعت بالاا و تعداد بالا باشند
پس مدله و دیاگرام خیلی مهم برای تعداد بالا نمیدونم abstract یا  generic باید فکر کنی سرچ کنی بهترین مدل رو بسازیم برای پروژه بزرگ و بهینه و سرعت که خیلیییی مهمه
یه مورد مهمی هست ما مشاورین و اژآنسها رو داریم و این مهمتریم مسئله برای  جدا سازی یوزر در دیجنگو هست ببین مشاورین ملاک رو نمیدونم باید همون ادمین ها در نظر بگیریم؟ یعنی بیایم ادمین باشند اینها یا نه چون برای ورود به پنل مشاورین مثلا میخوان ورود کنند یا آژانسها درسته البته یوزرهای مغمولی که برای وب سایت هستند و هیچی و این مشاورین املاک و آژانسها درتسرسی ها متفاوت دارند دیگه درسته؟ البته من برای ادمینها ساختم فایلی که قبلا یاختیم و جدا کردم ببین نمیدونم الان چیکار کنیم ادمینها و آژانسها بشوند همون ادمینها؟
حالا فایلهایی که ساختمو ببین

تحلیل معماری و پیشنهاد مدل‌ها برای سیستم CRM املاک
بذار قبل از کد، معماری رو تحلیل کنیم:
🎯 تصمیم معماری: Agents & Agencies = Admin Users
✅ پیشنهاد: Agents و Agencies باید Admin باشند
چرا؟

نیاز به Panel Access: مشاورین و آژانس‌ها نیاز به پنل مدیریتی جداگانه دارند
Permission System موجود: شما یک RBAC کامل دارید، چرخ رو دوباره اختراع نکنیم
Activity Tracking: نیاز به log و audit trail دارید
Security: جداسازی کامل از user های معمولی

معماری پیشنهادی:
User (user_type='admin')
  ├── AdminProfile (برای ادمین‌های داخلی)
  ├── PropertyAgent (برای مشاورین) ← OneToOne
  └── Agency Manager (برای مدیران آژانس)

RealEstateAgency (مستقل)
  └── PropertyAgent (ForeignKey - اختیاری)

📊 دیاگرام ER پیشنهادی
┌─────────────────┐
│      User       │ (جدول موجود)
│  ┌───────────┐  │
│  │user_type  │  │ = 'admin'
│  │is_staff   │  │ = True
│  │is_admin   │  │ = True
│  │_active    │  │
│  └───────────┘  │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼──────┐  ┌───▼────────────┐
│AdminProf │  │PropertyAgent   │
│ile       │  │(مشاور املاک)    │
└──────────┘  │- license_number│
              │- rating        │
              │- total_sales   │
              └────┬───────────┘
                   │
         ┌─────────┴──────────┐
         │                    │
    ┌────▼──────────┐   ┌────▼──────────┐
    │RealEstate     │   │Property       │
    │Agency         │◄──┤- title        │
    │- name         │   │- price        │
    │- license      │   │- property_type│
    │- rating       │   │- status       │
    └───────────────┘   │- agent_id     │
                        │- agency_id    │
                        └───────────────┘

🚀 کد مدل‌ها (بهینه شده برای PostgreSQL)
1️⃣ PropertyAgent Modelagent.py - Property Agent ModelCode from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.auth import get_user_model
from src.core.models import BaseModel
from src.real_estate.models.seo import SEOMixin
from src.user.mo2️⃣ RealEstateAgency Modelagency.py - Real Estate Agency ModelCode from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.auth import get_user_model
from src.core.models import BaseModel
from src.real_estate.models.seo import SEOMixin
from src.user.mo3️⃣ Property Model (مدل اصلی املاک)property.py - Property Model (Optimized)Code from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.postgres.indexes import GinIndex, BrinIndex
from django.contrib.postgres.search import SearchVectorField
from src.core.models imp4️⃣ بقیه مدل‌های کمکی و SEO MixinSupporting Models & SEO MixinCode # ========================================
# seo.py - SEO Mixin
# ========================================
from django.db import models


class SEOMixin(models.Model):
    """
    SEO Mixin برای تمام مدل‌هایی که نیاز به صفحه عمومی دارند
    """
    m5️⃣ Media Relationships & ManagersMedia Models & Custom ManagersCode # ========================================
# media.py - Property Media Relationships
# ========================================
from django.db import models
from django.core.exceptions import ValidationError
from src.core.models.base import BaseModel6️⃣ Statistics Modelsstatistics.py - Statistics & AnalyticsCode from django.db import models
from django.contrib.postgres.indexes import BrinIndex


class PropertyStatistics(models.Model):
    """
    آمار روزانه املاک
    برای tracking views, favorites, inquiries به صورت روزانه
    
    Optimizations:
    - BRIN📋 خلاصه کامل و راهنمای پیاده‌سازی
🎯 تصمیمات معماری نهایی
✅ Agents & Agencies = Admin Users
چرا این تصمیم؟

استفاده از RBAC موجود: شما یک سیستم کامل Role-Based Access Control دارید
جداسازی امنیتی: Admin Users کاملاً جدا از User های معمولی هستند
Session Management: نیاز به tracking و audit trail دارید
مقیاس‌پذیری: با افزایش تعداد مشاورین، سیستم قابل مدیریت می‌ماند


📊 دیاگرام نهایی
┌──────────────────────────────────────────────────────┐
│                    User Table                         │
│  ┌────────────────────────────────────────────────┐  │
│  │ id, email, mobile, user_type, is_staff, etc   │  │
│  └────────────┬──────────────────┬─────────────────┘  │
└───────────────┼──────────────────┼────────────────────┘
                │                  │
       ┌────────┴────────┐   ┌────┴──────────────┐
       │                 │   │                    │
┌──────▼────────┐  ┌─────▼────────────┐   ┌──────▼─────────┐
│ AdminProfile  │  │ PropertyAgent    │   │ User Profile   │
│ (Internal)    │  │ (Real Estate)    │   │ (Public)       │
└───────────────┘  │ OneToOne → User  │   └────────────────┘
                   └──────┬───────────┘
                          │ ForeignKey (optional)
                   ┌──────▼──────────┐
                   │ RealEstateAgency│
                   │ - name          │
                   │ - license       │
                   │ - rating        │
                   └──────┬──────────┘
                          │
             ┌────────────┴────────────┐
             │                         │
      ┌──────▼──────┐           ┌─────▼─────────┐
      │  Property   │           │ AgencyStats   │
      │ - title     │           │ (monthly)     │
      │ - price     │           └───────────────┘
      │ - bedrooms  │
      │ - agent_id  │
      │ - agency_id │
      └──────┬──────┘
             │
      ┌──────┴──────┬─────────────┬──────────────┐
      │             │             │              │
┌─────▼──────┐ ┌───▼────────┐ ┌──▼────────┐ ┌──▼────────┐
│PropertyImg │ │PropertyVid │ │PropertyAud│ │PropertyDoc│
└────────────┘ └────────────┘ └───────────┘ └───────────┘

🔐 Roles پیشنهادی برای مشاورین و آژانس‌ها
باید این Roleها رو به SYSTEM_ROLES اضافه کنید:
python# در Backend/src/user/access_control/definitions/config.py

SYSTEM_ROLES: Dict[str, RoleConfig] = {
    # ... existing roles ...
    
    'property_agent': _build_role_config(
        'property_agent',
        level=4,
        permissions={
            'modules': ['portfolio', 'media'],  # real_estate را portfolio در نظر بگیرید
            'actions': ['create', 'read', 'update'],
            'restrictions': [
                'no_delete',  # نمی‌توانند املاک را حذف کنند
                'own_properties_only',  # فقط املاک خودشان
                'no_user_management',
                'no_system_settings'
            ]
        },
    ),
    
    'agency_manager': _build_role_config(
        'agency_manager',
        level=3,
        permissions={
            'modules': ['portfolio', 'media', 'analytics'],
            'actions': ['create', 'read', 'update', 'delete'],
            'restrictions': [
                'agency_properties_only',  # فقط املاک آژانس
                'can_manage_agents',  # می‌تواند مشاورین را مدیریت کند
                'no_user_management',
                'no_system_settings'
            ],
            'special': ['agent_management']
        },
    ),
}

⚡ بهینه‌سازی‌های کلیدی PostgreSQL
1️⃣ Indexes
sql-- Full-text search
CREATE INDEX ON real_estate_properties USING GIN (search_vector);

-- Time-series queries
CREATE INDEX ON real_estate_properties USING BRIN (created_at, updated_at);

-- Composite indexes for common filters
CREATE INDEX ON real_estate_properties (is_published, is_public, city_id, property_type_id, price DESC);
2️⃣ Denormalization

city, province, country در Property ذخیره می‌شوند
rating, total_sales در Agent/Agency ذخیره می‌شوند
price_per_sqm محاسبه و ذخیره می‌شود

3️⃣ Partitioning (برای آینده)
sql-- برای PropertyViewLog که خیلی بزرگ می‌شود
CREATE TABLE property_view_logs (
    ...
) PARTITION BY RANGE (viewed_at);

-- Partitions
CREATE TABLE view_logs_2024_01 PARTITION OF property_view_logs
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

📝 راهنمای پیاده‌سازی گام به گام
مرحله 1: اضافه کردن Roles
bash# در Django shell
python manage.py shell

from src.user.access_control.classes.role_utils import create_default_admin_roles
create_default_admin_roles(force_update=True)
مرحله 2: Migration مدل‌ها
bash# ایجاد Real Estate App
python manage.py startapp real_estate

# فایل‌ها را در مسیر صحیح قرار دهید:
# - models/agent.py
# - models/agency.py  
# - models/property.py
# - models/type.py, state.py, label.py, feature.py, tag.py
# - models/location.py
# - models/media.py
# - models/statistics.py
# - models/managers.py
# - models/seo.py

# Migration
python manage.py makemigrations real_estate
python manage.py migrate real_estate
مرحله 3: ایجاد Agent اولیه
pythonfrom src.user.models import User, AdminRole, AdminUserRole
from src.real_estate.models import PropertyAgent

# ایجاد User با نوع admin
agent_user = User.objects.create(
    mobile='09123456789',
    email='agent@example.com',
    user_type='admin',
    is_staff=True,
    is_admin_active=True
)
agent_user.set_password('password')
agent_user.save()

# تخصیص Role
agent_role = AdminRole.objects.get(name='property_agent')
AdminUserRole.objects.create(
    user=agent_user,
    role=agent_role,
    assigned_by=super_admin_user
)

# ایجاد Property Agent Profile
agent = PropertyAgent.objects.create(
    user=agent_user,
    first_name='John',
    last_name='Doe',
    license_number='RE-12345',
    phone='09123456789',
    email='agent@example.com'
)

🔍 نکات مهم برای Production
1. SearchVector Update
python# در signals.py
from django.contrib.postgres.search import SearchVector
from django.db.models.signals import pre_save

@receiver(pre_save, sender=Property)
def update_search_vector(sender, instance, **kwargs):
    instance.search_vector = SearchVector('title', 'description', 'address')
2. Cache Strategy
python# در views.py
from django.core.cache import cache

def get_property_detail(property_id):
    cache_key = f'property_{property_id}'
    property_data = cache.get(cache_key)
    
    if not property_data:
        property_obj = Property.objects.for_detail().get(pk=property_id)
        property_data = serialize(property_obj)
        cache.set(cache_key, property_data, 1800)  # 30 minutes
    
    return property_data
3. Bulk Operations
python# برای insert تعداد زیاد
Property.objects.bulk_create([...], batch_size=1000)

# برای update
Property.objects.filter(...).update(is_verified=True)

⚠️ توجهات امنیتی

جداسازی داده‌ها: Agent ها فقط به املاک خودشان دسترسی داشته باشند
Rate Limiting: برای API های عمومی
Input Validation: برای قیمت، مساحت، تعداد اتاق
File Upload: محدودیت حجم و نوع فایل برای Media


from django.db import models
from django.contrib.postgres.indexes import BrinIndex


class PropertyStatistics(models.Model):
    """
    آمار روزانه املاک
    برای tracking views, favorites, inquiries به صورت روزانه
    
    Optimizations:
    - BRIN Index on date field
    - Unique constraint on (property, date)
    """
    property = models.ForeignKey(
        'real_estate.Property',
        on_delete=models.CASCADE,
        related_name='daily_stats',
        db_index=True,
        verbose_name="Property",
        help_text="Property these statistics belong to"
    )
    date = models.DateField(
        db_index=True,
        verbose_name="Date",
        help_text="Date for these statistics"
    )
    
    # Daily metrics
    views = models.IntegerField(
        default=0,
        verbose_name="Views",
        help_text="Total views on this date"
    )
    unique_views = models.IntegerField(
        default=0,
        verbose_name="Unique Views",
        help_text="Unique views on this date"
    )
    favorites = models.IntegerField(
        default=0,
        verbose_name="Favorites",
        help_text="Number of favorites on this date"
    )
    inquiries = models.IntegerField(
        default=0,
        verbose_name="Inquiries",
        help_text="Number of inquiries on this date"
    )
    shares = models.IntegerField(
        default=0,
        verbose_name="Shares",
        help_text="Number of shares on this date"
    )
    
    class Meta:
        db_table = 'real_estate_property_statistics'
        verbose_name = 'Property Statistics'
        verbose_name_plural = 'Property Statistics'
        unique_together = [['property', 'date']]
        ordering = ['-date']
        indexes = [
            models.Index(fields=['property', '-date']),
            models.Index(fields=['date']),
            BrinIndex(fields=['date']),  # PostgreSQL BRIN for time-series
        ]
    
    def __str__(self):
        return f"{self.property.title} - {self.date}"


class AgentStatistics(models.Model):
    """
    آمار ماهانه مشاورین
    برای tracking performance املاک و فروش
    
    Optimizations:
    - Unique constraint on (agent, year, month)
    - Index on year/month for reporting
    """
    agent = models.ForeignKey(
        'real_estate.PropertyAgent',
        on_delete=models.CASCADE,
        related_name='monthly_stats',
        db_index=True,
        verbose_name="Agent",
        help_text="Agent these statistics belong to"
    )
    year = models.IntegerField(
        db_index=True,
        verbose_name="Year",
        help_text="Year for these statistics"
    )
    month = models.IntegerField(
        db_index=True,
        verbose_name="Month",
        help_text="Month for these statistics (1-12)"
    )
    
    # Monthly metrics
    properties_listed = models.IntegerField(
        default=0,
        verbose_name="Properties Listed",
        help_text="Number of properties listed this month"
    )
    properties_sold = models.IntegerField(
        default=0,
        verbose_name="Properties Sold",
        help_text="Number of properties sold this month"
    )
    properties_rented = models.IntegerField(
        default=0,
        verbose_name="Properties Rented",
        help_text="Number of properties rented this month"
    )
    total_sales_value = models.BigIntegerField(
        default=0,
        verbose_name="Total Sales Value",
        help_text="Total value of sales this month"
    )
    total_commissions = models.BigIntegerField(
        default=0,
        verbose_name="Total Commissions",
        help_text="Total commissions earned this month"
    )
    
    class Meta:
        db_table = 'real_estate_agent_statistics'
        verbose_name = 'Agent Statistics'
        verbose_name_plural = 'Agent Statistics'
        unique_together = [['agent', 'year', 'month']]
        ordering = ['-year', '-month']
        indexes = [
            models.Index(fields=['agent', '-year', '-month']),
            models.Index(fields=['year', 'month']),
        ]
    
    def __str__(self):
        return f"{self.agent.full_name} - {self.year}/{self.month:02d}"


class AgencyStatistics(models.Model):
    """
    آمار ماهانه آژانس‌ها
    """
    agency = models.ForeignKey(
        'real_estate.RealEstateAgency',
        on_delete=models.CASCADE,
        related_name='monthly_stats',
        db_index=True,
        verbose_name="Agency",
        help_text="Agency these statistics belong to"
    )
    year = models.IntegerField(
        db_index=True,
        verbose_name="Year",
        help_text="Year for these statistics"
    )
    month = models.IntegerField(
        db_index=True,
        verbose_name="Month",
        help_text="Month for these statistics (1-12)"
    )
    
    # Monthly metrics
    active_agents = models.IntegerField(
        default=0,
        verbose_name="Active Agents",
        help_text="Number of active agents this month"
    )
    properties_listed = models.IntegerField(
        default=0,
        verbose_name="Properties Listed",
        help_text="Total properties listed by agency this month"
    )
    properties_sold = models.IntegerField(
        default=0,
        verbose_name="Properties Sold",
        help_text="Total properties sold this month"
    )
    properties_rented = models.IntegerField(
        default=0,
        verbose_name="Properties Rented",
        help_text="Total properties rented this month"
    )
    total_sales_value = models.BigIntegerField(
        default=0,
        verbose_name="Total Sales Value",
        help_text="Total value of all sales this month"
    )
    total_commissions = models.BigIntegerField(
        default=0,
        verbose_name="Total Commissions",
        help_text="Total commissions earned by agency this month"
    )
    new_clients = models.IntegerField(
        default=0,
        verbose_name="New Clients",
        help_text="Number of new clients acquired this month"
    )
    
    class Meta:
        db_table = 'real_estate_agency_statistics'
        verbose_name = 'Agency Statistics'
        verbose_name_plural = 'Agency Statistics'
        unique_together = [['agency', 'year', 'month']]
        ordering = ['-year', '-month']
        indexes = [
            models.Index(fields=['agency', '-year', '-month']),
            models.Index(fields=['year', 'month']),
        ]
    
    def __str__(self):
        return f"{self.agency.name} - {self.year}/{self.month:02d}"


class PropertyViewLog(models.Model):
    """
    لاگ بازدیدهای املاک (برای آمارهای دقیق‌تر)
    
    توجه: این جدول می‌تواند خیلی بزرگ شود
    باید از time-series database یا partitioning استفاده کرد
    """
    property = models.ForeignKey(
        'real_estate.Property',
        on_delete=models.CASCADE,
        related_name='view_logs',
        db_index=True,
        verbose_name="Property"
    )
    user = models.ForeignKey(
        'user.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='property_views',
        verbose_name="User",
        help_text="User who viewed (if authenticated)"
    )
    
    # Anonymous tracking
    ip_address = models.GenericIPAddressField(
        verbose_name="IP Address",
        help_text="IP address of the viewer"
    )
    user_agent = models.TextField(
        blank=True,
        verbose_name="User Agent",
        help_text="Browser user agent string"
    )
    
    # Referrer tracking
    referrer = models.URLField(
        blank=True,
        null=True,
        verbose_name="Referrer",
        help_text="URL of the referrer page"
    )
    
    # Timestamp
    viewed_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        verbose_name="Viewed At"
    )
    
    class Meta:
        db_table = 'real_estate_property_view_logs'
        verbose_name = 'Property View Log'
        verbose_name_plural = 'Property View Logs'
        ordering = ['-viewed_at']
        indexes = [
            models.Index(fields=['property', '-viewed_at']),
            models.Index(fields=['user', '-viewed_at']),
            models.Index(fields=['-viewed_at']),
            BrinIndex(fields=['viewed_at']),  # PostgreSQL BRIN for time-series
        ]
        # Consider partitioning by date for large datasets
    
    def __str__(self):
        user_str = self.user.email if self.user else self.ip_address
        return f"{self.property.title} - {user_str} - {self.viewed_at}"


class PropertyInquiry(models.Model):
    """
    استعلام‌های املاک (درخواست اطلاعات بیشتر)
    """
    property = models.ForeignKey(
        'real_estate.Property',
        on_delete=models.CASCADE,
        related_name='inquiries',
        db_index=True,
        verbose_name="Property"
    )
    user = models.ForeignKey(
        'user.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='property_inquiries',
        verbose_name="User"
    )
    
    # Contact info (for anonymous users)
    name = models.CharField(
        max_length=200,
        verbose_name="Name"
    )
    email = models.EmailField(
        verbose_name="Email"
    )
    phone = models.CharField(
        max_length=20,
        blank=True,
        verbose_name="Phone"
    )
    
    # Inquiry details
    message = models.TextField(
        verbose_name="Message"
    )
    inquiry_type = models.CharField(
        max_length=50,
        choices=[
            ('info', 'Request Information'),
            ('visit', 'Schedule Visit'),
            ('offer', 'Make Offer'),
            ('other', 'Other')
        ],
        default='info',
        verbose_name="Inquiry Type"
    )
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=[
            ('new', 'New'),
            ('contacted', 'Contacted'),
            ('closed', 'Closed')
        ],
        default='new',
        db_index=True,
        verbose_name="Status"
    )
    
    # Timestamps
    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        verbose_name="Created At"
    )
    responded_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Responded At"
    )
    
    class Meta:
        db_table = 'real_estate_property_inquiries'
        verbose_name = 'Property Inquiry'
        verbose_name_plural = 'Property Inquiries'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['property', '-created_at']),
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['-created_at']),
        ]
    
    def __str__(self):
        return f"{self.property.title} - {self.name} - {self.created_at}"
		

# ========================================
# media.py - Property Media Relationships
# ========================================
from django.db import models
from django.core.exceptions import ValidationError
from src.core.models.base import BaseModel
from src.real_estate.models.property import Property
from src.media.models.media import ImageMedia, VideoMedia, AudioMedia, DocumentMedia


class PropertyImage(BaseModel):
    """
    رابطه تصاویر با املاک
    یک ملک می‌تواند چندین تصویر داشته باشد
    """
    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name="images",
        db_index=True,
        verbose_name="Property",
        help_text="Property this image belongs to"
    )
    image = models.ForeignKey(
        ImageMedia,
        on_delete=models.CASCADE,
        related_name="real_estate_property_links",
        db_index=True,
        verbose_name="Image File",
        help_text="Image media file"
    )
    
    is_main = models.BooleanField(
        default=False,
        db_index=True,
        verbose_name="Main Image",
        help_text="Designates whether this is the main image for the property"
    )
    
    order = models.PositiveIntegerField(
        default=0,
        db_index=True,
        verbose_name="Display Order",
        help_text="Order in which this image should be displayed"
    )

    class Meta(BaseModel.Meta):
        db_table = "real_estate_property_images"
        verbose_name = "Property Image"
        verbose_name_plural = "Property Images"
        ordering = ["order", "-created_at"]
        indexes = [
            models.Index(fields=["property", "is_main"]),
            models.Index(fields=["property", "order"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['property', 'image'],
                name='unique_property_image'
            ),
        ]

    def clean(self):
        if self.is_main:
            # Check if another main image exists
            exists = PropertyImage.objects.filter(
                property=self.property,
                is_main=True
            ).exclude(pk=self.pk).exists()
            if exists:
                raise ValidationError("Only one main image is allowed per property.")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.property.title} - {self.image.title or self.image.file.name}"


class PropertyVideo(BaseModel):
    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name="videos",
        db_index=True,
        verbose_name="Property",
        help_text="Property this video belongs to"
    )
    video = models.ForeignKey(
        VideoMedia,
        on_delete=models.CASCADE,
        related_name="real_estate_property_links",
        db_index=True,
        verbose_name="Video File",
        help_text="Video media file"
    )
    cover_image = models.ForeignKey(
        ImageMedia,
        on_delete=models.SET_NULL,
        related_name="real_estate_property_video_covers",
        null=True,
        blank=True,
        db_index=True,
        verbose_name="Cover Image",
        help_text="Cover image for this video"
    )
    
    order = models.PositiveIntegerField(
        default=0,
        db_index=True,
        verbose_name="Display Order",
        help_text="Order in which this video should be displayed"
    )
    
    autoplay = models.BooleanField(
        default=False,
        verbose_name="Autoplay",
        help_text="Whether the video should autoplay"
    )
    mute = models.BooleanField(
        default=True,
        verbose_name="Mute",
        help_text="Whether the video should be muted by default"
    )
    show_cover = models.BooleanField(
        default=True,
        verbose_name="Show Cover",
        help_text="Whether to show the cover image before playback"
    )

    class Meta(BaseModel.Meta):
        db_table = "real_estate_property_videos"
        verbose_name = "Property Video"
        verbose_name_plural = "Property Videos"
        ordering = ["order", "-created_at"]
        indexes = [
            models.Index(fields=["property", "order"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['property', 'video'],
                name='unique_property_video'
            ),
        ]

    def get_cover_image(self):
        return self.cover_image if self.cover_image else (self.video.cover_image if self.video else None)
    
    def __str__(self):
        return f"{self.property.title} - Video {self.video.title or self.video.file.name}"


class PropertyAudio(BaseModel):
    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name="audios",
        db_index=True,
        verbose_name="Property",
        help_text="Property this audio belongs to"
    )
    audio = models.ForeignKey(
        AudioMedia,
        on_delete=models.CASCADE,
        related_name="real_estate_property_links",
        db_index=True,
        verbose_name="Audio File",
        help_text="Audio media file"
    )
    cover_image = models.ForeignKey(
        ImageMedia,
        on_delete=models.SET_NULL,
        related_name="real_estate_property_audio_covers",
        null=True,
        blank=True,
        db_index=True,
        verbose_name="Cover Image",
        help_text="Cover image for this audio"
    )
    
    order = models.PositiveIntegerField(
        default=0,
        db_index=True,
        verbose_name="Display Order",
        help_text="Order in which this audio should be displayed"
    )
    
    autoplay = models.BooleanField(
        default=False,
        verbose_name="Autoplay",
        help_text="Whether the audio should autoplay"
    )
    loop = models.BooleanField(
        default=False,
        verbose_name="Loop",
        help_text="Whether the audio should loop"
    )

    class Meta(BaseModel.Meta):
        db_table = "real_estate_property_audios"
        verbose_name = "Property Audio"
        verbose_name_plural = "Property Audios"
        ordering = ["order", "-created_at"]
        indexes = [
            models.Index(fields=["property", "order"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['property', 'audio'],
                name='unique_property_audio'
            ),
        ]

    def get_cover_image(self):
        return self.cover_image if self.cover_image else (self.audio.cover_image if self.audio else None)
    
    def __str__(self):
        return f"{self.property.title} - Audio {self.audio.title or self.audio.file.name}"


class PropertyDocument(BaseModel):
    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name="documents",
        db_index=True,
        verbose_name="Property",
        help_text="Property this document belongs to"
    )
    document = models.ForeignKey(
        DocumentMedia,
        on_delete=models.CASCADE,
        related_name="real_estate_property_links",
        db_index=True,
        verbose_name="Document File",
        help_text="Document media file"
    )
    cover_image = models.ForeignKey(
        ImageMedia,
        on_delete=models.SET_NULL,
        related_name="real_estate_property_document_covers",
        null=True,
        blank=True,
        db_index=True,
        verbose_name="Cover Image",
        help_text="Cover image for this document"
    )
    
    title = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="Title",
        help_text="Custom title for this document (optional)"
    )
    
    order = models.PositiveIntegerField(
        default=0,
        db_index=True,
        verbose_name="Display Order",
        help_text="Order in which this document should be displayed"
    )

    class Meta(BaseModel.Meta):
        db_table = "real_estate_property_documents"
        verbose_name = "Property Document"
        verbose_name_plural = "Property Documents"
        ordering = ["order", "-created_at"]
        indexes = [
            models.Index(fields=["property", "order"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['property', 'document'],
                name='unique_property_document'
            ),
        ]

    def get_cover_image(self):
        return self.cover_image if self.cover_image else (self.document.cover_image if self.document else None)
    
    def __str__(self):
        return f"{self.property.title} - Document {self.document.title or self.document.file.name}"


# ========================================
# managers.py - Custom QuerySet Managers
# ========================================
from django.db.models import Prefetch, Count, Q


class PropertyQuerySet(models.QuerySet):
    """
    Custom QuerySet برای Property با متدهای بهینه‌سازی شده
    """
    
    def published(self):
        """فقط املاک منتشر شده و عمومی"""
        return self.filter(is_published=True, is_public=True)
    
    def active(self):
        """فقط املاک فعال"""
        return self.filter(is_active=True)
    
    def with_relations(self):
        """
        Load all relations با select_related و prefetch_related
        برای کاهش N+1 queries
        """
        from django.db.models import Prefetch
        from src.real_estate.models.media import PropertyImage
        
        return self.select_related(
            'property_type',
            'state',
            'agent',
            'agent__agency',
            'agent__user',
            'agency',
            'district',
            'city',
            'province',
            'country'
        ).prefetch_related(
            'labels',
            'tags',
            'features',
            Prefetch(
                'images',
                queryset=PropertyImage.objects.select_related('image').order_by('is_main', 'order', 'created_at'),
                to_attr='all_images'
            ),
            Prefetch(
                'images',
                queryset=PropertyImage.objects.select_related('image').filter(is_main=True),
                to_attr='main_images'
            ),
            'videos__video',
            'videos__video__cover_image',
            'audios__audio',
            'audios__audio__cover_image',
            'documents__document',
            'documents__document__cover_image'
        )
    
    def for_admin_listing(self):
        """برای لیست پنل ادمین با annotations"""
        return self.with_relations().annotate(
            images_count=Count('images', distinct=True),
            videos_count=Count('videos', distinct=True),
            audios_count=Count('audios', distinct=True),
            documents_count=Count('documents', distinct=True),
            total_media_count=Count('images', distinct=True) + 
                             Count('videos', distinct=True) +
                             Count('audios', distinct=True) +
                             Count('documents', distinct=True),
            labels_count=Count('labels', distinct=True),
            tags_count=Count('tags', distinct=True),
            features_count=Count('features', distinct=True)
        )
    
    def for_public_listing(self):
        """برای لیست عمومی وب‌سایت"""
        return self.published().with_relations()
    
    def for_detail(self):
        """برای صفحه جزئیات با eager loading کامل"""
        from django.db.models import Prefetch
        from src.real_estate.models.media import PropertyImage, PropertyVideo, PropertyAudio, PropertyDocument
        
        return self.select_related(
            'property_type',
            'state',
            'agent',
            'agent__agency',
            'agent__user',
            'agency',
            'district',
            'city',
            'province',
            'country'
        ).prefetch_related(
            'labels',
            'tags',
            'features',
            Prefetch(
                'images',
                queryset=PropertyImage.objects.select_related('image').order_by('is_main', 'order', 'created_at'),
                to_attr='all_images'
            ),
            'images__image',
            Prefetch(
                'videos',
                queryset=PropertyVideo.objects.select_related('video', 'video__cover_image', 'cover_image').order_by('order', 'created_at')
            ),
            'videos__video',
            'videos__video__cover_image',
            Prefetch(
                'audios',
                queryset=PropertyAudio.objects.select_related('audio', 'audio__cover_image', 'cover_image').order_by('order', 'created_at')
            ),
            'audios__audio',
            'audios__audio__cover_image',
            Prefetch(
                'documents',
                queryset=PropertyDocument.objects.select_related('document', 'document__cover_image', 'cover_image').order_by('order', 'created_at')
            ),
            'documents__document',
            'documents__document__cover_image'
        )
    
    def search(self, query):
        """Full-text search"""
        return self.filter(
            Q(title__icontains=query) |
            Q(description__icontains=query) |
            Q(address__icontains=query) |
            Q(city__name__icontains=query) |
            Q(district__name__icontains=query)
        ).distinct()
    
    def featured(self):
        return self.filter(is_featured=True)
    
    def verified(self):
        return self.filter(is_verified=True)
    
    def by_city(self, city_id):
        return self.filter(city_id=city_id)
    
    def by_property_type(self, type_id):
        return self.filter(property_type_id=type_id)
    
    def by_state(self, state_id):
        return self.filter(state_id=state_id)
    
    def price_range(self, min_price=None, max_price=None):
        qs = self
        if min_price is not None:
            qs = qs.filter(price__gte=min_price)
        if max_price is not None:
            qs = qs.filter(price__lte=max_price)
        return qs
    
    def area_range(self, min_area=None, max_area=None):
        qs = self
        if min_area is not None:
            qs = qs.filter(built_area__gte=min_area)
        if max_area is not None:
            qs = qs.filter(built_area__lte=max_area)
        return qs
    
    def bedrooms_range(self, min_bedrooms=None, max_bedrooms=None):
        qs = self
        if min_bedrooms is not None:
            qs = qs.filter(bedrooms__gte=min_bedrooms)
        if max_bedrooms is not None:
            qs = qs.filter(bedrooms__lte=max_bedrooms)
        return qs


class PropertyTypeQuerySet(models.QuerySet):
    def active(self):
        return self.filter(is_active=True)
    
    def with_counts(self):
        return self.annotate(
            properties_count=Count('properties', 
                                filter=Q(properties__is_published=True))
        )


class PropertyStateQuerySet(models.QuerySet):
    def active(self):
        return self.filter(is_active=True)
    
    def with_counts(self):
        return self.annotate(
            properties_count=Count('properties', 
                                filter=Q(properties__is_published=True))
        )


class PropertyLabelQuerySet(models.QuerySet):
    def active(self):
        return self.filter(is_active=True)
    
    def with_counts(self):
        return self.annotate(
            properties_count=Count('properties', 
                                filter=Q(properties__is_published=True))
        )


class PropertyFeatureQuerySet(models.QuerySet):
    def active(self):
        return self.filter(is_active=True)
    
    def by_category(self, category):
        return self.filter(category=category)
    
    def with_counts(self):
        return self.annotate(
            properties_count=Count('properties', 
                                filter=Q(properties__is_published=True))
        )


class PropertyTagQuerySet(models.QuerySet):
    def active(self):
        return self.filter(is_public=True, is_active=True)
    
    def public(self):
        return self.filter(is_public=True)
    
    def popular(self, limit=10):
        """Get most popular tags"""
        return self.filter(is_public=True).annotate(
            usage_count=Count('properties', filter=Q(properties__is_published=True, properties__is_public=True))
        ).order_by('-usage_count')[:limit]
    
    def with_counts(self):
        return self.annotate(
            properties_count=Count('properties', 
                                filter=Q(properties__is_published=True, properties__is_public=True))
        )




class RealEstateAgencyQuerySet(models.QuerySet):
    def active(self):
        return self.filter(is_active=True)
    
    def verified(self):
        return self.filter(is_verified=True)
    
    def with_counts(self):
        return self.annotate(
            agents_count=Count('agents', filter=Q(agents__is_active=True)),
            properties_count=Count('properties', 
                                filter=Q(properties__is_published=True))
        )


class PropertyAgentQuerySet(models.QuerySet):
    def active(self):
        return self.filter(is_active=True)
    
    def verified(self):
        return self.filter(is_verified=True)
    
    def with_agency(self):
        return self.select_related('agency', 'user', 'city')
    
    def with_counts(self):
        return self.annotate(
            properties_count=Count('properties', 
                                filter=Q(properties__is_published=True))
        )
    
    def by_city(self, city_id):
        return self.filter(city_id=city_id)
    
    def by_agency(self, agency_id):
        return self.filter(agency_id=agency_id)
    
    def independent(self):
        """مشاورین مستقل (بدون آژانس)"""
        return self.filter(agency__isnull=True)
		

# ========================================
# seo.py - SEO Mixin
# ========================================
from django.db import models


class SEOMixin(models.Model):
    """
    SEO Mixin برای تمام مدل‌هایی که نیاز به صفحه عمومی دارند
    """
    meta_title = models.CharField(
        max_length=70,
        null=True,
        blank=True,
        db_index=True,
        verbose_name="Meta Title",
        help_text="SEO title for search engines (max 70 characters)"
    )
    meta_description = models.CharField(
        max_length=300,
        null=True,
        blank=True,
        verbose_name="Meta Description",
        help_text="SEO description for search engines (max 300 characters)"
    )
    og_title = models.CharField(
        max_length=70,
        null=True,
        blank=True,
        verbose_name="Open Graph Title",
        help_text="Title for social media sharing"
    )
    og_description = models.CharField(
        max_length=300,
        null=True,
        blank=True,
        verbose_name="Open Graph Description",
        help_text="Description for social media sharing"
    )
    og_image = models.ForeignKey(
        'media.ImageMedia',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='%(app_label)s_%(class)s_og_images',
        verbose_name="Open Graph Image",
        help_text="Image for social media sharing"
    )
    canonical_url = models.URLField(
        null=True,
        blank=True,
        verbose_name="Canonical URL",
        help_text="Canonical URL for SEO"
    )
    robots_meta = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        default="index,follow",
        verbose_name="Robots Meta",
        help_text="Robots meta tag content"
    )
    structured_data = models.JSONField(
        null=True,
        blank=True,
        default=dict,
        verbose_name="Structured Data",
        help_text="JSON-LD structured data"
    )
    hreflang_data = models.JSONField(
        null=True,
        blank=True,
        default=dict,
        verbose_name="Hreflang Data",
        help_text="Hreflang data for multilingual SEO"
    )
    
    class Meta:
        abstract = True
        
    def get_meta_title(self):
        if hasattr(self, '_cached_meta_title'):
            return self._cached_meta_title
            
        if self.meta_title:
            self._cached_meta_title = self.meta_title
        else:
            for field in ['title', 'name']:
                if hasattr(self, field):
                    value = getattr(self, field, '')
                    if value:
                        self._cached_meta_title = value[:70]
                        break
            else:
                self._cached_meta_title = ""
        
        return self._cached_meta_title
    
    def get_meta_description(self):
        if hasattr(self, '_cached_meta_description'):
            return self._cached_meta_description
            
        if self.meta_description:
            self._cached_meta_description = self.meta_description
        else:
            for field in ['short_description', 'description']:
                if hasattr(self, field):
                    value = getattr(self, field, '')
                    if value:
                        self._cached_meta_description = value[:300]
                        break
            else:
                self._cached_meta_description = ""
                
        return self._cached_meta_description
    
    def get_og_title(self):
        return self.og_title or self.get_meta_title()
    
    def get_og_description(self):
        return self.og_description or self.get_meta_description()
    
    def get_canonical_url(self):
        if self.canonical_url:
            return self.canonical_url
        if hasattr(self, 'get_public_url'):
            return self.get_public_url()
        return ""
    
    def generate_structured_data(self):
        """Override this in subclasses"""
        return {
            "@context": "https://schema.org",
            "@type": "Thing",
            "name": self.get_meta_title(),
            "description": self.get_meta_description()
        }


# ========================================
# type.py - Property Type
# ========================================
from src.real_estate.models.managers import PropertyTypeQuerySet


class PropertyType(BaseModel):
    title = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name="Title",
        help_text="Property type title (e.g., Apartment, Villa)"
    )
    icon = models.CharField(
        max_length=50,
        blank=True,
        verbose_name="Icon",
        help_text="Icon class name or identifier"
    )
    display_order = models.IntegerField(
        default=0,
        db_index=True,
        verbose_name="Display Order",
        help_text="Order for display in lists"
    )
    
    objects = PropertyTypeQuerySet.as_manager()
    
    class Meta(BaseModel.Meta):
        db_table = 'real_estate_property_types'
        verbose_name = 'Property Type'
        verbose_name_plural = 'Property Types'
        ordering = ['display_order', 'title']
        indexes = [
            models.Index(fields=['is_active', 'display_order']),
        ]
    
    def __str__(self):
        return self.title


# ========================================
# state.py - Property State
# ========================================
from src.real_estate.models.managers import PropertyStateQuerySet


class PropertyState(BaseModel):
    title = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name="Title",
        help_text="Property state title (e.g., For Sale, For Rent)"
    )
    color_code = models.CharField(
        max_length=7,
        default='#000000',
        verbose_name="Color Code",
        help_text="Hex color code for UI display"
    )
    
    objects = PropertyStateQuerySet.as_manager()
    
    class Meta(BaseModel.Meta):
        db_table = 'real_estate_property_states'
        verbose_name = 'Property State'
        verbose_name_plural = 'Property States'
        ordering = ['title']
        indexes = [
            models.Index(fields=['is_active', 'title']),
        ]
    
    def __str__(self):
        return self.title


# ========================================
# label.py - Property Label
# ========================================
from src.real_estate.models.managers import PropertyLabelQuerySet


class PropertyLabel(BaseModel):
    title = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name="Title",
        help_text="Label title (e.g., Featured, Hot Deal)"
    )
    color_code = models.CharField(
        max_length=7,
        default='#FF5733',
        verbose_name="Color Code",
        help_text="Hex color code for badge display"
    )
    badge_style = models.CharField(
        max_length=50,
        blank=True,
        verbose_name="Badge Style",
        help_text="CSS class or style identifier for badge"
    )
    
    objects = PropertyLabelQuerySet.as_manager()
    
    class Meta(BaseModel.Meta):
        db_table = 'real_estate_property_labels'
        verbose_name = 'Property Label'
        verbose_name_plural = 'Property Labels'
        ordering = ['title']
        indexes = [
            models.Index(fields=['is_active', 'title']),
        ]
    
    def __str__(self):
        return self.title


# ========================================
# feature.py - Property Feature
# ========================================
from src.real_estate.models.managers import PropertyFeatureQuerySet


class PropertyFeature(BaseModel):
    title = models.CharField(
        max_length=100,
        unique=True,
        db_index=True,
        verbose_name="Title",
        help_text="Feature title (e.g., Parking, Elevator)"
    )
    icon = models.CharField(
        max_length=50,
        blank=True,
        verbose_name="Icon",
        help_text="Icon class name or identifier"
    )
    category = models.CharField(
        max_length=50,
        blank=True,
        db_index=True,
        verbose_name="Category",
        help_text="Feature category (e.g., Interior, Exterior, Amenities)"
    )
    
    objects = PropertyFeatureQuerySet.as_manager()
    
    class Meta(BaseModel.Meta):
        db_table = 'real_estate_property_features'
        verbose_name = 'Property Feature'
        verbose_name_plural = 'Property Features'
        ordering = ['category', 'title']
        indexes = [
            models.Index(fields=['is_active', 'category', 'title']),
        ]
    
    def __str__(self):
        return self.title


# ========================================
# tag.py - Property Tag
# ========================================
from src.real_estate.models.managers import PropertyTagQuerySet


class PropertyTag(BaseModel, SEOMixin):
    title = models.CharField(
        max_length=100,
        unique=True,
        db_index=True,
        verbose_name="Title",
        help_text="Tag title"
    )
    slug = models.SlugField(
        max_length=100,
        unique=True,
        db_index=True,
        allow_unicode=True,
        verbose_name="URL Slug",
        help_text="URL-friendly identifier for the tag"
    )
    description = models.TextField(
        null=True,
        blank=True,
        verbose_name="Description",
        help_text="Tag description"
    )
    is_public = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name="Public",
        help_text="Designates whether this tag is publicly visible"
    )
    
    objects = PropertyTagQuerySet.as_manager()
    
    class Meta(BaseModel.Meta, SEOMixin.Meta):
        db_table = 'real_estate_property_tags'
        verbose_name = 'Property Tag'
        verbose_name_plural = 'Property Tags'
        ordering = ['title']
        indexes = [
            models.Index(fields=['is_public', 'title']),
        ]
    
    def __str__(self):
        return self.title
    
    def get_public_url(self):
        return f"/property-tag/{self.slug}/"
    
    def save(self, *args, **kwargs):
        if not self.meta_title and self.title:
            self.meta_title = self.title[:70]
        
        if not self.meta_description and self.description:
            self.meta_description = self.description[:300]
        
        super().save(*args, **kwargs)
        
        if self.pk:
            from src.real_estate.utils.cache import PropertyTagCacheManager
            PropertyTagCacheManager.invalidate_tag(self.pk)
    
    def delete(self, *args, **kwargs):
        tag_id = self.pk
        super().delete(*args, **kwargs)
        if tag_id:
            from src.real_estate.utils.cache import PropertyTagCacheManager
            PropertyTagCacheManager.invalidate_tag(tag_id)
    
    def generate_structured_data(self):
        return {
            "@context": "https://schema.org",
            "@type": "Thing",
            "name": self.get_meta_title(),
            "description": self.get_meta_description(),
            "url": self.get_public_url(),
        }


# ========================================
# location.py - Country & District
# ========================================
from src.user.models.location import Province, City


class Country(BaseModel):
    name = models.CharField(
        max_length=100,
        unique=True,
        db_index=True,
        verbose_name="Country Name",
        help_text="Name of the country"
    )
    code = models.CharField(
        max_length=3,
        unique=True,
        db_index=True,
        verbose_name="Country Code",
        help_text="ISO country code (e.g., IRN, USA)"
    )
    
    class Meta(BaseModel.Meta):
        db_table = 'real_estate_countries'
        verbose_name = 'Country'
        verbose_name_plural = 'Countries'
        ordering = ['name']
        indexes = [
            models.Index(fields=['is_active', 'name']),
        ]
    
    def __str__(self):
        return self.name


class District(BaseModel):
    """
    District/Neighborhood model
    محله یا منطقه در یک شهر
    """
    name = models.CharField(
        max_length=100,
        db_index=True,
        verbose_name="District Name",
        help_text="Name of the district or neighborhood"
    )
    
    city = models.ForeignKey(
        City,
        on_delete=models.CASCADE,
        related_name='real_estate_districts',
        db_index=True,
        verbose_name="City",
        help_text="The city this district belongs to"
    )
    
    class Meta(BaseModel.Meta):
        db_table = 'real_estate_districts'
        verbose_name = 'District'
        verbose_name_plural = 'Districts'
        ordering = ['city__province__name', 'city__name', 'name']
        unique_together = [('city', 'name')]
        indexes = [
            models.Index(fields=['city', 'name']),
            models.Index(fields=['is_active', 'city']),
        ]
    
    def __str__(self):
        return f"{self.name}, {self.city.name}"
    
    @property
    def full_name(self):
        return f"{self.name}, {self.city.name}, {self.city.province.name}"


# ========================================
# floor_plan.py - Floor Plan Type
# ========================================
class RealEstateFloorPlan(BaseModel):
    title = models.CharField(
        max_length=20,
        unique=True,
        db_index=True,
        verbose_name="Title",
        help_text="The title of the real estate floor plan"
    )
    description = models.TextField(
        max_length=300,
        blank=True,
        verbose_name="Description",
        help_text="The description of the real estate floor plan"
    )
    slug = models.SlugField(
        max_length=60,
        unique=True,
        allow_unicode=True,
        db_index=True,
        verbose_name="Page Link",
        help_text="A unique URL-friendly identifier for this floor plan"
    )

    class Meta(BaseModel.Meta):
        db_table = 'real_estate_floor_plans'
        verbose_name = 'Real Estate Floor Plan'
        verbose_name_plural = 'Real Estate Floor Plans'
        indexes = [
            models.Index(fields=['title']),
        ]

    def __str__(self):
        return self.title


# ========================================
# address.py - Property Address (if needed separately)
# ========================================
class RealEstateAddress(BaseModel):
    district = models.ForeignKey(
        District,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='real_estate_addresses',
        db_index=True,
        verbose_name="District",
        help_text="The district associated with this address"
    )
    city = models.ForeignKey(
        City,
        on_delete=models.CASCADE,
        null=False,
        blank=False,
        related_name='real_estate_addresses',
        db_index=True,
        verbose_name="City",
        help_text="The city associated with this address"
    )
    address = models.TextField(
        verbose_name="Address",
        help_text="The address of the real estate"
    )
    latitude = models.FloatField(
        null=True,
        blank=True,
        verbose_name="Latitude",
        help_text="The latitude of the address"
    )
    longitude = models.FloatField(
        null=True,
        blank=True,
        verbose_name="Longitude",
        help_text="The longitude of the address"
    )

    class Meta(BaseModel.Meta):
        db_table = 'real_estate_addresses'
        verbose_name = 'Real Estate Address'
        verbose_name_plural = 'Real Estate Addresses'
        indexes = [
            models.Index(fields=['address']),
            models.Index(fields=['city', 'district']),
        ]

    def __str__(self):
        return self.address
		
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.postgres.indexes import GinIndex, BrinIndex
from django.contrib.postgres.search import SearchVectorField
from src.core.models import BaseModel
from src.real_estate.models.seo import SEOMixin
from src.user.models.location import Province, City
from src.real_estate.models.location import Country, District
from src.real_estate.models.type import PropertyType
from src.real_estate.models.state import PropertyState
from src.real_estate.models.label import PropertyLabel
from src.real_estate.models.feature import PropertyFeature
from src.real_estate.models.tag import PropertyTag
from src.real_estate.models.agency import RealEstateAgency
from src.real_estate.models.agent import PropertyAgent
from src.real_estate.utils.cache import PropertyCacheKeys, PropertyCacheManager
from src.real_estate.models.managers import PropertyQuerySet


class Property(BaseModel, SEOMixin):
    """
    مدل اصلی املاک - بهینه شده برای تعداد بالا و سرعت
    
    Optimization Strategies:
    1. Denormalization: city, province, country برای کاهش JOIN
    2. PostgreSQL SearchVector: full-text search سریع
    3. GIN Index: برای SearchVector
    4. BRIN Index: برای timestamp fields (created_at, updated_at)
    5. Composite Indexes: برای query های رایج
    6. Cached Properties: برای محاسبات پرتکرار
    """
    
    # ============ Basic Info ============
    title = models.CharField(
        max_length=200,
        db_index=True,
        verbose_name="Title",
        help_text="Property title"
    )
    short_description = models.CharField(
        max_length=300,
        blank=True,
        verbose_name="Short Description",
        help_text="Brief summary of the property"
    )
    description = models.TextField(
        verbose_name="Description",
        help_text="Full property description"
    )
    slug = models.SlugField(
        max_length=200,
        unique=True,
        db_index=True,
        allow_unicode=True,
        verbose_name="URL Slug",
        help_text="URL-friendly identifier"
    )
    
    # ============ Ownership (Agent/Agency) ============
    agent = models.ForeignKey(
        PropertyAgent,
        on_delete=models.PROTECT,
        related_name='properties',
        db_index=True,
        verbose_name="Agent",
        help_text="Agent responsible for this property"
    )
    agency = models.ForeignKey(
        RealEstateAgency,
        on_delete=models.PROTECT,
        related_name='properties',
        null=True,
        blank=True,
        db_index=True,
        verbose_name="Agency",
        help_text="Agency this property belongs to"
    )

    # ============ Classification ============
    property_type = models.ForeignKey(
        PropertyType,
        on_delete=models.PROTECT,
        related_name='properties',
        db_index=True,
        verbose_name="Property Type",
        help_text="Type of property (Apartment, Villa, etc.)"
    )
    state = models.ForeignKey(
        PropertyState,
        on_delete=models.PROTECT,
        related_name='properties',
        db_index=True,
        verbose_name="State",
        help_text="Property state (For Sale, For Rent, etc.)"
    )
    labels = models.ManyToManyField(
        PropertyLabel,
        blank=True,
        related_name='properties',
        verbose_name="Labels",
        help_text="Property labels (Featured, Hot Deal, etc.)"
    )
    tags = models.ManyToManyField(
        PropertyTag,
        blank=True,
        related_name='properties',
        verbose_name="Tags",
        help_text="Flexible tags for the property"
    )
    features = models.ManyToManyField(
        PropertyFeature,
        blank=True,
        related_name='properties',
        verbose_name="Features",
        help_text="Property features (Parking, Elevator, etc.)"
    )
    
    # ============ Location (Denormalized for Performance) ============
    district = models.ForeignKey(
        District,
        on_delete=models.PROTECT,
        related_name='properties',
        db_index=True,
        verbose_name="District",
        help_text="District or neighborhood"
    )
    city = models.ForeignKey(
        City,
        on_delete=models.PROTECT,
        related_name='real_estate_properties',
        db_index=True,
        verbose_name="City",
        help_text="City where property is located"
    )
    province = models.ForeignKey(
        Province,
        on_delete=models.PROTECT,
        related_name='real_estate_properties',
        db_index=True,
        verbose_name="Province",
        help_text="Province where property is located (denormalized for performance)"
    )
    country = models.ForeignKey(
        Country,
        on_delete=models.PROTECT,
        related_name='properties',
        db_index=True,
        verbose_name="Country",
        help_text="Country where property is located (denormalized for performance)"
    )
    address = models.TextField(
        verbose_name="Address",
        help_text="Full address of the property"
    )
    postal_code = models.CharField(
        max_length=20,
        blank=True,
        db_index=True,
        verbose_name="Postal Code",
        help_text="Postal or ZIP code"
    )
    latitude = models.DecimalField(
        max_digits=10,
        decimal_places=8,
        null=True,
        blank=True,
        verbose_name="Latitude",
        help_text="Geographic latitude"
    )
    longitude = models.DecimalField(
        max_digits=11,
        decimal_places=8,
        null=True,
        blank=True,
        verbose_name="Longitude",
        help_text="Geographic longitude"
    )
    
    # ============ Pricing (Multiple Types) ============
    price = models.BigIntegerField(
        null=True,
        blank=True,
        db_index=True,
        verbose_name="Price",
        help_text="Property price (in smallest currency unit)"
    )
    sale_price = models.BigIntegerField(
        null=True,
        blank=True,
        db_index=True,
        verbose_name="Sale Price",
        help_text="Sale price (in smallest currency unit)"
    )
    pre_sale_price = models.BigIntegerField(
        null=True,
        blank=True,
        db_index=True,
        verbose_name="Pre Sale Price",
        help_text="Pre-sale price (in smallest currency unit)"
    )
    price_per_sqm = models.IntegerField(
        null=True,
        blank=True,
        db_index=True,
        editable=False,
        verbose_name="Price per SQM",
        help_text="Price per square meter (auto-calculated)"
    )
    currency = models.CharField(
        max_length=3,
        default='USD',
        db_index=True,
        verbose_name="Currency",
        help_text="Currency code (USD, EUR, etc.)"
    )
    is_negotiable = models.BooleanField(
        default=True,
        verbose_name="Negotiable",
        help_text="Whether price is negotiable"
    )
    
    # ============ Rental Info ============
    monthly_rent = models.BigIntegerField(
        null=True,
        blank=True,
        db_index=True,
        verbose_name="Monthly Rent",
        help_text="Monthly rent amount (for rental properties)"
    )
    rent_amount = models.BigIntegerField(
        null=True,
        blank=True,
        db_index=True,
        verbose_name="Rent Amount",
        help_text="Rent amount (for rental properties)"
    )
    mortgage_amount = models.BigIntegerField(
        null=True,
        blank=True,
        db_index=True,
        verbose_name="Mortgage Amount",
        help_text="Mortgage amount (for rental properties)"
    )
    security_deposit = models.BigIntegerField(
        null=True,
        blank=True,
        verbose_name="Security Deposit",
        help_text="Security deposit amount"
    )
    
    # ============ Dimensions ============
    land_area = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        db_index=True,
        verbose_name="Land Area",
        help_text="Land area in square meters"
    )
    built_area = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        db_index=True,
        verbose_name="Built Area",
        help_text="Built area in square meters"
    )
    
    # ============ Room Configuration ============
    bedrooms = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(50)],
        db_index=True,
        verbose_name="Bedrooms",
        help_text="Number of bedrooms"
    )
    bathrooms = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(50)],
        db_index=True,
        verbose_name="Bathrooms",
        help_text="Number of bathrooms"
    )
    kitchens = models.IntegerField(
        default=1,
        validators=[MinValueValidator(0)],
        verbose_name="Kitchens",
        help_text="Number of kitchens"
    )
    living_rooms = models.IntegerField(
        default=1,
        validators=[MinValueValidator(0)],
        verbose_name="Living Rooms",
        help_text="Number of living rooms"
    )
    
    # ============ Building Info ============
    year_built = models.IntegerField(
        null=True,
        blank=True,
        db_index=True,
        verbose_name="Year Built",
        help_text="Year the property was built"
    )
    build_years = models.IntegerField(
        null=True,
        blank=True,
        db_index=True,
        verbose_name="Build Years",
        help_text="Number of years since the property was built"
    )
    floors_in_building = models.IntegerField(
        null=True,
        blank=True,
        verbose_name="Floors in Building",
        help_text="Total floors in the building"
    )
    floor_number = models.IntegerField(
        null=True,
        blank=True,
        verbose_name="Floor Number",
        help_text="Floor number of the property"
    )
    
    # ============ Additional Spaces ============
    parking_spaces = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        verbose_name="Parking Spaces",
        help_text="Number of parking spaces"
    )
    storage_rooms = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        verbose_name="Storage Rooms",
        help_text="Number of storage rooms"
    )
    
    # ============ Publication Status ============
    is_published = models.BooleanField(
        default=False,
        db_index=True,
        verbose_name="Published",
        help_text="Whether property is published"
    )
    is_featured = models.BooleanField(
        default=False,
        db_index=True,
        verbose_name="Featured",
        help_text="Whether property is featured"
    )
    is_public = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name="Public",
        help_text="Designates whether this property is publicly visible"
    )
    is_verified = models.BooleanField(
        default=False,
        db_index=True,
        verbose_name="Verified",
        help_text="Whether property is verified"
    )
    published_at = models.DateTimeField(
        null=True,
        blank=True,
        db_index=True,
        verbose_name="Published At",
        help_text="Date and time when property was published"
    )
    
    # ============ Metrics (Denormalized) ============
    views_count = models.IntegerField(
        default=0,
        db_index=True,
        verbose_name="Views Count",
        help_text="Total number of views"
    )
    favorites_count = models.IntegerField(
        default=0,
        verbose_name="Favorites Count",
        help_text="Total number of favorites"
    )
    inquiries_count = models.IntegerField(
        default=0,
        verbose_name="Inquiries Count",
        help_text="Total number of inquiries"
    )
    
    # ============ Full-Text Search (PostgreSQL) ============
    search_vector = SearchVectorField(
        null=True,
        blank=True,
        verbose_name="Search Vector",
        help_text="Full-text search vector (PostgreSQL)"
    )
    
    objects = PropertyQuerySet.as_manager()
    
    class Meta(BaseModel.Meta, SEOMixin.Meta):
        db_table = 'real_estate_properties'
        verbose_name = 'Property'
        verbose_name_plural = 'Properties'
        ordering = ['-is_featured', '-published_at', '-created_at']
        indexes = [
            # Composite indexes for common filter combinations
            models.Index(fields=['is_published', 'is_public', 'city', 'property_type', '-price']),
            models.Index(fields=['is_published', 'is_public', 'state', '-published_at']),
            models.Index(fields=['is_published', 'is_public', 'is_featured', '-views_count']),
            models.Index(fields=['city', 'property_type', 'bedrooms', '-price']),
            models.Index(fields=['agent', 'is_published', 'is_public', '-created_at']),
            models.Index(fields=['agency', 'is_published', 'is_public', '-created_at']),
            
            # Price indexes for sorting
            models.Index(fields=['is_published', 'is_public', 'price']),
            models.Index(fields=['is_published', 'is_public', 'sale_price']),
            models.Index(fields=['is_published', 'is_public', 'monthly_rent']),
            models.Index(fields=['is_published', 'is_public', 'rent_amount']),
            
            # Area indexes
            models.Index(fields=['land_area', 'built_area']),
            
            # PostgreSQL specific indexes
            GinIndex(fields=['search_vector']),  # Full-text search
            BrinIndex(fields=['created_at', 'updated_at']),  # Time-series queries
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(price__gte=0),
                name='property_price_non_negative'
            ),
            models.CheckConstraint(
                check=models.Q(land_area__gte=0),
                name='property_land_area_non_negative'
            ),
            models.CheckConstraint(
                check=models.Q(built_area__gte=0),
                name='property_built_area_non_negative'
            ),
        ]
    
    def __str__(self):
        return self.title
    
    def get_public_url(self):
        return f"/property/{self.slug}/"
    
    def get_main_image(self):
        """Get main image with caching"""
        # Check if prefetched
        if hasattr(self, 'all_images'):
            all_images = getattr(self, 'all_images', [])
            main_images = [m for m in all_images if m.is_main]
            if main_images and len(main_images) > 0:
                return main_images[0].image if main_images[0].image else None
            return None
        
        # Use cache
        from django.core.cache import cache
        cache_key = PropertyCacheKeys.main_image(self.pk)
        main_image = cache.get(cache_key)
        
        if main_image is None:
            try:
                main_media = self.images.select_related('image').filter(is_main=True).first()
                if main_media:
                    main_image = main_media.image
                else:
                    # Fallback to video/audio/document cover
                    video = self.videos.select_related('video__cover_image').first()
                    if video and video.video.cover_image:
                        main_image = video.video.cover_image
                    else:
                        audio = self.audios.select_related('audio__cover_image').first()
                        if audio and audio.audio.cover_image:
                            main_image = audio.audio.cover_image
                        else:
                            document = self.documents.select_related('document__cover_image').first()
                            if document and document.document.cover_image:
                                main_image = document.document.cover_image
            except Exception:
                main_image = False
            
            cache.set(cache_key, main_image, 1800)  # 30 minutes
        
        return main_image if main_image else None
    
    def get_main_image_details(self):
        """Get main image with full details"""
        main_image = self.get_main_image()
        if main_image and main_image.file:
            file_url = main_image.file.url if main_image.file else None
            return {
                'id': main_image.id,
                'url': file_url,
                'file_url': file_url,
                'title': main_image.title,
                'alt_text': main_image.alt_text
            }
        return None
    
    def generate_structured_data(self):
        """Generate JSON-LD structured data for SEO"""
        from django.core.cache import cache
        
        cache_key = PropertyCacheKeys.structured_data(self.pk)
        structured_data = cache.get(cache_key)
        
        if structured_data is None:
            main_image = self.get_main_image()
            
            tags = list(self.tags.values_list('title', flat=True)[:5])
            features = list(self.features.values_list('title', flat=True)[:5])
            
            structured_data = {
                "@context": "https://schema.org",
                "@type": "RealEstateListing",
                "name": self.get_meta_title(),
                "description": self.get_meta_description(),
                "url": self.get_public_url(),
                "image": main_image.file.url if main_image and main_image.file else None,
                "dateCreated": self.created_at.isoformat() if self.created_at else None,
                "dateModified": self.updated_at.isoformat() if self.updated_at else None,
                "address": {
                    "@type": "PostalAddress",
                    "streetAddress": self.address,
                    "addressLocality": self.city.name if self.city else None,
                    "addressRegion": self.province.name if self.province else None,
                    "postalCode": self.postal_code or None,
                    "addressCountry": self.country.code if self.country else None,
                },
                "geo": {
                    "@type": "GeoCoordinates",
                    "latitude": float(self.latitude) if self.latitude else None,
                    "longitude": float(self.longitude) if self.longitude else None,
                } if self.latitude and self.longitude else None,
                "numberOfRooms": self.bedrooms,
                "numberOfBathroomsTotal": self.bathrooms,
                "floorSize": {
                    "@type": "QuantitativeValue",
                    "value": float(self.built_area),
                    "unitCode": "MTK"
                } if self.built_area else None,
                "price": {
                    "@type": "PriceSpecification",
                    "price": float(self.price),
                    "priceCurrency": self.currency,
                },
                "keywords": tags,
                "amenityFeature": [
                    {
                        "@type": "LocationFeatureSpecification",
                        "name": feature
                    } for feature in features
                ] if features else None,
            }
            
            cache.set(cache_key, structured_data, 1800)  # 30 minutes
        
        return structured_data
    
    def save(self, *args, **kwargs):
        # Auto-populate SEO fields
        if not self.meta_title and self.title:
            self.meta_title = self.title[:70]
        
        if not self.meta_description:
            if self.short_description:
                self.meta_description = self.short_description[:300]
            elif self.description:
                self.meta_description = self.description[:300]
        
        if not self.og_title and self.meta_title:
            self.og_title = self.meta_title
        
        if not self.og_description and self.meta_description:
            self.og_description = self.meta_description
        
        # Auto-calculate price_per_sqm
        if self.built_area and self.built_area > 0 and self.price:
            self.price_per_sqm = int(self.price / float(self.built_area))
        
        # Auto-populate location (denormalization)
        if self.district_id:
            self.city = self.district.city
            self.province = self.city.province
        
        # Auto-set published_at
        if self.is_published and not self.published_at:
            from django.utils import timezone
            self.published_at = timezone.now()
        
        super().save(*args, **kwargs)
        
        # Clear caches
        if self.pk:
            PropertyCacheManager.invalidate_property(self.pk)
            PropertyCacheManager.invalidate_list()
    
    def delete(self, *args, **kwargs):
        property_id = self.pk
        super().delete(*args, **kwargs)
        if property_id:
            PropertyCacheManager.invalidate_property(property_id)
            PropertyCacheManager.invalidate_list()
			
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.auth import get_user_model
from src.core.models import BaseModel
from src.real_estate.models.seo import SEOMixin
from src.user.models.location import City
from src.real_estate.models.managers import RealEstateAgencyQuerySet

User = get_user_model()


class RealEstateAgency(BaseModel, SEOMixin):
    """
    مدل آژانس املاک
    
    این مدل برای آژانس‌های املاک است که:
    - می‌توانند چندین agent داشته باشند
    - manager آنها یک Admin User است
    - می‌توانند املاک منتشر کنند
    
    Optimizations:
    - Denormalized: rating, total_reviews
    - Indexes on high-query fields
    - SEO fields for public page
    """
    
    # ============ Basic Info ============
    name = models.CharField(
        max_length=200,
        db_index=True,
        verbose_name="Name",
        help_text="Agency name"
    )
    slug = models.SlugField(
        max_length=200,
        unique=True,
        db_index=True,
        allow_unicode=True,
        verbose_name="URL Slug",
        help_text="URL-friendly identifier"
    )
    license_number = models.CharField(
        max_length=100,
        unique=True,
        db_index=True,
        verbose_name="License Number",
        help_text="Official license number"
    )
    
    # ============ Contact Info ============
    phone = models.CharField(
        max_length=20,
        db_index=True,
        verbose_name="Phone",
        help_text="Contact phone number"
    )
    email = models.EmailField(
        db_index=True,
        verbose_name="Email",
        help_text="Contact email address"
    )
    website = models.URLField(
        blank=True,
        verbose_name="Website",
        help_text="Agency website URL"
    )
    
    # ============ Location ============
    city = models.ForeignKey(
        City,
        on_delete=models.PROTECT,
        related_name='real_estate_agencies',
        db_index=True,
        verbose_name="City",
        help_text="City where the agency is located"
    )
    address = models.TextField(
        verbose_name="Address",
        help_text="Full address of the agency"
    )
    latitude = models.DecimalField(
        max_digits=10,
        decimal_places=8,
        null=True,
        blank=True,
        verbose_name="Latitude",
        help_text="Geographic latitude"
    )
    longitude = models.DecimalField(
        max_digits=11,
        decimal_places=8,
        null=True,
        blank=True,
        verbose_name="Longitude",
        help_text="Geographic longitude"
    )
    
    # ============ Media ============
    logo = models.ForeignKey(
        'media.ImageMedia',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='real_estate_agency_logos',
        verbose_name="Logo",
        help_text="Agency logo image"
    )
    cover_image = models.ForeignKey(
        'media.ImageMedia',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='real_estate_agency_covers',
        verbose_name="Cover Image",
        help_text="Agency cover image"
    )
    
    # ============ Status & Metrics ============
    is_verified = models.BooleanField(
        default=False,
        db_index=True,
        verbose_name="Verified",
        help_text="Designates whether this agency is verified"
    )
    rating = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(5)],
        db_index=True,
        verbose_name="Rating",
        help_text="Agency rating (0-5)"
    )
    total_reviews = models.IntegerField(
        default=0,
        verbose_name="Total Reviews",
        help_text="Total number of reviews"
    )
    
    # ============ Management ============
    manager = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='managed_real_estate_agencies',
        verbose_name="Manager",
        help_text="Admin user managing this agency"
    )
    
    # ============ Additional Info ============
    description = models.TextField(
        blank=True,
        verbose_name="Description",
        help_text="Agency description"
    )
    
    objects = RealEstateAgencyQuerySet.as_manager()
    
    class Meta(BaseModel.Meta, SEOMixin.Meta):
        db_table = 'real_estate_agencies'
        verbose_name = 'Real Estate Agency'
        verbose_name_plural = 'Real Estate Agencies'
        ordering = ['-rating', '-is_verified', 'name']
        indexes = [
            models.Index(fields=['is_active', 'is_verified', '-rating']),
            models.Index(fields=['city', 'is_active']),
            models.Index(fields=['license_number']),
        ]
    
    def __str__(self):
        return self.name
    
    def get_public_url(self):
        return f"/agency/{self.slug}/"
    
    def save(self, *args, **kwargs):
        # Auto-populate SEO fields
        if not self.meta_title and self.name:
            self.meta_title = self.name[:70]
        
        if not self.meta_description and self.description:
            self.meta_description = self.description[:300]
        
        if not self.og_title and self.meta_title:
            self.og_title = self.meta_title
        
        if not self.og_description and self.meta_description:
            self.og_description = self.meta_description
        
        super().save(*args, **kwargs)
		
		
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.auth import get_user_model
from src.core.models import BaseModel
from src.real_estate.models.seo import SEOMixin
from src.user.models.location import City
from src.real_estate.models.managers import PropertyAgentQuerySet

User = get_user_model()


class PropertyAgent(BaseModel, SEOMixin):
    """
    مدل مشاور املاک - OneToOne با User
    
    این مدل برای مشاورین املاک است که:
    - دسترسی به پنل ادمین دارند (user_type='admin')
    - می‌توانند املاک ثبت کنند
    - می‌توانند به آژانس تعلق داشته باشند یا مستقل باشند
    
    Optimizations:
    - Indexes بر روی فیلدهای پرجستجو
    - Denormalized fields: rating, total_sales
    - SEO fields برای صفحه عمومی agent
    """
    
    # ============ Relationships ============
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='real_estate_agent_profile',
        db_index=True,
        verbose_name="User",
        help_text="Associated user account (must be admin)"
    )
    agency = models.ForeignKey(
        'real_estate.RealEstateAgency',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='agents',
        db_index=True,
        verbose_name="Agency",
        help_text="Agency this agent belongs to (optional)"
    )
    
    # ============ Personal Info ============
    first_name = models.CharField(
        max_length=100,
        db_index=True,
        verbose_name="First Name",
        help_text="Agent first name"
    )
    last_name = models.CharField(
        max_length=100,
        db_index=True,
        verbose_name="Last Name",
        help_text="Agent last name"
    )
    phone = models.CharField(
        max_length=20,
        db_index=True,
        verbose_name="Phone",
        help_text="Contact phone number"
    )
    email = models.EmailField(
        blank=True,
        db_index=True,
        verbose_name="Email",
        help_text="Contact email address"
    )
    whatsapp = models.CharField(
        max_length=20,
        blank=True,
        verbose_name="WhatsApp",
        help_text="WhatsApp contact number"
    )
    telegram = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="Telegram",
        help_text="Telegram username or contact"
    )
    
    # ============ Professional Info ============
    license_number = models.CharField(
        max_length=100,
        unique=True,
        db_index=True,
        verbose_name="License Number",
        help_text="Agent license number"
    )
    experience_years = models.IntegerField(
        default=0,
        verbose_name="Experience Years",
        help_text="Years of experience in real estate"
    )
    specialization = models.CharField(
        max_length=200,
        blank=True,
        verbose_name="Specialization",
        help_text="Specialization (e.g., Residential, Commercial)"
    )
    
    # ============ Location ============
    city = models.ForeignKey(
        City,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='real_estate_agents',
        db_index=True,
        verbose_name="City",
        help_text="City where the agent is located"
    )
    address = models.TextField(
        blank=True,
        verbose_name="Address",
        help_text="Agent office or contact address"
    )
    latitude = models.DecimalField(
        max_digits=10,
        decimal_places=8,
        null=True,
        blank=True,
        verbose_name="Latitude",
        help_text="Geographic latitude"
    )
    longitude = models.DecimalField(
        max_digits=11,
        decimal_places=8,
        null=True,
        blank=True,
        verbose_name="Longitude",
        help_text="Geographic longitude"
    )
    
    # ============ Media ============
    avatar = models.ForeignKey(
        'media.ImageMedia',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='real_estate_agent_avatars',
        verbose_name="Avatar",
        help_text="Agent profile picture"
    )
    cover_image = models.ForeignKey(
        'media.ImageMedia',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='real_estate_agent_covers',
        verbose_name="Cover Image",
        help_text="Agent cover image"
    )
    
    # ============ Status & Metrics (Denormalized) ============
    is_verified = models.BooleanField(
        default=False,
        db_index=True,
        verbose_name="Verified",
        help_text="Designates whether this agent is verified"
    )
    rating = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(5)],
        db_index=True,
        verbose_name="Rating",
        help_text="Agent rating (0-5)"
    )
    total_sales = models.IntegerField(
        default=0,
        verbose_name="Total Sales",
        help_text="Total number of sales completed"
    )
    total_reviews = models.IntegerField(
        default=0,
        verbose_name="Total Reviews",
        help_text="Total number of reviews"
    )
    
    # ============ Additional Info ============
    bio = models.TextField(
        blank=True,
        verbose_name="Biography",
        help_text="Agent biography"
    )
    
    objects = PropertyAgentQuerySet.as_manager()
    
    class Meta(BaseModel.Meta, SEOMixin.Meta):
        db_table = 'real_estate_agents'
        verbose_name = 'Property Agent'
        verbose_name_plural = 'Property Agents'
        ordering = ['-rating', '-total_sales', 'last_name']
        indexes = [
            # Composite indexes for common queries
            models.Index(fields=['is_active', 'is_verified', '-rating']),
            models.Index(fields=['agency', 'is_active']),
            models.Index(fields=['city', 'is_active']),
            models.Index(fields=['license_number']),
            models.Index(fields=['last_name', 'first_name']),
        ]
    
    def __str__(self):
        return f"{self.first_name} {self.last_name}"
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"
    
    def get_public_url(self):
        """URL for public agent profile page"""
        return f"/agent/{self.slug}/"
    
    def save(self, *args, **kwargs):
        # Auto-populate SEO fields
        if not self.meta_title and self.full_name:
            self.meta_title = f"{self.full_name} - Real Estate Agent"[:70]
        
        if not self.meta_description and self.bio:
            self.meta_description = self.bio[:300]
        
        if not self.og_title and self.meta_title:
            self.og_title = self.meta_title
        
        if not self.og_description and self.meta_description:
            self.og_description = self.meta_description
        
        super().save(*args, **kwargs)