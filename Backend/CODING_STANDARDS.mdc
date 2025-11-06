# استانداردهای کدنویسی Django/DRF

این مستند استانداردهای کدنویسی برای تمام اپ‌های پروژه را تعریف می‌کند.

## 📋 فهرست مطالب

1. [APIResponse](#apiresponse)
2. [Service Layer](#service-layer)
3. [Serializer Layer](#serializer-layer)
4. [View Layer](#view-layer)
5. [Messages](#messages)
6. [Exception Handling](#exception-handling)
7. [Import Organization](#import-organization)

---

## 🔵 APIResponse

### تعریف
`APIResponse` یک کلاس استاتیک برای ایجاد پاسخ‌های یکدست API است.

### محل استفاده
**فقط در Views** - هرگز در Services استفاده نمی‌شود.

### متدها

#### `APIResponse.success()`
```python
return APIResponse.success(
    message="پیام موفقیت",
    data={"key": "value"},
    status_code=status.HTTP_200_OK
)
```

#### `APIResponse.error()`
```python
return APIResponse.error(
    message="پیام خطا",
    errors={"field": ["خطای فیلد"]},  # اختیاری
    status_code=status.HTTP_400_BAD_REQUEST
)
```

### مثال‌های صحیح

```python
# ✅ درست - در View
def create(self, request, *args, **kwargs):
    serializer = self.get_serializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    instance = serializer.save()
    
    return APIResponse.success(
        message=MODEL_SUCCESS["model_created"],
        data=serializer.data,
        status_code=status.HTTP_201_CREATED
    )

# ❌ اشتباه - در Service
def create_model(data):
    instance = Model.objects.create(**data)
    return APIResponse.success(...)  # خطا!
```

---

## 🟢 Service Layer

### مسئولیت‌ها
- **Business Logic**: تمام منطق کسب‌وکار
- **Database Operations**: Query ها و عملیات دیتابیس
- **Exception Raising**: پرتاب Exception برای خطاها
- **Cache Management**: مدیریت cache

### آنچه نباید انجام دهد
- ❌ بازگشت پیام‌های کاربری (user-facing messages)
- ❌ بازگشت dict با `{'success': False, 'error': '...'}`
- ❌ استفاده از `get_object_or_404`
- ❌ مدیریت HTTP response

### استاندارد Exception Handling

#### ✅ درست - Exception پرتاب کنید
```python
@staticmethod
def delete_model_by_id(model_id):
    try:
        model = Model.objects.get(id=model_id)
    except Model.DoesNotExist:
        raise Model.DoesNotExist("Model not found")
    
    # Business logic validation
    if model.has_related_items():
        raise ValidationError("Model has related items")
    
    model.delete()
    return model  # یا None اگر چیزی برنمی‌گردانیم
```

#### ❌ اشتباه - Dict return
```python
@staticmethod
def delete_model_by_id(model_id):
    model = get_object_or_404(Model, id=model_id)
    
    if model.has_related_items():
        return {'success': False, 'error': 'مدل دارای آیتم‌های مرتبط است'}
    
    model.delete()
    return {'success': True}
```

### انواع Exception

#### `Model.DoesNotExist`
برای زمانی که model یافت نشد:
```python
try:
    model = Model.objects.get(id=model_id)
except Model.DoesNotExist:
    raise Model.DoesNotExist("Model not found")
```

#### `ValidationError`
برای خطاهای validation:
```python
from django.core.exceptions import ValidationError

if some_condition:
    raise ValidationError("Validation failed")
```

### Return Values

#### ✅ درست
```python
# بازگشت object
return model

# بازگشت queryset
return Model.objects.filter(...)

# بازگشت primitive
return count

# بازگشت None (اگر چیزی برنمی‌گردانیم)
return None
```

#### ❌ اشتباه
```python
# بازگشت dict با success/error
return {'success': True, 'model': model}
return {'success': False, 'error': 'خطا'}
```

### Cache Management

```python
from src.app.utils.cache import CacheKeys, CacheManager

# در Service
CacheManager.invalidate_all()
CacheManager.invalidate_model(model_id)
```

### Import Organization در Service

```python
# 1. Django core
from django.db import transaction
from django.db.models import Count, Q
from django.core.cache import cache
from django.core.exceptions import ValidationError

# 2. Project models
from src.app.models.model import Model

# 3. Project utilities
from src.app.utils.cache import CacheKeys, CacheManager
```

---

## 🟡 Serializer Layer

### مسئولیت‌ها
- **Validation**: اعتبارسنجی داده‌های ورودی
- **Data Transformation**: تبدیل بین فرمت‌های مختلف
- **Field Validation**: اعتبارسنجی فیلدها

### آنچه نباید انجام دهد
- ❌ Business Logic پیچیده
- ❌ Database Operations مستقیم (به جز validation)
- ❌ Cache Management

### استاندارد Validation

```python
class ModelAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = Model
        fields = ['field1', 'field2']
    
    def validate_field1(self, value):
        """Validation برای یک فیلد"""
        if not value:
            raise serializers.ValidationError("فیلد نمی‌تواند خالی باشد")
        return value
    
    def validate(self, data):
        """Cross-field validation"""
        if data.get('field1') and not data.get('field2'):
            raise serializers.ValidationError({
                'field2': 'این فیلد الزامی است'
            })
        return data
```

### استفاده از MESSAGES در Serializer

```python
# ❌ اشتباه - پیام hardcode
raise serializers.ValidationError("فیلد نامعتبر است")

# ✅ درست - استفاده از MESSAGES (اگر نیاز باشد)
# در serializer معمولاً پیام‌های validation را مستقیم می‌نویسیم
# چون مربوط به field validation است
```

---

## 🔴 View Layer

### مسئولیت‌ها
- **HTTP Handling**: مدیریت درخواست‌ها و پاسخ‌ها
- **Exception Catching**: دریافت Exception از Services
- **Response Formatting**: استفاده از APIResponse
- **Permission Checking**: بررسی دسترسی‌ها

### آنچه نباید انجام دهد
- ❌ Business Logic
- ❌ Database Queries مستقیم (بجز get_queryset)
- ❌ پیام‌های hardcode

### استاندارد Exception Handling

```python
def destroy(self, request, *args, **kwargs):
    model_id = kwargs.get('pk')
    
    try:
        ModelAdminService.delete_model_by_id(model_id)
        return APIResponse.success(
            message=MODEL_SUCCESS["model_deleted"],
            status_code=status.HTTP_200_OK
        )
    except Model.DoesNotExist:
        return APIResponse.error(
            message=MODEL_ERRORS["model_not_found"],
            status_code=status.HTTP_404_NOT_FOUND
        )
    except ValidationError as e:
        error_msg = str(e)
        # تبدیل exception message به پیام کاربری
        if "related" in error_msg:
            message = MODEL_ERRORS["model_has_relations"]
        else:
            message = MODEL_ERRORS["model_delete_failed"]
        
        return APIResponse.error(
            message=message,
            status_code=status.HTTP_400_BAD_REQUEST
        )
```

### استفاده از DRF ValidationError

برای validation در View (نه Service):

```python
from rest_framework.exceptions import ValidationError as DRFValidationError

def create(self, request, *args, **kwargs):
    if some_condition:
        raise DRFValidationError({
            'non_field_errors': ['خطای validation']
        })
```

### Import Organization در View

```python
# 1. Standard library
import re

# 2. Django REST Framework
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError as DRFValidationError

# 3. Django core
from django_filters.rest_framework import DjangoFilterBackend
from django.core.exceptions import ValidationError

# 4. Project models
from src.app.models.model import Model

# 5. Project serializers
from src.app.serializers.admin.model_serializer import ModelSerializer

# 6. Project services
from src.app.services.admin.model_services import ModelAdminService

# 7. Project utilities
from src.core.responses.response import APIResponse
from src.app.messages.messages import MODEL_SUCCESS, MODEL_ERRORS
```

---

## 🟣 Messages

### ساختار فایل Messages

هر اپ باید فایل `messages.py` در پوشه `messages/` داشته باشد:

```python
# src/app/messages/messages.py

MODEL_SUCCESS = {
    "model_created": "مدل با موفقیت ایجاد شد.",
    "model_updated": "مدل با موفقیت به‌روزرسانی شد.",
    "model_deleted": "مدل با موفقیت حذف شد.",
    "model_retrieved": "مدل با موفقیت دریافت شد.",
    "model_list_success": "لیست مدل‌ها با موفقیت دریافت شد.",
}

MODEL_ERRORS = {
    "model_not_found": "مدل یافت نشد.",
    "model_create_failed": "ایجاد مدل ناموفق بود.",
    "model_update_failed": "به‌روزرسانی مدل ناموفق بود.",
    "model_delete_failed": "حذف مدل ناموفق بود.",
    "model_has_relations": "این مدل دارای آیتم‌های مرتبط است.",
}
```

### استفاده در View

```python
from src.app.messages.messages import MODEL_SUCCESS, MODEL_ERRORS

return APIResponse.success(
    message=MODEL_SUCCESS["model_created"],
    data=serializer.data,
    status_code=status.HTTP_201_CREATED
)

return APIResponse.error(
    message=MODEL_ERRORS["model_not_found"],
    status_code=status.HTTP_404_NOT_FOUND
)
```

### قوانین Messages

1. **همیشه از MESSAGES استفاده کنید** - هیچ پیام hardcode در View یا Service
2. **فرمت ساده** - فقط رشته فارسی: `"پیام موفقیت"` (نه dict با en/fa)
3. **نام‌گذاری واضح** - `model_created`, `model_not_found`
4. **تفکیک Success و Errors** - دو دیکشنری جداگانه

---

## ⚠️ Exception Handling

### Exception Flow

```
View → Service → Database
  ↑        ↓
  └────────┘ (Exception)
```

### نقش هر لایه

#### Service: Exception پرتاب می‌کند
```python
# Service
def delete_model(model_id):
    try:
        model = Model.objects.get(id=model_id)
    except Model.DoesNotExist:
        raise Model.DoesNotExist("Model not found")
    
    if condition:
        raise ValidationError("Error message")
    
    model.delete()
```

#### View: Exception دریافت و تبدیل می‌کند
```python
# View
def destroy(self, request, *args, **kwargs):
    try:
        ModelAdminService.delete_model(model_id)
        return APIResponse.success(...)
    except Model.DoesNotExist:
        return APIResponse.error(
            message=MODEL_ERRORS["model_not_found"],
            status_code=status.HTTP_404_NOT_FOUND
        )
    except ValidationError as e:
        # تبدیل exception message به پیام کاربری
        return APIResponse.error(...)
```

### تبدیل Exception Message به پیام کاربری

```python
except ValidationError as e:
    error_msg = str(e)
    
    # Pattern matching برای تشخیص نوع خطا
    if "related" in error_msg:
        message = MODEL_ERRORS["model_has_relations"]
    elif "invalid" in error_msg:
        message = MODEL_ERRORS["model_invalid"]
    else:
        message = MODEL_ERRORS["model_operation_failed"]
    
    return APIResponse.error(
        message=message,
        status_code=status.HTTP_400_BAD_REQUEST
    )
```

---

## 📦 Import Organization

### ترتیب Import ها

```python
# 1. Standard library
import re
import json

# 2. Third-party (Django, DRF)
from django.db import transaction
from django.core.exceptions import ValidationError
from rest_framework import viewsets, status
from rest_framework.decorators import action

# 3. Project core
from src.core.responses.response import APIResponse

# 4. Project models
from src.app.models.model import Model

# 5. Project serializers
from src.app.serializers.admin.model_serializer import ModelSerializer

# 6. Project services
from src.app.services.admin.model_services import ModelAdminService

# 7. Project utilities
from src.app.utils.cache import CacheManager
from src.app.messages.messages import MODEL_SUCCESS, MODEL_ERRORS
```

### قوانین Import

1. **گروه‌بندی**: هر گروه با یک خط خالی جدا شود
2. **ترتیب**: Standard → Third-party → Project
3. **Import های اضافی حذف شوند**: فقط import هایی که استفاده می‌شوند
4. **Import در top level**: همه import ها در بالای فایل (نه در function)

---

## ✅ Checklist برای هر Feature جدید

### Service
- [ ] Business logic فقط در Service
- [ ] Exception می‌اندازد (نه dict return)
- [ ] از `get_object_or_404` استفاده نمی‌کند
- [ ] پیام hardcode ندارد
- [ ] Cache management درست

### View
- [ ] Exception handling دارد
- [ ] از `APIResponse.success()` و `APIResponse.error()` استفاده می‌کند
- [ ] پیام‌ها از MESSAGES می‌خواند
- [ ] Exception های Service را catch می‌کند
- [ ] Import ها مرتب هستند

### Serializer
- [ ] فقط validation انجام می‌دهد
- [ ] Business logic ندارد
- [ ] Database operations مستقیم ندارد

### Messages
- [ ] پیام‌های جدید به `messages.py` اضافه شده
- [ ] فرمت ساده (فقط رشته فارسی)
- [ ] نام‌گذاری واضح

---

## 📝 مثال کامل

### Service (`services/admin/model_services.py`)
```python
from django.db import transaction
from django.core.exceptions import ValidationError
from src.app.models.model import Model
from src.app.utils.cache import CacheManager


class ModelAdminService:
    @staticmethod
    def create_model(validated_data):
        """Create model with validation"""
        # Business logic
        if Model.objects.filter(name=validated_data['name']).exists():
            raise ValidationError("Model with this name already exists")
        
        model = Model.objects.create(**validated_data)
        CacheManager.invalidate_all()
        
        return model
    
    @staticmethod
    def delete_model_by_id(model_id):
        """Delete model with validation"""
        try:
            model = Model.objects.get(id=model_id)
        except Model.DoesNotExist:
            raise Model.DoesNotExist("Model not found")
        
        if model.has_related_items():
            raise ValidationError("Model has related items")
        
        model.delete()
        CacheManager.invalidate_model(model_id)
```

### View (`views/admin/model_views.py`)
```python
import re
from rest_framework import viewsets, status
from rest_framework.decorators import action
from django.core.exceptions import ValidationError
from src.core.responses.response import APIResponse
from src.app.models.model import Model
from src.app.serializers.admin.model_serializer import ModelSerializer
from src.app.services.admin.model_services import ModelAdminService
from src.app.messages.messages import MODEL_SUCCESS, MODEL_ERRORS


class ModelAdminViewSet(viewsets.ModelViewSet):
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            model = ModelAdminService.create_model(serializer.validated_data)
            serializer = ModelSerializer(model)
            
            return APIResponse.success(
                message=MODEL_SUCCESS["model_created"],
                data=serializer.data,
                status_code=status.HTTP_201_CREATED
            )
        except ValidationError as e:
            error_msg = str(e)
            if "already exists" in error_msg:
                message = MODEL_ERRORS["model_duplicate"]
            else:
                message = MODEL_ERRORS["model_create_failed"]
            
            return APIResponse.error(
                message=message,
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    def destroy(self, request, *args, **kwargs):
        model_id = kwargs.get('pk')
        
        try:
            ModelAdminService.delete_model_by_id(model_id)
            return APIResponse.success(
                message=MODEL_SUCCESS["model_deleted"],
                status_code=status.HTTP_200_OK
            )
        except Model.DoesNotExist:
            return APIResponse.error(
                message=MODEL_ERRORS["model_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        except ValidationError as e:
            error_msg = str(e)
            if "related" in error_msg:
                message = MODEL_ERRORS["model_has_relations"]
            else:
                message = MODEL_ERRORS["model_delete_failed"]
            
            return APIResponse.error(
                message=message,
                status_code=status.HTTP_400_BAD_REQUEST
            )
```

### Messages (`messages/messages.py`)
```python
MODEL_SUCCESS = {
    "model_created": "مدل با موفقیت ایجاد شد.",
    "model_updated": "مدل با موفقیت به‌روزرسانی شد.",
    "model_deleted": "مدل با موفقیت حذف شد.",
    "model_retrieved": "مدل با موفقیت دریافت شد.",
    "model_list_success": "لیست مدل‌ها با موفقیت دریافت شد.",
}

MODEL_ERRORS = {
    "model_not_found": "مدل یافت نشد.",
    "model_create_failed": "ایجاد مدل ناموفق بود.",
    "model_update_failed": "به‌روزرسانی مدل ناموفق بود.",
    "model_delete_failed": "حذف مدل ناموفق بود.",
    "model_duplicate": "مدلی با این نام قبلاً وجود دارد.",
    "model_has_relations": "این مدل دارای آیتم‌های مرتبط است.",
}
```

---

## 🎯 خلاصه قوانین کلیدی

### ✅ باید انجام دهید

1. **Services**: Exception پرتاب کنید، object return کنید
2. **Views**: Exception catch کنید، APIResponse استفاده کنید
3. **Messages**: همه پیام‌ها در `messages.py`
4. **Imports**: مرتب و گروه‌بندی شده
5. **Exception Handling**: در View، نه Service

### ❌ نباید انجام دهید

1. **Services**: `return {'success': False}` - ❌
2. **Services**: `get_object_or_404` - ❌
3. **Services**: پیام hardcode - ❌
4. **Views**: Business logic - ❌
5. **Views**: پیام hardcode - ❌

---

**این استانداردها برای تمام اپ‌های پروژه باید رعایت شوند.**

