# استفاده از Permission Classes سفارشی با DRF Spectacular (2025)

## 📋 خلاصه

این داکیومنت بررسی می‌کند که آیا استفاده از **Permission Classes سفارشی** در Django REST Framework در سال 2025 درست است و آیا با **drf-spectacular** (برای تولید Schema و مستندات API) مشکل ایجاد می‌کند یا نه.

---

## ✅ نتیجه‌گیری کلی

**بله، استفاده از Permission Classes سفارشی در 2025 کاملاً درست و استاندارد است!**

- ✅ **روش استاندارد**: استفاده از Permission Classes سفارشی یک روش استاندارد و توصیه‌شده در Django REST Framework است
- ✅ **سازگار با drf-spectacular**: drf-spectacular از نسخه 0.29.0 به بعد به خوبی با Permission Classes سفارشی کار می‌کند
- ✅ **بدون مشکل**: اگر به درستی پیاده‌سازی شود، مشکلی ایجاد نمی‌کند

---

## 🔍 بررسی جزئیات

### 1. استفاده از Permission Classes سفارشی

#### ✅ درست است؟
**بله، کاملاً درست است!**

Django REST Framework از ابتدا از Permission Classes سفارشی پشتیبانی می‌کند. این یک ویژگی اصلی و استاندارد DRF است.

#### مثال در پروژه ما:
```python
# Backend/src/portfolio/views/admin/portfolio_views.py

class PortfolioAdminViewSet(viewsets.ModelViewSet):
    permission_classes = [lambda: RequireModuleAccess('portfolio')]
    ...
```

این کد کاملاً درست و استاندارد است.

---

### 2. استفاده از Lambda در permission_classes

#### ⚠️ نکته مهم:
استفاده از `lambda` در `permission_classes` یک **workaround** است زمانی که می‌خواهیم پارامتر به Permission Class پاس بدهیم.

#### ✅ روش‌های درست:

**روش 1: Instance مستقیم (بهترین برای Schema)**
```python
# در بالای فایل (خارج از کلاس)
portfolio_permission = RequireModuleAccess('portfolio')

class PortfolioAdminViewSet(viewsets.ModelViewSet):
    permission_classes = [portfolio_permission]
```

**روش 2: Lambda (برای پارامترهای دینامیک)**
```python
# وقتی نیاز به پارامتر دینامیک داریم
class PortfolioAdminViewSet(viewsets.ModelViewSet):
    permission_classes = [lambda: RequireModuleAccess('portfolio')]
```

**روش 3: Class با __init__ پیش‌فرض**
```python
# تعریف Permission Class با مقادیر پیش‌فرض
class PortfolioPermission(RequireModuleAccess):
    def __init__(self):
        super().__init__('portfolio')

# استفاده
class PortfolioAdminViewSet(viewsets.ModelViewSet):
    permission_classes = [PortfolioPermission]  # بدون پرانتز
```

#### ❌ روش اشتباه:
```python
# ❌ کلاس بدون instantiate کردن
permission_classes = [RequireModuleAccess]  # نادرست

# ❌ فراخوانی در لیست (باعث ایجاد instance می‌شود اما مناسب نیست)
permission_classes = [RequireModuleAccess('portfolio')()]  # گیج‌کننده
```

#### 💡 توصیه:
برای بهترین سازگاری با drf-spectacular، از **روش 1** (instance مستقیم) استفاده کنید.

---

### 3. سازگاری با drf-spectacular

#### ✅ سازگار است؟
**بله، drf-spectacular از نسخه 0.29.0 به بعد به خوبی با Permission Classes سفارشی کار می‌کند.**

#### بررسی پروژه ما:
```python
# Backend/requirements.txt
drf-spectacular==0.29.0  # ✅ نسخه به‌روز

# Backend/config/django/base.py
REST_FRAMEWORK = {
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',  # ✅ تنظیم شده
    ...
}

# Backend/config/urls.py
path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
path('api/schema/swagger-ui/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
```

