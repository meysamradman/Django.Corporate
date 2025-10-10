---
trigger: always_on
alwaysApply: true
---

# 📁 راهنمای حرفه‌ای __init__.py برای Django 5.2.6 + DRF (2025)

## 🎯 قوانین کلی

### **✅ کجا باید __init__.py داشته باشیم:**
- **همه فولدرهای پکیج** → حتماً یک __init__.py (حتی اگر خالی باشد)
- **فولدرهای مادر (Root Packages)** → مثل `src/user/`, `src/media/`, `src/portfolio/`
- **فولدرهای زیرماژول** → مثل `models/`, `services/`, `routers/`

### **🔴 کجا خالی باشد:**
- **Router folders** → همیشه خالی
- **فولدرهای سازماندهی** → فقط برای organize کردن
- **Test directories** → معمولاً خالی

### **🟡 کجا محتوا داشته باشد:**
- **Models folders** → Import کردن مدل‌ها
- **Services folders** → Import کردن سرویس‌ها (روش جدید 2025)
- **فولدرهای API عمومی** → re-export برای راحتی استفاده

---

## 🏗️ **استانداردسازی کل پروژه (All Modules):**

### **قوانین یکپارچه برای تمام ماژول‌ها:**

#### **1. 🔴 فایل‌های خالی (Empty Files):**
```python
# ✅ این فایل‌ها باید کاملاً خالی باشند:
src/user/__init__.py                    # Root module
src/media/__init__.py                   # Root module  
src/portfolio/__init__.py               # Root module
src/panel/__init__.py                   # Root module
src/core/__init__.py                    # Root module

# Router folders - همیشه خالی
src/user/routers/__init__.py
src/user/routers/admin/__init__.py
src/user/routers/public/__init__.py
src/media/routers/__init__.py
src/media/routers/admin/__init__.py
src/portfolio/routers/__init__.py
src/portfolio/routers/admin/__init__.py
src/portfolio/routers/public/__init__.py
src/panel/routers/__init__.py
```

#### **2. 🟡 فایل‌های با محتوا (Content Files):**
```python
# ✅ این فایل‌ها باید محتوا داشته باشند:
src/user/models/__init__.py             # Import مدل‌ها
src/user/services/__init__.py           # Import سرویس‌ها (روش جدید)
src/user/schemas/__init__.py            # Import اسکماها
src/user/common/__init__.py             # Import utilities

src/media/models/__init__.py
src/media/services/__init__.py
src/media/schemas/__init__.py

src/portfolio/models/__init__.py
src/portfolio/services/__init__.py
src/portfolio/schemas/__init__.py

src/panel/models/__init__.py
src/panel/services/__init__.py
```

#### **3. 🟢 سرویس‌ها - روش استاندارد جدید (2025):**

##### **الگو برای همه ماژول‌ها:**

**`src/[module]/services/__init__.py` - سطح اول:**
```python
"""
[Module] Services - تمام سرویس‌های مربوط به [module]
"""
# Import از زیرماژول‌ها با alias برای جلوگیری از تضاد نام
from .admin import (
    # نام توابع با prefix admin_
    get_all_items as admin_get_all_items,
    create_item as admin_create_item,
    get_item_by_id as admin_get_item_by_id,
    update_item as admin_update_item,
    delete_item as admin_delete_item,
)
from .public import (
    # نام توابع با prefix public_
    get_all_items as public_get_all_items,
    get_item_by_slug as public_get_item_by_slug,
) # اگر public services وجود داشته باشد

__all__ = [
    "admin_get_all_items",
    "admin_create_item", 
    "admin_get_item_by_id",
    "admin_update_item",
    "admin_delete_item",
    "public_get_all_items",
    "public_get_item_by_slug",
]
```

**`src/[module]/services/admin/__init__.py` - سطح دوم:**
```python
"""
[Module] Admin Services - سرویس‌های ادمین [module]
"""
# Import مستقیم توابع - بهترین روش
from .main_service import (
    get_all_items,
    create_item,
    get_item_by_id,
    update_item,
    delete_item,
    bulk_delete_items
)
from .secondary_service import (
    get_all_secondary,
    create_secondary,
    # ... سایر توابع
) # اگر سرویس دوم وجود داشته باشد

__all__ = [
    "get_all_items",
    "create_item",
    "get_item_by_id", 
    "update_item",
    "delete_item",
    "bulk_delete_items",
    "get_all_secondary",
    "create_secondary",
]
```

