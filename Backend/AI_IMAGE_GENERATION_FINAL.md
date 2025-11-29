# ✅ سیستم کامل تولید تصویر AI (2025)

## 🎯 تغییرات انجام شده:

### 1️⃣ **Provider Management ViewSet** (11 Action)
**فایل:** `src/ai/views/image_generation_views.py`
**کلاس:** `AIImageProviderViewSet`
**دسترسی:** فقط SuperAdmin
**Endpoint:** `/api/ai/admin/image-providers/`

#### Actions:
1. ✅ **list()** - لیست همه Providers
2. ✅ **create()** - ایجاد یا آپدیت Provider
3. ✅ **update()** - آپدیت تنظیمات و API key
4. ✅ **get_capabilities()** - دریافت قابلیت‌های هر Provider
5. ✅ **available_providers()** - لیست Providerهای فعال (با permission check)
6. ✅ **openrouter_models()** - لیست مدل‌های OpenRouter (cache 6 ساعته)
7. ✅ **clear_openrouter_cache()** - پاک کردن cache OpenRouter
8. ✅ **activate_provider()** - فعال‌سازی با validation API key
9. ✅ **deactivate_provider()** - غیرفعال‌سازی
10. ✅ **validate_api_key()** - اعتبارسنجی API key
11. ✅ **retrieve()** - جزئیات یک Provider

---

### 2️⃣ **Image Generation ViewSet**
**فایل:** `src/ai/views/image_generation_views.py`
**کلاس:** `AIImageGenerationViewSet`
**دسترسی:** AiManager (با permission check)
**Endpoint:** `/api/ai/admin/images/`

#### Actions:
1. ✅ **generate_image()** - تولید تصویر
   - ✅ با ذخیره در media library
   - ✅ بدون ذخیره (base64)
   - ✅ انتخاب خودکار personal/shared API
   - ✅ Permission check (ai.image.manage)
   - ✅ State Machine برای access control
   - ✅ Track usage

2. ✅ **available_models()** - لیست مدل‌های تولید تصویر موجود

---

### 3️⃣ **Serializers کامل**
**فایل:** `src/ai/serializers/image_generation_serializer.py`

#### Serializers:
1. ✅ **AIProviderSerializer**
   - مدیریت Provider با API key
   - مخفی کردن API key در response (***) 
   - Validation API key هنگام ذخیره
   - غیرفعال کردن خودکار در صورت API key نامعتبر

2. ✅ **AIProviderListSerializer**
   - برای لیست Providers (بدون API key)
   - has_shared_api_key
   - models_count
   - active_models_count

3. ✅ **AIImageGenerationRequestSerializer**
   - برای درخواست تولید تصویر
   - Validation prompt
   - پارامترهای تصویر (size, quality, style, n)
   - گزینه‌های ذخیره (save_to_media, title, alt_text)

---

### 4️⃣ **Integration با سیستم جدید**

#### ✅ استفاده از مدل‌های جدید:
- `AIProvider` بجای `AIImageGeneration`
- `AdminProviderSettings` بجای `AdminAISettings`
- `AIModel` برای مدیریت مدل‌های AI

#### ✅ State Machine:
- `ModelAccessState.calculate()` برای تعیین دسترسی
- `AVAILABLE_SHARED` - دسترسی به shared API
- `AVAILABLE_PERSONAL` - دسترسی به personal API
- `NO_ACCESS` - بدون دسترسی
- `DISABLED` - غیرفعال

#### ✅ Permission System:
- `SuperAdminOnly` - برای Provider Management
- `AiManagerAccess` - برای Image Generation
- `PermissionValidator.has_permission()` - برای check دقیق‌تر

---

### 5️⃣ **Service Layer**
**فایل:** `src/ai/services/image_generation_service.py`

#### ✅ سازگاری با سیستم جدید:
- `generate_image_only()` - با AIProvider کار می‌کنه
- `generate_and_save_to_media()` - با AdminProviderSettings
- انتخاب خودکار personal/shared API
- Track usage روی Provider و AdminProviderSettings

---

### 6️⃣ **URLs**
**فایل:** `src/ai/urls.py`