**همه چیز درست تنظیم شده است!**

---

## 🎯 چطور drf-spectacular Permission Classes را تشخیص می‌دهد؟

### روش 1: تشخیص خودکار
drf-spectacular به صورت خودکار Permission Classes را از `permission_classes` استخراج می‌کند و در Schema نمایش می‌دهد.

### روش 2: استفاده از extend_schema (برای کنترل بیشتر)
اگر می‌خواهید کنترل بیشتری روی Schema داشته باشید:

```python
from drf_spectacular.utils import extend_schema, OpenApiResponse

class PortfolioAdminViewSet(viewsets.ModelViewSet):
    permission_classes = [lambda: RequireModuleAccess('portfolio')]
    
    @extend_schema(
        summary="لیست نمونه‌کارها",
        description="این API لیست نمونه‌کارها را برمی‌گرداند. نیاز به دسترسی به ماژول portfolio دارد.",
        responses={
            200: OpenApiResponse(description="Success"),
            403: OpenApiResponse(description="Permission denied - نیاز به دسترسی به ماژول portfolio"),
        },
        tags=['Portfolio'],
    )
    def list(self, request, *args, **kwargs):
        ...
```

---

## ⚠️ مشکلات احتمالی و راه حل

### مشکل 1: Lambda در Schema نمایش داده نمی‌شود

#### مشکل:
```python
permission_classes = [lambda: RequireModuleAccess('portfolio')]
```

وقتی از lambda استفاده می‌کنیم، drf-spectacular ممکن است نتواند نام Permission Class را تشخیص دهد و به جای آن `<lambda>` نمایش می‌دهد.

#### راه حل 1: استفاده از instance مستقیم (بهترین)
```python
# در بالای فایل
portfolio_permission = RequireModuleAccess('portfolio')

class PortfolioAdminViewSet(viewsets.ModelViewSet):
    permission_classes = [portfolio_permission]  # ✅ Schema واضح
```

#### راه حل 2: استفاده از extend_schema
```python
from drf_spectacular.utils import extend_schema, OpenApiResponse

class PortfolioAdminViewSet(viewsets.ModelViewSet):
    permission_classes = [lambda: RequireModuleAccess('portfolio')]
    
    @extend_schema(
        summary="لیست نمونه‌کارها",
        description="دسترسی: نیاز به ماژول portfolio",
        responses={
            403: OpenApiResponse(description="Permission denied"),
        }
    )
    def list(self, request, *args, **kwargs):
        ...
```

#### راه حل 3: Permission Class اختصاصی
```python
# تعریف کلاس جدید
class PortfolioPermission(RequireModuleAccess):
    """Permission برای دسترسی به Portfolio"""
    def __init__(self):
        super().__init__('portfolio')

# استفاده
class PortfolioAdminViewSet(viewsets.ModelViewSet):
    permission_classes = [PortfolioPermission]  # ✅ نام واضح در Schema
```

---

### مشکل 2: Permission Class در Swagger UI نمایش داده نمی‌شود

#### بررسی:
1. به `/api/schema/swagger-ui/` بروید
2. یک endpoint را باز کنید
3. دنبال بخش "Authorization" یا قفل 🔒 در کنار endpoint بگردید

#### اگر نمایش داده نمی‌شود:

**راه حل 1: تنظیمات SPECTACULAR_SETTINGS**
```python
# Backend/config/django/base.py

SPECTACULAR_SETTINGS = {
    'TITLE': 'Corporate API',
    'DESCRIPTION': 'API Documentation for Corporate Admin Panel',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': True,
    'COMPONENT_SPLIT_REQUEST': True,
    'SCHEMA_PATH_PREFIX': '/api/',
    
    # اضافه کردن security scheme
    'APPEND_COMPONENTS': {
        'securitySchemes': {
            'cookieAuth': {
                'type': 'apiKey',
                'in': 'cookie',
                'name': 'sessionid',
                'description': 'Session authentication via Django cookies'
            },
            'tokenAuth': {
                'type': 'http',
                'scheme': 'bearer',
                'bearerFormat': 'Token',
                'description': 'Token-based authentication'
            }
        }
    },
    
    # تعریف security پیش‌فرض
    'SECURITY': [
        {'cookieAuth': []},
        {'tokenAuth': []}
    ],
    
    # تنظیمات Swagger UI
    'SWAGGER_UI_SETTINGS': {
        'deepLinking': True,
        'persistAuthorization': True,
        'displayOperationId': True,
        'defaultModelsExpandDepth': 2,
        'defaultModelExpandDepth': 2,
        'filter': True,
    },
}
```