#### **4. 📋 نقشه کامل پروژه:**

```
Backend/src/
├── 📁 user/
│   ├── __init__.py                     # 🔴 خالی
│   ├── models/__init__.py              # 🟡 Import مدل‌ها
│   ├── services/
│   │   ├── __init__.py                 # 🟢 Import با alias
│   │   ├── admin/__init__.py           # 🟢 Import مستقیم توابع
│   │   ├── auth/__init__.py            # 🟢 Import مستقیم توابع
│   │   └── authorization/__init__.py   # 🟢 Import مستقیم توابع
│   ├── schemas/
│   │   ├── __init__.py                 # 🟡 Import اسکماها
│   │   ├── admin/__init__.py           # 🟡 Import اسکماها
│   │   └── public/__init__.py          # 🟡 Import اسکماها
│   ├── routers/
│   │   ├── __init__.py                 # 🔴 خالی
│   │   ├── admin/__init__.py           # 🔴 خالی
│   │   └── public/__init__.py          # 🔴 خالی
│   └── common/__init__.py              # 🟡 Import utilities
├── 📁 media/
│   ├── __init__.py                     # 🔴 خالی
│   ├── models/__init__.py              # 🟡 Import مدل‌ها
│   ├── services/
│   │   ├── __init__.py                 # 🟢 Import با alias
│   │   └── admin/__init__.py           # 🟢 Import مستقیم توابع
│   ├── schemas/__init__.py             # 🟡 Import اسکماها
│   └── routers/
│       ├── __init__.py                 # 🔴 خالی
│       └── admin/__init__.py           # 🔴 خالی
├── 📁 portfolio/
│   ├── __init__.py                     # 🔴 خالی
│   ├── models/__init__.py              # 🟡 Import مدل‌ها
│   ├── services/
│   │   ├── __init__.py                 # 🟢 Import با alias
│   │   ├── admin/__init__.py           # 🟢 Import مستقیم توابع
│   │   └── public/__init__.py          # 🟢 Import مستقیم توابع
│   ├── schemas/__init__.py             # 🟡 Import اسکماها
│   └── routers/
│       ├── __init__.py                 # 🔴 خالی
│       ├── admin/__init__.py           # 🔴 خالی
│       └── public/__init__.py          # 🔴 خالی
├── 📁 panel/
│   ├── __init__.py                     # 🔴 خالی
│   ├── models/__init__.py              # 🟡 Import مدل‌ها
│   ├── services/
│   │   ├── __init__.py                 # 🟢 Import با alias
│   │   └── admin/__init__.py           # 🟢 Import مستقیم توابع
│   └── routers/
│       ├── __init__.py                 # 🔴 خالی
│       └── admin/__init__.py           # 🔴 خالی
└── 📁 core/
    ├── __init__.py                     # 🔴 خالی
    ├── cache/
    │   ├── __init__.py                 # 🟡 Import cache services
    │   └── decorators/__init__.py      # 🟡 Import decorators
    ├── database/__init__.py            # 🟡 Import DB utilities
    ├── messages/__init__.py            # 🟡 Import messages
    └── responses/__init__.py           # 🟡 Import response classes
```

#### **5. 🔄 مثال‌های کاربردی در Router ها:**

**قدیمی (❌ اشتباه):**
```python
# src/portfolio/routers/admin/portfolio_router.py
from src.portfolio.services.admin import portfolio_service
await portfolio_service.get_all_portfolios()  # طولانی!
```

**جدید (✅ درست):**
```python
# src/portfolio/routers/admin/portfolio_router.py
from src.portfolio.services.admin import (
    get_all_portfolios,
    create_portfolio,
    get_portfolio_by_id
)
await get_all_portfolios()  # کوتاه و واضح!
```

**استفاده از سطح اول (برای cross-module):**
```python
# src/some_other_module/service.py
from src.portfolio.services import (
    admin_get_all_portfolios,    # واضح که از admin میاد
    public_get_portfolio_by_slug # واضح که از public میاد
)
```