```python
# Provider Management (SuperAdmin)
/api/ai/admin/image-providers/                     # List
/api/ai/admin/image-providers/<id>/                # Detail
/api/ai/admin/image-providers/<id>/activate/       # Activate
/api/ai/admin/image-providers/<id>/deactivate/     # Deactivate
/api/ai/admin/image-providers/<id>/validate-api-key/  # Validate
/api/ai/admin/image-providers/capabilities/        # Get capabilities
/api/ai/admin/image-providers/available/           # Available providers
/api/ai/admin/image-providers/openrouter-models/   # OpenRouter models
/api/ai/admin/image-providers/clear-openrouter-cache/  # Clear cache

# Image Generation (AiManager)
/api/ai/admin/images/generate/                     # Generate image
/api/ai/admin/images/models/                       # Available models
```

---

## 🔄 مقایسه با کد قدیمی (aa.md):

### ✅ فانکشنالیتی‌های حفظ شده:
1. ✅ تمام 11 action کد قدیمی
2. ✅ Provider Management کامل
3. ✅ انتخاب personal/shared API
4. ✅ OpenRouter models با cache
5. ✅ Validation API key
6. ✅ Permission system دقیق
7. ✅ مخفی کردن API key
8. ✅ Track usage
9. ✅ Error handling با AI_SUCCESS/AI_ERRORS
10. ✅ Save to media library
11. ✅ Generate without save (base64)

### ✅ بهبودها:
1. ✅ استفاده از سیستم dynamic AIProvider
2. ✅ State Machine برای access control
3. ✅ سازگار با populate_ai_providers.py
4. ✅ Integration با Redis cache
5. ✅ بدون نیاز به مدل‌های قدیمی
6. ✅ Scalable برای 40+ مدل

---

## 📦 Database:

### ✅ مدل‌های استفاده شده:
- `AIProvider` (مدیریت Providerها)
- `AIModel` (مدل‌های هر Provider)
- `AdminProviderSettings` (تنظیمات شخصی هر ادمین)

### ✅ اسکریپت Populate:
```bash
# اضافه کردن Providerها و مدل‌ها
python manage.py shell < scripts/populate_ai_providers.py
```

این اسکریپت:
- 7 Provider اضافه می‌کنه (OpenAI, Anthropic, Gemini, OpenRouter, DeepSeek, Groq, HuggingFace)
- ~30 مدل اضافه می‌کنه (با قابلیت‌های chat, image, code, vision, speech)
- مدل DALL-E 3 برای OpenAI
- بدون نیاز به تغییر کد!

---

## 🚀 استفاده:

### 1. Provider Management (فقط SuperAdmin):
```python
# لیست همه Providerها
GET /api/ai/admin/image-providers/

# آپدیت API key
PUT /api/ai/admin/image-providers/1/
{
    "shared_api_key": "sk-xxx",
    "is_active": true
}

# فعال‌سازی (با validation)
POST /api/ai/admin/image-providers/1/activate/

# دریافت مدل‌های OpenRouter
GET /api/ai/admin/image-providers/openrouter-models/
```

### 2. Image Generation (AiManager):
```python
# تولید تصویر و ذخیره
POST /api/ai/admin/images/generate/
{
    "model_id": 5,
    "prompt": "A beautiful landscape",
    "size": "1024x1024",
    "quality": "hd",
    "save_to_media": true,
    "title": "Landscape"
}

# تولید بدون ذخیره (base64)
POST /api/ai/admin/images/generate/
{
    "model_id": 5,
    "prompt": "A cat",
    "save_to_media": false
}

# لیست مدل‌های موجود
GET /api/ai/admin/images/models/
```

---

## ✅ تست:

### 1. مدل‌ها رو اضافه کن:
```bash
cd Backend
python manage.py shell < scripts/populate_ai_providers.py
```

### 2. از پنل ادمین API key اضافه کن:
```python
PUT /api/ai/admin/image-providers/1/
{
    "shared_api_key": "sk-YOUR-OPENAI-KEY"
}
```

### 3. تصویر تولید کن:
```python
POST /api/ai/admin/images/generate/
{
    "model_id": 5,  # DALL-E 3
    "prompt": "A sunset over mountains"
}
```

---

## 🎯 نتیجه:

✅ **سیستم کامل** - همه قابلیت‌های کد قدیمی + سیستم جدید  
✅ **بدون مدل‌های قدیمی** - فقط AIProvider/AdminProviderSettings  
✅ **Scalable** - 40+ مدل بدون تغییر کد  
✅ **Cache** - OpenRouter models با cache 6 ساعته  
✅ **Permission** - دقیق و سطح‌بندی شده  
✅ **Error Handling** - با پیام‌های فارسی  
✅ **Track Usage** - ثبت استفاده از هر Provider و ادمین  

**همه چیز حرفه‌ای و بهینه است! 🚀**