**راه حل 2: استفاده از extend_schema با security**
```python
from drf_spectacular.utils import extend_schema, OpenApiResponse

class PortfolioAdminViewSet(viewsets.ModelViewSet):
    permission_classes = [lambda: RequireModuleAccess('portfolio')]
    
    @extend_schema(
        summary="لیست نمونه‌کارها",
        description="این API لیست نمونه‌کارها را برمی‌گرداند.",
        responses={
            200: OpenApiResponse(description="لیست نمونه‌کارها"),
            401: OpenApiResponse(description="Unauthenticated - نیاز به لاگین"),
            403: OpenApiResponse(description="Permission denied - نیاز به دسترسی ماژول portfolio"),
        },
        # اضافه کردن توضیحات security
        auth=['cookieAuth', 'tokenAuth'],
    )
    def list(self, request, *args, **kwargs):
        ...
```

---

### مشکل 3: Permission Class سفارشی در Schema نامشخص است

#### مشکل:
در Schema ممکن است به جای نام Permission Class، فقط `BasePermission` یا `<lambda>` نمایش داده شود.

#### راه حل: بهبود Permission Class

```python
class RequireModuleAccess(AdminRolePermission):
    """
    Permission class برای دسترسی به ماژول‌های خاص.
    
    این Permission Class بررسی می‌کند که آیا کاربر به ماژول‌های 
    مشخص شده دسترسی دارد یا نه.
    
    Args:
        *required_modules: نام ماژول‌های مورد نیاز (مثل 'portfolio', 'blog')
    
    Example:
        >>> portfolio_perm = RequireModuleAccess('portfolio')
        >>> class MyViewSet(viewsets.ModelViewSet):
        ...     permission_classes = [portfolio_perm]
    """
    
    def __init__(self, *required_modules):
        self.required_modules = list(required_modules)
        super().__init__()
    
    def __repr__(self):
        """نمایش بهتر در debugging و Schema"""
        modules_str = ', '.join(self.required_modules)
        return f"RequireModuleAccess({modules_str})"
    
    def __str__(self):
        """نمایش string"""
        return self.__repr__()
    
    @property
    def __name__(self):
        """برای نمایش در drf-spectacular"""
        if self.required_modules:
            return f"RequireModuleAccess[{','.join(self.required_modules)}]"
        return "RequireModuleAccess"
```

---

## 📝 بهترین روش‌ها (Best Practices)

### ✅ 1. استفاده از instance مستقیم (توصیه می‌شود)

```python
# ✅ بهترین روش - خوانا و Schema واضح
portfolio_permission = RequireModuleAccess('portfolio')

class PortfolioAdminViewSet(viewsets.ModelViewSet):
    """ViewSet برای مدیریت نمونه‌کارها"""
    permission_classes = [portfolio_permission]
    queryset = Portfolio.objects.all()
    serializer_class = PortfolioSerializer

# مزایا:
# - خوانایی بالا
# - Schema واضح در Swagger
# - قابل استفاده مجدد
# - IDE autocomplete کار می‌کند
```

### ✅ 2. مستندسازی کامل Permission Classes