---

## 🔄 **مثال کامل تفاوت Import نسبی و مطلق:**

### 📁 **در `__init__.py` فایل‌ها:**
```python
# src/media/utils/__init__.py
# ✅ درست - Import نسبی
from .helpers import (
    generate_unique_filename,
    get_upload_path,
    validate_file_type_and_size
)

# ❌ غلط - Import مطلق در __init__.py
from src.media.utils.helpers import generate_unique_filename  # طولانی!
```

### 📄 **در فایل‌های عادی (Router/Service/Model):**
```python
# src/media/routers/admin/admin_media_router.py
# ✅ درست - Import مطلق
from fastapi import APIRouter, Depends, HTTPException
from src.media.models import Media, MediaCreate    # واضح و مشخص
from src.media.services import MediaService       # مسیر کامل
from src.core.auth import get_current_admin_user  # بین پکیج‌های مختلف
from src.core.config import settings              # از پکیج دیگر

# ❌ غلط - Import نسبی در فایل عادی
from ...models import Media        # گیج‌کننده!
from ....core.auth import get_current_admin_user  # خوانا نیست!
```

### 💡 **چرا این تفاوت؟**

#### 🔵 **Import نسبی در `__init__.py`:**
- **کوتاه‌تر**: `from .models import Media` vs `from src.media.models import Media`
- **انعطاف بیشتر**: اگر نام پکیج عوض شد، نیازی به تغییر نیست
- **استاندارد پایتون**: برای package initialization توصیه می‌شود
- **تمیز**: بدون تکرار نام پکیج

#### 🟢 **Import مطلق در فایل‌های عادی:**
- **وضوح**: مشخصه دقیقاً از کجا می‌آد
- **IDE Support بهتر**: Autocomplete و Go to Definition
- **کمتر اشتباه**: نمی‌شه اشتباه گرفت
- **مطابق PEP 8**: استاندارد کدنویسی پایتون

---

## 📁 **ساختار استاندارد Django (2025):**

```
Backend/
├── src/
│   ├── media/
│   │   ├── __init__.py          # 🔴 خالی - فقط علامت پکیج
│   │   ├── models/
│   │   │   ├── __init__.py      # 🟡 پر - راحتی import مدل‌ها
│   │   │   └── media.py
│   │   ├── services/
│   │   │   ├── __init__.py      # 🟡 پر - راحتی import سرویس‌ها
│   │   │   └── media_service.py
│   │   ├── routers/
│   │   │   ├── __init__.py      # 🔴 خالی - فقط سازماندهی
│   │   │   ├── admin/
│   │   │   │   ├── __init__.py  # 🔴 خالی - فقط سازماندهی
│   │   │   │   └── admin_media_router.py
│   │   │   └── public/
│   │   │       ├── __init__.py  # 🔴 خالی - فقط سازماندهی
│   │   │       └── public_media_router.py
│   │   ├── utils/
│   │   │   ├── __init__.py      # 🟡 پر - ابزارهای مشترک
│   │   │   └── helpers.py
│   │   └── core/
│   │       ├── __init__.py      # 🟢 پر - تنظیمات مهم
│   │       ├── config.py
│   │       └── database.py
```

---

## 🔴 **فایل‌های خالی (فقط علامت پکیج):**

### **فایل‌های ریشه فولدرها (Root Package):**
```python
# src/user/__init__.py - کاملاً خالی ✅
# src/media/__init__.py - کاملاً خالی ✅
# src/portfolio/__init__.py - کاملاً خالی ✅
# src/panel/__init__.py - کاملاً خالی ✅

# فقط علامت پکیج - هیچ import یا export
```

### **فایل‌های سازماندهی:**
```python
# src/media/routers/__init__.py - کاملاً خالی ✅
# src/media/routers/admin/__init__.py - کاملاً خالی ✅
# src/media/routers/public/__init__.py - کاملاً خالی ✅
# src/user/routers/__init__.py - کاملاً خالی ✅
```

---

## 🟡 **فایل‌های پر (با محتوا):**