```python
class RequireModuleAccess(AdminRolePermission):
    """
    Permission class برای کنترل دسترسی بر اساس ماژول.
    
    این کلاس بررسی می‌کند که آیا کاربر احراز هویت شده به ماژول‌های 
    مشخص شده دسترسی دارد یا نه. دسترسی‌ها از طریق Role‌های کاربر 
    در دیتابیس تعیین می‌شود.
    
    Attributes:
        required_modules (list): لیست نام ماژول‌های مورد نیاز
    
    Args:
        *required_modules (str): نام ماژول‌های مورد نیاز
            مثال: 'portfolio', 'blog', 'analytics'
    
    Returns:
        bool: True اگر کاربر دسترسی داشته باشد، False در غیر این صورت
    
    Example:
        >>> # استفاده ساده
        >>> portfolio_perm = RequireModuleAccess('portfolio')
        >>> 
        >>> class PortfolioViewSet(viewsets.ModelViewSet):
        ...     permission_classes = [portfolio_perm]
        ...     queryset = Portfolio.objects.all()
        ...     serializer_class = PortfolioSerializer
        >>> 
        >>> # استفاده برای چند ماژول
        >>> multi_perm = RequireModuleAccess('portfolio', 'blog')
    
    Notes:
        - Super admin همیشه دسترسی دارد
        - کاربر باید حداقل یک role فعال با دسترسی به ماژول داشته باشد
        - نتایج برای 5 دقیقه cache می‌شوند
    """
    
    def __init__(self, *required_modules):
        if not required_modules:
            raise ValueError("حداقل یک ماژول باید مشخص شود")
        self.required_modules = list(required_modules)
        super().__init__()
```

### ✅ 3. استفاده از extend_schema برای مستندات دقیق‌تر

```python
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiParameter
from drf_spectacular.types import OpenApiTypes

class PortfolioAdminViewSet(viewsets.ModelViewSet):
    permission_classes = [portfolio_permission]
    
    @extend_schema(
        summary="دریافت لیست نمونه‌کارها",
        description="""
        این endpoint لیست کامل نمونه‌کارها را برمی‌گرداند.
        
        **نیازمندی‌های دسترسی:**
        - کاربر باید احراز هویت شده باشد
        - دسترسی به ماژول 'portfolio' ضروری است
        - برای super admin محدودیتی وجود ندارد
        """,
        parameters=[
            OpenApiParameter(
                name='status',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='فیلتر بر اساس وضعیت (published, draft)',
                enum=['published', 'draft'],
                required=False
            ),
        ],
        responses={
            200: OpenApiResponse(
                description="لیست نمونه‌کارها با موفقیت دریافت شد"
            ),
            401: OpenApiResponse(
                description="احراز هویت نشده - ابتدا لاگین کنید"
            ),
            403: OpenApiResponse(
                description="دسترسی رد شد - نیاز به دسترسی ماژول portfolio"
            ),
        },
        tags=['Portfolio Management'],
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
```

### ✅ 4. تست Schema در محیط Development

```bash
# 1. دریافت و بررسی Schema
curl http://localhost:8000/api/schema/ | python -m json.tool > schema.json

# 2. جستجوی Permission Classes در Schema
cat schema.json | grep -A 5 "security"

# 3. بررسی Swagger UI در مرورگر
# http://localhost:8000/api/schema/swagger-ui/

# 4. تست با HTTPie (نصب: pip install httpie)
http GET http://localhost:8000/api/admin/portfolio/ \
  "Cookie:sessionid=YOUR_SESSION_ID"
```

### ✅ 5. تست دسترسی به صورت Unit Test