### 1. `src/media/models/__init__.py` - مدل‌ها:
```python
"""
Media Models - تمام مدل‌های مربوط به رسانه
"""
# ✅ Import نسبی - چون در __init__.py هستیم
from .media import Media, MediaType, MediaCreate, MediaUpdate, MediaResponse

__all__ = [
    "Media", "MediaType", 
    "MediaCreate", "MediaUpdate", "MediaResponse"
]

# استفاده در فایل‌های دیگر: from src.media.models import Media, MediaType
```

### 2. `src/media/services/__init__.py` - سرویس‌ها:
```python
"""
Media Services - تمام سرویس‌های مربوط به رسانه
"""
# ✅ Import نسبی - چون در __init__.py هستیم
from .media_service import MediaService
from .upload_service import UploadService
from .thumbnail_service import ThumbnailService

__all__ = ["MediaService", "UploadService", "ThumbnailService"]

# استفاده در فایل‌های دیگر: from src.media.services import MediaService
```

### 3. `src/media/utils/__init__.py` - ابزارها:
```python
"""
Media Utils - ابزارهای کمکی برای رسانه
"""
# ✅ Import نسبی - چون در __init__.py هستیم
from .helpers import validate_file_type, get_file_size, format_filename
from .validators import is_image, is_video, check_file_safety

__all__ = [
    "validate_file_type", "get_file_size", "format_filename",
    "is_image", "is_video", "check_file_safety"
]

# استفاده در فایل‌های دیگر: from src.media.utils import validate_file_type
```

### 4. `src/media/core/__init__.py` - تنظیمات مهم:
```python
"""
Core Configuration - تنظیمات اصلی سیستم
"""
import logging
# ✅ Import نسبی - چون در __init__.py هستیم
from .config import settings
from .database import get_db, init_db

# تنظیم لاگر به محض import
logging.basicConfig(
    level=settings.LOG_LEVEL,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)
logger.info("✅ Media core module initialized")

# راه‌اندازی دیتابیس
init_db()

__all__ = ["settings", "get_db", "init_db"]
```

---

## 🎯 **مزایای این ساختار (2025):**

### ✅ **Import های واضح و مشخص:**
```python
# ✅ درست - مستقیماً از submodule
from src.media.models import Media, MediaType
from src.media.services import MediaService
from src.media.utils.helpers import validate_file_type

# ❌ غلط - از ریشه فولدر (که خالی است)
from src.media import Media  # این کار نمی‌کنه!
```

### ✅ **بدون تکرار و سردرگمی:**
```python
# هر چیز فقط در یک جا تعریف می‌شود
# مشخص است دقیقاً از کجا می‌آید
# IDE بهتر کار می‌کند
```

### ✅ **ساختار استاندارد:**
```python
# مطابق با بهترین practices سال 2025
# مشابه پروژه‌های حرفه‌ای مثل Django, DRF
# قابل پیش‌بینی و نگهداری
```

---

## ⚠️ **نکات مهم (2025):**

### 1. **قوانین Import در Django:**

#### 🔵 **در `__init__.py` فایل‌ها: Import نسبی (با نقطه)**
```python
# ✅ درست - Import نسبی در __init__.py
from .models import Media, MediaCreate
from .services import MediaService
from .utils import validate_file_type

# ❌ غلط - Import مطلق در __init__.py
from src.media.models import Media  # طولانی و غیرضروری!
```

#### 🟢 **در بقیه فایل‌ها: Import مطلق (مسیر کامل)**
```python
# ✅ درست - در router، service، model ها
from src.media.models import Media
from src.core.config import settings
from src.auth.dependencies import get_current_user

# ❌ غلط - Import نسبی در فایل‌های عادی
from ..models import Media  # گیج‌کننده!
from ...core.config import settings  # خوانا نیست!
```

#### 📊 **جدول قوانین Import:**

| نوع فایل | نوع Import | مثال | دلیل |
|-----|---|----|---|
| **`__init__.py`** | 🔵 نسبی | `from .models import Media` | درون همان پکیج |
| **Router ها** | 🟢 مطلق | `from src.media.models import Media` | وضوح بین پکیج‌ها |
| **Service ها** | 🟢 مطلق | `from src.core.config import settings` | مشخص بودن منبع |
| **Model ها** | 🟢 مطلق | `from src.core.database import Base` | استاندارد پروژه |