```python
# Backend/src/portfolio/tests/test_permissions.py

from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

from src.user.models import AdminRole, AdminUserRole

User = get_user_model()


class PortfolioPermissionTests(TestCase):
    """تست Permission Classes برای Portfolio"""
    
    def setUp(self):
        """راه‌اندازی داده‌های تست"""
        # ایجاد role
        self.portfolio_role = AdminRole.objects.create(
            name='portfolio_manager',
            display_name='Portfolio Manager',
            permissions={
                'modules': ['portfolio'],
                'actions': ['create', 'read', 'update', 'delete']
            }
        )
        
        # کاربر با دسترسی
        self.user_with_access = User.objects.create_user(
            email='portfolio@test.com',
            password='test123',
            user_type='admin',
            is_staff=True,
            is_admin_active=True
        )
        AdminUserRole.objects.create(
            user=self.user_with_access,
            role=self.portfolio_role,
            is_active=True
        )
        
        # کاربر بدون دسترسی
        self.user_without_access = User.objects.create_user(
            email='noaccess@test.com',
            password='test123',
            user_type='admin',
            is_staff=True,
            is_admin_active=True
        )
        
        self.client = APIClient()
    
    def test_access_with_permission(self):
        """کاربر با permission باید دسترسی داشته باشد"""
        self.client.force_authenticate(user=self.user_with_access)
        response = self.client.get('/api/admin/portfolio/')
        self.assertEqual(response.status_code, 200)
    
    def test_access_without_permission(self):
        """کاربر بدون permission نباید دسترسی داشته باشد"""
        self.client.force_authenticate(user=self.user_without_access)
        response = self.client.get('/api/admin/portfolio/')
        self.assertIn(response.status_code, [401, 403])
    
    def test_unauthenticated_access(self):
        """کاربر احراز هویت نشده نباید دسترسی داشته باشد"""
        response = self.client.get('/api/admin/portfolio/')
        self.assertIn(response.status_code, [401, 403])
```

---

## 🔧 تنظیمات پیشنهادی برای drf-spectacular

```python
# Backend/config/django/base.py

SPECTACULAR_SETTINGS = {
    # اطلاعات کلی API
    'TITLE': 'Corporate Admin API',
    'DESCRIPTION': '''
    # مستندات API پنل مدیریت
    
    این API برای مدیریت محتوا و داده‌های پنل ادمین طراحی شده است.
    
    ## احراز هویت
    - Session-based authentication (Django sessions)
    - Token-based authentication (optional)
    
    ## دسترسی‌ها
    تمام endpoint‌ها نیاز به احراز هویت دارند. همچنین دسترسی به هر ماژول 
    بر اساس Role کاربر کنترل می‌شود.
    ''',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': True,
    'COMPONENT_SPLIT_REQUEST': True,
    'SCHEMA_PATH_PREFIX': '/api/',
    
    # Security schemes
    'APPEND_COMPONENTS': {
        'securitySchemes': {
            'cookieAuth': {
                'type': 'apiKey',
                'in': 'cookie',
                'name': 'sessionid',
                'description': 'احراز هویت با Django session cookies'
            },
            'csrfToken': {
                'type': 'apiKey',
                'in': 'header',
                'name': 'X-CSRFToken',
                'description': 'CSRF token برای درخواست‌های POST/PUT/DELETE'
            }
        }
    },
    
    # Security پیش‌فرض برای همه endpoint‌ها
    'SECURITY': [
        {'cookieAuth': [], 'csrfToken': []}
    ],
    
    # تنظیمات Swagger UI
    'SWAGGER_UI_SETTINGS': {
        'deepLinking': True,
        'persistAuthorization': True,
        'displayOperationId': True,
        'defaultModelsExpandDepth': 2,
        'defaultModelExpandDepth': 2,
        'displayRequestDuration': True,
        'filter': True,
        'showExtensions': True,
        'showCommonExtensions': True,
        'tryItOutEnabled': True,
    },
    
    # تنظیمات Schema
    'PREPROCESSING_HOOKS': [],
    'POSTPROCESSING_HOOKS': [
        'drf_spectacular.hooks.postprocess_schema_enums',
    ],
    
    # Enum naming
    'ENUM_NAME_OVERRIDES': {},
    
    # Component naming
    'COMPONENT_SPLIT_PATCH': True,
    'COMPONENT_SPLIT_REQUEST': True,
    
    # Sorting
    'SORT_OPERATIONS': True,
    'SORT_OPERATION_PARAMETERS': True,
}
```