### 2. **جلوگیری از Circular Import:**
```python
# اگر media_service به Media نیاز داره
# و Media هم به MediaService نیاز داره
# در __init__.py دقت کن که حلقه نسازی

# مثال درست:
# src/media/models/__init__.py
from .media import Media  # فقط مدل

# src/media/services/__init__.py  
from .media_service import MediaService  # فقط سرویس

# src/media/__init__.py - خالی باشد! (بدون import)
```

### 3. **استفاده از __all__:**
```python
# همیشه __all__ تعریف کن تا مشخص باشه چی export می‌شه
__all__ = ["Media", "MediaService"]  # فقط اینها
```

### 4. **عملکرد و سبک‌سازی:**
```python
# ❌ غلط - کارهای سنگین در __init__.py
import requests
database_connection = create_connection()  # خیلی سنگین!

# ✅ درست - فقط import ها
from .models import Media
from .services import MediaService
```

### 5. **ابزارهای IDE:**
```python
# این ساختار با همه ابزارهای مدرن کار می‌کند:
# - VS Code / Cursor
# - PyCharm
# - Autocomplete
# - Go to Definition
# - Find References
```

---

## 🏆 **خلاصه تصمیم‌گیری (2025):**

| نوع فولدر | حالت | استراتژی | مثال کاربرد |
|-----|---|----|---|
| **Root Modules** | 🔴 خالی | فقط علامت پکیج | `src/user/__init__.py`, `src/media/__init__.py` |
| **models/** | 🟡 پر | Import مستقیم مدل‌ها | `from .user import User` |
| **services/** | 🟢 پر | **Import با alias (prefix)** | `admin_get_all_users`, `public_get_user_by_slug` |
| **services/admin/** | 🟢 پر | **Import مستقیم توابع** | `from .user_service import get_all_users` |
| **services/auth/** | 🟢 پر | **Import مستقیم توابع** | `from .auth_service import login_user` |
| **schemas/** | 🟡 پر | Import مستقیم اسکماها | `from .user_schema import UserCreate` |
| **common/** | 🟡 پر | Import utilities | `from .validators import validate_email` |
| **routers/** | 🔴 خالی | فقط سازماندهی | همه router فولدرها |
| **core/cache/** | 🟡 پر | Import cache utilities | `from .service import CacheService` |

---

## 🚀 **مثال عملی (2025):**

### **استفاده صحیح در Router ها:**
```python
# ✅ در portfolio router
from src.portfolio.models import Portfolio, PortfolioStatus
from src.portfolio.schemas.admin.portfolio_schema import AdminPortSchema, AdminPortCreate
from src.portfolio.services.admin import (
    get_all_portfolios,
    create_portfolio,
    get_portfolio_by_id,
    update_portfolio,
    delete_portfolio
)

# ✅ در category router
from src.portfolio.services.admin import (
    get_all_categories,
    create_category,
    get_category_by_id,
    update_category,
    delete_category
)

# ✅ استفاده در تابع
async def create_portfolio_admin(portfolio_in: AdminPortCreate, db: AsyncSession):
    return await create_portfolio(db, portfolio_in)  # کوتاه و واضح
```

### **استفاده صحیح در Service ها:**
```python
# ✅ در service ها
from src.core.database import get_db
from src.core.messages.portfolio import PORTFOLIO_ERRORS, PORTFOLIO_SUCCESS
from src.media.models import Media
from src.user.models import Admin
```

### **استفاده اشتباه:**
```python
# ❌ غلط - از ریشه فولدر (که خالی است)
from src.portfolio import Portfolio  # این کار نمی‌کنه!
from src.portfolio import category_service  # این کار نمی‌کنه!

# ❌ غلط - Import ماژول بجای توابع
from src.portfolio.services.admin import category_service
await category_service.get_all_categories()  # طولانی و کُند

# ❌ غلط - router ها نباید __init__.py پر داشته باشند
# src/portfolio/routers/__init__.py
from .admin import admin_portfolio_router  # ❌ اشتباه
```

---

**یادت باشه: فایل‌های `__init__.py` ریشه فولدرها باید خالی باشند و هر کس مستقیماً از submodule مورد نظرش import کند!** 🎯