---

## 📊 مقایسه روش‌ها

| روش | خوانایی | Schema Quality | Performance | مناسب برای |
|-----|---------|----------------|-------------|-----------|
| **Instance مستقیم** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Production ✅ |
| **Lambda** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Quick prototyping |
| **Class اختصاصی** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Reusable permissions ✅ |
| **extend_schema** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Complex APIs ✅ |

---

## 🧪 تست و بررسی

### 1. بررسی Schema

```bash
# دریافت Schema کامل
curl http://localhost:8000/api/schema/ | python -m json.tool > api_schema.json

# بررسی security schemes
cat api_schema.json | jq '.components.securitySchemes'

# بررسی یک endpoint خاص
cat api_schema.json | jq '.paths."/api/admin/portfolio/"'

# جستجوی کلمات کلیدی
grep -i "RequireModuleAccess\|permission\|security" api_schema.json
```

### 2. بررسی Swagger UI

**مراحل:**
1. به `http://localhost:8000/api/schema/swagger-ui/` بروید
2. بررسی کنید که "Authorize" button وجود دارد
3. یک endpoint مثل `/api/admin/portfolio/` را باز کنید
4. باید قفل 🔒 در کنار endpoint ببینید
5. در توضیحات endpoint، باید requirements دسترسی ذکر شده باشد

### 3. تست عملکرد Permission

```python
# Backend/src/user/tests/test_permission_integration.py

from django.test import TestCase
from rest_framework.test import APITestCase, APIClient
from django.contrib.auth import get_user_model

User = get_user_model()


class PermissionIntegrationTest(APITestCase):
    """تست یکپارچگی Permission System با DRF"""
    
    def test_permission_class_detection(self):
        """بررسی اینکه Permission Class به درستی تشخیص داده می‌شود"""
        from src.portfolio.views.admin.portfolio_views import PortfolioAdminViewSet
        
        viewset = PortfolioAdminViewSet()
        permission_classes = viewset.permission_classes
        
        # بررسی وجود permission class
        self.assertIsNotNone(permission_classes)
        self.assertTrue(len(permission_classes) > 0)
        
        # بررسی نوع permission
        permission_instance = permission_classes[0]
        if callable(permission_instance):
            permission_instance = permission_instance()
        
        # باید RequireModuleAccess باشد
        self.assertTrue(hasattr(permission_instance, 'required_modules'))
    
    def test_schema_generation(self):
        """تست اینکه Schema به درستی تولید می‌شود"""
        response = self.client.get('/api/schema/')
        self.assertEqual(response.status_code, 200)
        
        # بررسی اینکه Schema معتبر است
        schema = response.json()
        self.assertIn('openapi', schema)
        self.assertIn('paths', schema)
        self.assertIn('components', schema)
    
    def test_swagger_ui_loads(self):
        """تست اینکه Swagger UI به درستی load می‌شود"""
        response = self.client.get('/api/schema/swagger-ui/')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'swagger-ui', response.content.lower())
```

**اجرای تست‌ها:**
```bash
# اجرای همه تست‌ها
python manage.py test

# فقط تست‌های permission
python manage.py test src.user.tests.test_permission_integration

# با verbose output
python manage.py test src.user.tests.test_permission_integration -v 2

# با coverage
coverage run --source='.' manage.py test
coverage report
coverage html
```

---

## 🔒 نکات امنیتی

### ✅ چک‌لیست امنیت Permission System:

- [ ] **همیشه بررسی authentication**: Permission قبل از بررسی role، احراز هویت را چک کند
- [ ] **Super admin bypass امن**: فقط کاربران معتبر super admin باشند
- [ ] **Cache invalidation**: بعد از تغییر role، cache پاک شود
- [ ] **تست دسترسی**: تست‌های کامل برای همه سناریوها
- [ ] **Logging**: تمام denied access‌ها log شوند
- [ ] **Rate limiting**: محدودیت تعداد درخواست برای جل