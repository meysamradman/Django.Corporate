مشکلات فعلی:

Hardcoded Provider Maps: در هر سرویس باید دستی provider اضافه کنید
تکرار کد زیاد: منطق یکسان در 4 سرویس مختلف تکرار شده
عدم استفاده کامل از AIModel: مدل فعال همیشه از DB خونده نمی‌شه
Import مستقیم: همه providerها در همه جا import می‌شن
Capabilities استاتیک: باید دستی تو capabilities.py اضافه کنید



# ✅ Checklist پیاده‌سازی سیستم Dynamic AI

## 📁 فایل‌های جدید (باید اضافه شوند)

### 1. Registry System
```
Backend/src/ai/providers/registry.py
```
- [x] کپی کامل فایل artifact 1
- [ ] تست import شدن

### 2. Unified Service
```
Backend/src/ai/services/unified_service.py
```
- [x] کپی کامل فایل artifact 2
- [ ] تست import شدن

### 3. Management Command
```
Backend/src/ai/management/commands/sync_ai_models.py
```
- [x] کپی کامل فایل artifact 3
- [ ] ایجاد پوشه `management/commands` اگر وجود ندارد
- [ ] اضافه کردن `__init__.py` خالی در هر پوشه

### 4. New Views (Optional)
```
Backend/src/ai/views/generation_views_v2.py
```
- [x] کپی کامل فایل artifact 4
- [ ] تست endpoints

## 📝 فایل‌های موجود (باید ویرایش شوند)

### 1. `src/ai/providers/__init__.py`

```python
# کد فعلی را نگه دارید و این‌ها را اضافه کنید:

from .registry import AIProviderRegistry, get_provider_instance

# Import تمام providerها (برای auto-discovery)
from .base import BaseProvider
from .gemini import GeminiProvider
from .openai import OpenAIProvider
from .huggingface import HuggingFaceProvider
from .deepseek import DeepSeekProvider
from .openrouter import OpenRouterProvider
from .groq import GroqProvider

__all__ = [
    'BaseProvider',
    'AIProviderRegistry',
    'get_provider_instance',
    'GeminiProvider',
    'OpenAIProvider',
    'HuggingFaceProvider',
    'DeepSeekProvider',
    'OpenRouterProvider',
    'GroqProvider',
]
```

**چک‌لیست:**
- [ ] اضافه کردن import registry
- [ ] اضافه کردن import تمام providerها
- [ ] به‌روزرسانی `__all__`

### 2. `src/ai/messages/messages.py`

اضافه کردن پیام‌های خطای جدید:

```python
AI_ERRORS = {
    # ... پیام‌های قبلی ...
    
    # جدید - Model related
    "no_active_model": "No active model found for provider '{provider}' and capability '{capability}'",
    "no_active_model_any_provider": "No active model found for capability '{capability}' in any provider",
    "model_no_capability": "Model does not support capability '{capability}'",
    "operation_not_supported": "Operation '{operation}' is not supported by provider '{provider}'",
    "capability_required": "Capability parameter is required",
    "model_access_denied": "You do not have access to use this model",
    "provider_not_registered": "Provider '{name}' is not registered in the system",
    "models_list_error": "Error retrieving models list: {error}",
}

SETTINGS_ERRORS = {
    # ... پیام‌های قبلی ...
    
    # جدید - Settings related
    "shared_api_not_allowed": "Shared API key is not allowed for normal admins for provider '{provider_name}'",
    "no_api_key_available": "No API key available for provider '{provider_name}'. Please set either personal or shared API key.",
}
```

**چک‌لیست:**
- [ ] اضافه کردن پیام‌های جدید به `AI_ERRORS`
- [ ] اضافه کردن پیام‌های جدید به `SETTINGS_ERRORS`

### 3. `src/ai/urls.py`

```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from src.ai import views
from src.ai.views.generation_views_v2 import UnifiedAIGenerationViewSet

router = DefaultRouter()

# Unified endpoints (جدید - اضافه کنید)
router.register(r'admin/ai', UnifiedAIGenerationViewSet, basename='ai-unified')

# Existing endpoints (قدیمی - می‌توانید نگه دارید)
router.register(r'admin/ai-providers', views.AIProviderViewSet, basename='ai-providers')
router.register(r'admin/ai-models', views.AIModelViewSet, basename='ai-models')
router.register(r'admin/ai-settings', views.AdminProviderSettingsViewSet, basename='ai-settings')

# یا می‌توانید قدیمی‌ها را حذف کنید و فقط unified استفاده کنید

urlpatterns = [
    path('', include(router.urls)),
]
```

**چک‌لیست:**
- [ ] اضافه کردن import `UnifiedAIGenerationViewSet`
- [ ] ثبت viewset جدید در router
- [ ] (اختیاری) حذف viewset های قدیمی

### 4. `src/ai/serializers/*_serializer.py`

برای تمام serializerهای generation، اضافه کردن فیلد `model_id`:

#### Image Generation Serializer
```python
# src/ai/serializers/image_generation_serializer.py

class AIImageGenerationRequestSerializer(serializers.Serializer):
    model_id = serializers.IntegerField(
        required=False,  # اختیاری - اگر نباشد از مدل فعال استفاده می‌شود
        help_text="AI Model ID with 'image' capability"
    )
    # ... بقیه فیلدها
```

#### Content Generation Serializer
```python
# src/ai/serializers/content_generation_serializer.py

class AIContentGenerationRequestSerializer(serializers.Serializer):
    model_id = serializers.IntegerField(
        required=False,
        help_text="AI Model ID with 'content' capability"
    )
    # ... بقیه فیلدها
```

#### Chat Serializer
```python
# src/ai/serializers/chat_serializer.py

class AIChatRequestSerializer(serializers.Serializer):
    model_id = serializers.IntegerField(
        required=False,
        help_text="AI Model ID with 'chat' capability"
    )
    # ... بقیه فیلدها
```

#### Audio Generation Serializer
```python
# src/ai/serializers/audio_generation_serializer.py

class AIAudioGenerationRequestSerializer(serializers.Serializer):
    model_id = serializers.IntegerField(
        required=False,
        help_text="AI Model ID with 'audio' capability"
    )
    # ... بقیه فیلدها
```

**چک‌لیست:**
- [ ] اضافه کردن `model_id` به `AIImageGenerationRequestSerializer`
- [ ] اضافه کردن `model_id` به `AIContentGenerationRequestSerializer`
- [ ] اضافه کردن `model_id` به `AIChatRequestSerializer`
- [ ] اضافه کردن `model_id` به `AIAudioGenerationRequestSerializer`

## 🗄️ تغییرات دیتابیس

### بررسی مدل‌ها (نیاز به migration ندارد)

فایل‌های زیر را بررسی کنید که همه چیز مطابق باشد:

```python
# src/ai/models/ai_provider.py

class AIModelManager(models.Manager):
    def get_active_model(self, provider_slug: str, capability: str):
        """✓ این متد باید وجود داشته باشد"""
        # کد موجود
    
    def deactivate_other_models(self, provider_id: int, capability: str, exclude_id: int = None):
        """✓ این متد باید وجود داشته باشد"""
        # کد موجود

class AIModel(BaseModel):
    objects = AIModelManager()  # ✓ باید این manager استفاده شود
```

**چک‌لیست:**
- [ ] بررسی وجود `AIModelManager`
- [ ] بررسی وجود `get_active_model`
- [ ] بررسی وجود `deactivate_other_models`
- [ ] بررسی استفاده از `AIModelManager` در `AIModel`

## 🔧 مراحل نصب

### مرحله 1: Backup

```bash
# Backup از پروژه
git add .
git commit -m "Backup before Dynamic AI implementation"

# یا Backup دستی
cp -r Backend/src/ai Backend/src/ai.backup
```

**چک‌لیست:**
- [ ] ایجاد backup از فولدر `ai`
- [ ] Commit کردن تغییرات فعلی

### مرحله 2: اضافه کردن فایل‌های جدید

```bash
# ایجاد فایل‌ها
touch Backend/src/ai/providers/registry.py
touch Backend/src/ai/services/unified_service.py
mkdir -p Backend/src/ai/management/commands
touch Backend/src/ai/management/__init__.py
touch Backend/src/ai/management/commands/__init__.py
touch Backend/src/ai/management/commands/sync_ai_models.py
touch Backend/src/ai/views/generation_views_v2.py

# کپی محتوا از artifacts
# (محتوای هر فایل را از artifacts کپی کنید)
```

**چک‌لیست:**
- [ ] ایجاد `registry.py`
- [ ] ایجاد `unified_service.py`
- [ ] ایجاد پوشه‌های `management/commands`
- [ ] اضافه کردن `__init__.py` خالی
- [ ] ایجاد `sync_ai_models.py`
- [ ] ایجاد `generation_views_v2.py`

### مرحله 3: ویرایش فایل‌های موجود

```bash
# باز کردن و ویرایش
nano Backend/src/ai/providers/__init__.py
nano Backend/src/ai/messages/messages.py
nano Backend/src/ai/urls.py
# ... و serializers
```

**چک‌لیست:**
- [ ] ویرایش `providers/__init__.py`
- [ ] ویرایش `messages/messages.py`
- [ ] ویرایش `urls.py`
- [ ] ویرایش serializers

### مرحله 4: تست Import

```bash
python manage.py shell
```

```python
# در Django shell:

# تست Registry
from src.ai.providers.registry import AIProviderRegistry
print(AIProviderRegistry.get_registered_names())
# باید لیست providerها را نشان دهد

# تست UnifiedAIService
from src.ai.services.unified_service import UnifiedAIService
print("UnifiedAIService imported successfully")

# تست Management Command
# خارج از shell:
python manage.py sync_ai_models --help
```

**چک‌لیست:**
- [ ] Import موفق `AIProviderRegistry`
- [ ] لیست providerها نمایش داده می‌شود
- [ ] Import موفق `UnifiedAIService`
- [ ] Command `sync_ai_models` شناسایی می‌شود

### مرحله 5: Sync مدل‌ها

```bash
# Dry run برای تست
python manage.py sync_ai_models --dry-run

# Sync واقعی
python manage.py sync_ai_models --provider openrouter
python manage.py sync_ai_models --provider huggingface
python manage.py sync_ai_models --provider groq
```

**چک‌لیست:**
- [ ] Dry run بدون خطا اجرا می‌شود
- [ ] Sync OpenRouter موفق
- [ ] Sync HuggingFace موفق
- [ ] Sync Groq موفق
- [ ] مدل‌ها در Admin Panel قابل مشاهده هستند

### مرحله 6: فعال‌سازی مدل‌ها

در Django Admin:

1. رفتن به `/admin/ai/aimodel/`
2. انتخاب یک مدل برای هر capability
3. فعال کردن (is_active = True)

**چک‌لیست:**
- [ ] حداقل یک مدل `image` فعال
- [ ] حداقل یک مدل `content` فعال
- [ ] حداقل یک مدل `chat` فعال
- [ ] حداقل یک مدل `audio` فعال (اختیاری)

### مرحله 7: تست Endpoints

```bash
# تست با curl یا Postman

# 1. لیست مدل‌های image
curl -X GET http://localhost:8000/api/admin/ai/image/models \
  -H "Authorization: Bearer YOUR_TOKEN"

# 2. تولید تصویر
curl -X POST http://localhost:8000/api/admin/ai/image/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "a beautiful sunset",
    "size": "1024x1024",
    "save_to_media": false
  }'

# 3. لیست مدل‌های content
curl -X GET http://localhost:8000/api/admin/ai/content/models \
  -H "Authorization: Bearer YOUR_TOKEN"

# 4. تولید محتوا
curl -X POST http://localhost:8000/api/admin/ai/content/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "AI in healthcare",
    "word_count": 500
  }'

# 5. چت
curl -X POST http://localhost:8000/api/admin/ai/chat/send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is AI?"
  }'
```

**چک‌لیست:**
- [ ] Endpoint `/image/models` کار می‌کند
- [ ] Endpoint `/image/generate` کار می‌کند
- [ ] Endpoint `/content/models` کار می‌کند
- [ ] Endpoint `/content/generate` کار می‌کند
- [ ] Endpoint `/chat/models` کار می‌کند
- [ ] Endpoint `/chat/send` کار می‌کند
- [ ] Endpoint `/audio/models` کار می‌کند (اختیاری)
- [ ] Endpoint `/audio/generate` کار می‌کند (اختیاری)

### مرحله 8: تست Access Control

```bash
# تست با کاربر admin معمولی (non-superadmin)
# 1. بدون Personal API Key
# 2. با Personal API Key
# 3. با Shared API Key disabled
```

**چک‌لیست:**
- [ ] SuperAdmin می‌تواند از Shared استفاده کند
- [ ] Normal Admin با Personal API Key می‌تواند استفاده کند
- [ ] Normal Admin بدون Personal و Shared disabled نمی‌تواند استفاده کند
- [ ] Normal Admin با Shared enabled می‌تواند استفاده کند

### مرحله 9: تست در Production (Staging)

```bash
# Deploy در staging environment
# تست تمام functionها
```

**چک‌لیست:**
- [ ] Deploy موفق در staging
- [ ] تمام endpoints کار می‌کنند
- [ ] Performance قابل قبول است
- [ ] Errors به درستی handle می‌شوند
- [ ] Logging درست کار می‌کند

### مرحله 10: Cleanup (اختیاری)

اگر همه چیز کار کرد، سرویس‌های قدیمی را حذف کنید:

```bash
# حذف (یا backup)
# Backend/src/ai/services/image_generation_service.py
# Backend/src/ai/services/content_generation_service.py
# Backend/src/ai/services/chat_service.py
# Backend/src/ai/services/audio_generation_service.py
```

**چک‌لیست:**
- [ ] Backup از سرویس‌های قدیمی
- [ ] حذف سرویس‌های قدیمی (اختیاری)
- [ ] حذف viewهای قدیمی (اختیاری)
- [ ] حذف imports غیرضروری

## 🐛 عیب‌یابی

### مشکل: Provider not found

```python
# بررسی کنید
from src.ai.providers.registry import AIProviderRegistry
print(AIProviderRegistry.get_registered_names())
```

**راه‌حل:**
- مطمئن شوید provider در `__init__.py` import شده
- Restart کنید server

### مشکل: No active model

```bash
# بررسی کنید
python manage.py shell
```

```python
from src.ai.models import AIModel
models = AIModel.objects.filter(is_active=True)
print(models.count())
```

**راه‌حل:**
- در Admin Panel یک مدل را فعال کنید
- یا `sync_ai_models` اجرا کنید

### مشکل: Import Error

```bash
# Check Python path
python manage.py shell
import sys
print('\n'.join(sys.path))
```

**راه‌حل:**
- مطمئن شوید `__init__.py` در همه پوشه‌ها وجود دارد
- Restart کنید server

## 📊 نتیجه نهایی

بعد از اتمام تمام مراحل:

✅ سیستم دینامیک و بدون hardcode  
✅ Providerها خودکار شناسایی می‌شوند  
✅ مدل‌ها از دیتابیس خوانده می‌شوند  
✅ یک سرویس واحد بجای 4 سرویس  
✅ مقیاس‌پذیر تا 100+ مدل  
✅ Performance بهینه با caching  
✅ Access control کامل  
✅ API keys encrypted  

**پروژه شما آماده برای مقیاس‌پذیری است! 🚀**

## 📞 پشتیبانی

اگر در هر مرحله‌ای مشکلی پیش آمد:

1. ✅ مستندات MIGRATION_GUIDE.md را مطالعه کنید
2. ✅ مستندات ARCHITECTURE.md را بررسی کنید
3. ✅ این checklist را دوباره بررسی کنید
4. ✅ از Django shell برای debugging استفاده کنید
5. ✅ Logs را بررسی کنید


# 📚 راهنمای مهاجرت به سیستم Dynamic AI

این راهنما نحوه مهاجرت از سیستم فعلی به سیستم جدید دینامیک را توضیح می‌دهد.

## 🎯 مزایای سیستم جدید

### قبل (Hardcoded):
```python
# هر سرویس باید providerها را دستی import کند
from src.ai.providers import GeminiProvider, OpenAIProvider, DeepSeekProvider

PROVIDER_MAP = {
    'gemini': GeminiProvider,
    'openai': OpenAIProvider,
    'deepseek': DeepSeekProvider,
    # باید دستی اضافه کنید...
}
```

### بعد (Dynamic):
```python
# فقط یک خط!
from src.ai.services.unified_service import UnifiedAIService

# تمام providerها خودکار شناسایی می‌شوند
image = UnifiedAIService.generate_image(prompt="...", admin=request.user)
```

## 📦 نصب و راه‌اندازی

### 1. اضافه کردن فایل‌های جدید

```bash
# فایل‌های جدید را اضافه کنید:
Backend/src/ai/providers/registry.py
Backend/src/ai/services/unified_service.py
Backend/src/ai/management/commands/sync_ai_models.py
Backend/src/ai/views/generation_views_v2.py
```

### 2. به‌روزرسانی `__init__.py` در providers

```python
# Backend/src/ai/providers/__init__.py
from .base import BaseProvider
from .registry import AIProviderRegistry, get_provider_instance

# Import تمام providerها (خودکار ثبت می‌شوند)
from .gemini import GeminiProvider
from .openai import OpenAIProvider
from .huggingface import HuggingFaceProvider
from .deepseek import DeepSeekProvider
from .openrouter import OpenRouterProvider
from .groq import GroqProvider

__all__ = [
    'BaseProvider',
    'AIProviderRegistry',
    'get_provider_instance',
    'GeminiProvider',
    'OpenAIProvider',
    'HuggingFaceProvider',
    'DeepSeekProvider',
    'OpenRouterProvider',
    'GroqProvider',
]
```

### 3. Sync کردن مدل‌ها از API

```bash
# Sync تمام مدل‌ها
python manage.py sync_ai_models

# Sync فقط OpenRouter
python manage.py sync_ai_models --provider openrouter

# Sync فقط مدل‌های image
python manage.py sync_ai_models --capability image

# Dry run (بدون ذخیره)
python manage.py sync_ai_models --dry-run
```

### 4. به‌روزرسانی URLs

```python
# Backend/src/ai/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from src.ai import views
from src.ai.views.generation_views_v2 import UnifiedAIGenerationViewSet

router = DefaultRouter()

# viewهای جدید
router.register(r'admin/ai', UnifiedAIGenerationViewSet, basename='ai-unified')

# viewهای قدیمی (می‌توانند موقتاً باقی بمانند)
router.register(r'admin/ai-providers', views.AIProviderViewSet, basename='ai-providers')
router.register(r'admin/ai-models', views.AIModelViewSet, basename='ai-models')
router.register(r'admin/ai-settings', views.AdminProviderSettingsViewSet, basename='ai-settings')

urlpatterns = [
    path('', include(router.urls)),
]
```

## 🚀 استفاده از سیستم جدید

### 1. تولید تصویر

```python
from src.ai.services.unified_service import UnifiedAIService

# استفاده ساده
image_bytes = UnifiedAIService.generate_image(
    prompt="a beautiful sunset",
    admin=request.user
)

# با مشخص کردن مدل
image_bytes = UnifiedAIService.generate_image(
    prompt="a beautiful sunset",
    admin=request.user,
    model_id=123,  # ID مدل از دیتابیس
    size='1024x1024',
    quality='hd'
)

# با مشخص کردن provider
image_bytes = UnifiedAIService.generate_image(
    prompt="a beautiful sunset",
    admin=request.user,
    provider_slug='openrouter'  # از اولین مدل فعال openrouter استفاده می‌کند
)
```

### 2. تولید محتوا

```python
# استفاده ساده
content = UnifiedAIService.generate_content(
    topic="AI in healthcare",
    admin=request.user
)

# با تنظیمات کامل
content = UnifiedAIService.generate_content(
    topic="AI in healthcare",
    admin=request.user,
    model_id=456,
    word_count=1000,
    tone='professional',
    keywords=['AI', 'healthcare', 'innovation']
)
```

### 3. چت

```python
# چت ساده
reply = UnifiedAIService.chat(
    message="What is AI?",
    admin=request.user
)

# با تاریخچه
reply = UnifiedAIService.chat(
    message="Tell me more",
    admin=request.user,
    conversation_history=[
        {"role": "user", "content": "What is AI?"},
        {"role": "assistant", "content": "AI stands for..."}
    ],
    temperature=0.7,
    max_tokens=2048
)
```

### 4. Text-to-Speech

```python
audio_bytes = UnifiedAIService.text_to_speech(
    text="Hello, this is a test",
    admin=request.user,
    model_id=789,
    voice='alloy',
    speed=1.0
)
```

### 5. دریافت لیست مدل‌ها

```python
# دریافت مدل‌های قابل دسترس برای کاربر
models = UnifiedAIService.get_available_models('image', request.user)

# خروجی:
# [
#     {
#         'id': 1,
#         'name': 'DALL-E 3',
#         'model_id': 'dall-e-3',
#         'provider': {
#             'slug': 'openai',
#             'name': 'OpenAI'
#         },
#         'capabilities': ['image'],
#         'is_active': True,
#         'is_free': False,
#         'access_state': 'available_shared',
#         'pricing': {
#             'input': None,
#             'output': None
#         },
#         'limits': {
#             'max_tokens': None,
#             'context_window': None
#         }
#     },
#     ...
# ]
```

## 🔄 مهاجرت تدریجی

### مرحله 1: نگهداری viewهای قدیمی

```python
# viewهای قدیمی را نگه دارید، فقط از UnifiedAIService استفاده کنید

class AIImageGenerationViewSet(viewsets.ViewSet):
    @action(detail=False, methods=['post'], url_path='generate')
    def generate_image(self, request):
        # قبل:
        # image = AIImageGenerationService.generate_image(...)
        
        # بعد:
        image = UnifiedAIService.generate_image(
            prompt=data['prompt'],
            admin=request.user,
            model_id=data['model_id']
        )
        # بقیه کد بدون تغییر
```

### مرحله 2: حذف سرویس‌های قدیمی

بعد از اطمینان از کارکرد صحیح، می‌توانید حذف کنید:
- `AIImageGenerationService`
- `AIContentGenerationService`
- `AIChatService`
- `AIAudioGenerationService`

### مرحله 3: حذف PROVIDER_MAP

حذف کنید:
- `PROVIDER_CAPABILITIES` در `capabilities.py`
- تمام `PROVIDER_MAP` در سرویس‌ها

## 📋 Checklist مهاجرت

- [ ] اضافه کردن فایل‌های جدید
- [ ] به‌روزرسانی `providers/__init__.py`
- [ ] اجرای `sync_ai_models` برای providerهای دینامیک
- [ ] تست تولید تصویر با `UnifiedAIService`
- [ ] تست تولید محتوا با `UnifiedAIService`
- [ ] تست چت با `UnifiedAIService`
- [ ] تست TTS با `UnifiedAIService`
- [ ] به‌روزرسانی viewها
- [ ] تست کامل پنل ادمین
- [ ] حذف سرویس‌های قدیمی
- [ ] حذف کدهای hardcoded

## 🔥 نکات مهم

### 1. فقط یک مدل فعال

سیستم به صورت خودکار اطمینان می‌دهد که فقط یک مدل برای هر provider+capability فعال باشد:

```python
# در AIModel.save()
if self.is_active:
    for capability in self.capabilities:
        AIModel.objects.deactivate_other_models(
            provider_id=self.provider_id,
            capability=capability,
            exclude_id=self.pk
        )
```

### 2. اولویت API Key

سیستم به صورت خودکار از این اولویت پیروی می‌کند:
1. Personal API Key ادمین
2. Shared API Key (اگر اجازه داشته باشد)
3. Error (اگر هیچکدام موجود نباشد)

### 3. Caching هوشمند

سیستم از cache برای مدل‌های فعال استفاده می‌کند:

```python
# در AIModel.objects.get_active_model
cache_key = f"active_model_{provider_slug}_{capability}"
```

### 4. Auto-Discovery Providerها

Providerها به صورت خودکار در startup شناسایی می‌شوند:

```python
# در providers/registry.py
AIProviderRegistry.auto_discover()
```

## 🧪 تست کردن

### تست دستی

```python
# در Django shell
python manage.py shell

from src.ai.services.unified_service import UnifiedAIService
from django.contrib.auth import get_user_model

User = get_user_model()
admin = User.objects.get(username='admin')

# تست تولید تصویر
image = UnifiedAIService.generate_image(
    prompt="test",
    admin=admin
)
print(f"Image size: {len(image.getvalue())} bytes")

# تست لیست مدل‌ها
models = UnifiedAIService.get_available_models('image', admin)
print(f"Available models: {len(models)}")
```

### تست Providerهای ثبت شده

```python
from src.ai.providers.registry import AIProviderRegistry

# لیست providerها
print(AIProviderRegistry.get_registered_names())
# ['gemini', 'openai', 'openrouter', 'groq', 'huggingface', 'deepseek']

# دریافت یک provider
provider_class = AIProviderRegistry.get('openai')
print(provider_class)
# <class 'src.ai.providers.openai.OpenAIProvider'>
```

## 🆕 اضافه کردن Provider جدید

### 1. ایجاد فایل provider

```python
# Backend/src/ai/providers/newprovider.py
from .base import BaseProvider

class NewProvider(BaseProvider):
    def get_provider_name(self) -> str:
        return 'newprovider'
    
    async def generate_image(self, prompt: str, **kwargs):
        # پیاده‌سازی
        pass
    
    def validate_api_key(self) -> bool:
        # پیاده‌سازی
        pass
```

### 2. Import در `__init__.py`

```python
# Backend/src/ai/providers/__init__.py
from .newprovider import NewProvider

__all__ = [
    # ...
    'NewProvider',
]
```

### 3. تمام! 🎉

Provider به صورت خودکار شناسایی و ثبت می‌شود. نیاز به تغییر هیچ کد دیگری نیست!

## 🐛 عیب‌یابی

### خطا: Provider not found

```python
ValueError: Provider 'newprovider' not found
```

**راه‌حل:**
1. مطمئن شوید provider در `providers/__init__.py` import شده
2. مطمئن شوید نام کلاس به `Provider` ختم می‌شود
3. Restart کنید Django server

### خطا: No active model

```python
ValueError: No active model found for this provider+capability
```

**راه‌حل:**
1. مدل را در پنل ادمین فعال کنید
2. یا با `sync_ai_models` مدل‌ها را sync کنید

### خطا: No API key available

```python
ValueError: API key is not set for provider
```

**راه‌حل:**
1. Shared API key را در پنل ادمین تنظیم کنید
2. یا Personal API key ادمین را تنظیم کنید

## 📊 Performance

سیستم جدید **سریع‌تر** از قبل است چون:

✅ Caching هوشمند مدل‌های فعال  
✅ Database query optimization با `select_related`  
✅ Registry pattern برای providerها (بدون import مکرر)  
✅ Lazy loading مدل‌ها  

## 🎓 نتیجه‌گیری

با استفاده از این سیستم:

✅ **بدون Hardcode**: هیچ نیازی به تغییر کد برای provider جدید نیست  
✅ **مقیاس‌پذیر**: تا 100+ مدل بدون مشکل  
✅ **تمیز**: یک سرویس واحد بجای 4 سرویس جداگانه  
✅ **سریع**: با caching و optimization  
✅ **دینامیک**: مدل‌ها از دیتابیس خوانده می‌شوند  

همه چیز آماده است! 🚀

# 🏗️ معماری سیستم Dynamic AI

## 📊 نمودار کلی

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend/Client                       │
│            (پنل ادمین - لیست دینامیک مدل‌ها)               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ HTTP Request
                     │
┌────────────────────▼────────────────────────────────────────┐
│                  Django Views (ViewSet)                      │
│         generation_views_v2.py - Unified Endpoints          │
│  • POST /api/admin/ai/image/generate                        │
│  • POST /api/admin/ai/content/generate                      │
│  • POST /api/admin/ai/chat/send                             │
│  • POST /api/admin/ai/audio/generate                        │
│  • GET  /api/admin/ai/{capability}/models                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Call Service
                     │
┌────────────────────▼────────────────────────────────────────┐
│              UnifiedAIService (Core Logic)                   │
│                 unified_service.py                           │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ 1. _get_active_model(capability, provider_slug)    │    │
│  │    → Query DB for active model                     │    │
│  │                                                     │    │
│  │ 2. _check_access(model, admin)                     │    │
│  │    → Check ModelAccessState                        │    │
│  │                                                     │    │
│  │ 3. _get_api_key(provider, admin)                   │    │
│  │    → Priority: Personal → Shared                   │    │
│  │                                                     │    │
│  │ 4. _get_provider_instance(model, admin)            │    │
│  │    → Create provider via Registry                  │    │
│  │                                                     │    │
│  │ 5. execute_async(operation, **kwargs)              │    │
│  │    → Call provider method                          │    │
│  │                                                     │    │
│  │ 6. _increment_usage(model, admin)                  │    │
│  │    → Update statistics                             │    │
│  └────────────────────────────────────────────────────┘    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Get Provider Class
                     │
┌────────────────────▼────────────────────────────────────────┐
│            AIProviderRegistry (Singleton)                    │
│                   registry.py                                │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  _providers = {                                       │  │
│  │    'gemini': GeminiProvider,                         │  │
│  │    'openai': OpenAIProvider,                         │  │
│  │    'openrouter': OpenRouterProvider,                 │  │
│  │    'groq': GroqProvider,                             │  │
│  │    'huggingface': HuggingFaceProvider,               │  │
│  │    'deepseek': DeepSeekProvider,                     │  │
│  │    ...                                                │  │
│  │  }                                                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Methods:                                                    │
│  • register(name, provider_class)                           │
│  • get(name) → provider_class                               │
│  • create_instance(name, api_key, config) → instance        │
│  • auto_discover() → find all providers                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Create Instance
                     │
┌────────────────────▼────────────────────────────────────────┐
│                 Provider Classes                             │
│              (BaseProvider children)                         │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Gemini     │  │   OpenAI     │  │ OpenRouter   │     │
│  │  Provider    │  │  Provider    │  │  Provider    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │    Groq      │  │ HuggingFace  │  │  DeepSeek    │     │
│  │  Provider    │  │  Provider    │  │  Provider    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  Each implements:                                            │
│  • generate_image(prompt, **kwargs)                         │
│  • generate_content(prompt, **kwargs)                       │
│  • generate_seo_content(topic, **kwargs)                    │
│  • chat(message, history, **kwargs)                         │
│  • text_to_speech(text, **kwargs)                           │
│  • validate_api_key()                                       │
│  • get_available_models() [for dynamic providers]           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Query & Update
                     │
┌────────────────────▼────────────────────────────────────────┐
│                   Database Models                            │
│                ai_provider.py                                │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              AIProvider                              │   │
│  │  • slug, name, display_name                         │   │
│  │  • shared_api_key (encrypted)                       │   │
│  │  • allow_personal_keys                              │   │
│  │  • allow_shared_for_normal_admins                   │   │
│  │  • is_active                                         │   │
│  └─────────────────────────────────────────────────────┘   │
│                         │                                    │
│                         │ One-to-Many                        │
│                         │                                    │
│  ┌─────────────────────▼─────────────────────────────┐     │
│  │                AIModel                             │     │
│  │  • provider (FK)                                   │     │
│  │  • model_id (e.g., 'gpt-4', 'dall-e-3')           │     │
│  │  • capabilities ['chat', 'image', ...]             │     │
│  │  • is_active (ONLY ONE per provider+capability)    │     │
│  │  • pricing_input, pricing_output                   │     │
│  │  • context_window, max_tokens                      │     │
│  │                                                     │     │
│  │  Manager:                                           │     │
│  │  • get_active_model(provider, capability)          │     │
│  │  • deactivate_other_models(provider, capability)   │     │
│  └─────────────────────────────────────────────────────┘   │
│                         │                                    │
│                         │ Many-to-One                        │
│                         │                                    │
│  ┌─────────────────────▼─────────────────────────────┐     │
│  │          AdminProviderSettings                     │     │
│  │  • admin (FK to User)                              │     │
│  │  • provider (FK)                                   │     │
│  │  • personal_api_key (encrypted)                    │     │
│  │  • use_shared_api                                  │     │
│  │  • monthly_limit, monthly_usage                    │     │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 جریان درخواست

### مثال: تولید تصویر

```
1. کاربر → POST /api/admin/ai/image/generate
   {
     "model_id": 123,
     "prompt": "a sunset",
     "size": "1024x1024"
   }

2. View → UnifiedAIService.generate_image()
   
3. UnifiedAIService:
   a. Query DB: AIModel.objects.get(id=123)
      → model = DALL-E 3 (OpenAI)
   
   b. Check capability: 'image' in model.capabilities
      → ✓
   
   c. Check access: ModelAccessState.calculate()
      → Personal API? → No
      → Shared API? → Yes, allowed
      → State: AVAILABLE_SHARED ✓
   
   d. Get API key:
      → Try personal: None
      → Try shared: "sk-abc123..."
      → Use: Shared ✓
   
   e. Create provider:
      → AIProviderRegistry.get('openai')
      → OpenAIProvider(api_key="sk-abc123...")
   
   f. Execute:
      → await provider.generate_image(prompt="a sunset", size="1024x1024")
      → Returns: BytesIO
   
   g. Update stats:
      → provider.increment_usage()
      → model.increment_usage()
   
4. View → Save to media (if requested)
   
5. Response → Return image URL or base64
```

## 🎯 مزایای معماری

### 1. Single Responsibility Principle (SRP)
هر کلاس یک مسئولیت دارد:
- **Registry**: مدیریت providerها
- **UnifiedAIService**: منطق اصلی و orchestration
- **Provider Classes**: ارتباط با API
- **Models**: ذخیره‌سازی داده

### 2. Open/Closed Principle (OCP)
سیستم برای توسعه باز و برای تغییر بسته است:
- اضافه کردن provider جدید: فقط یک فایل
- تغییر منطق: نیازی به تغییر providerها نیست

### 3. Dependency Inversion (DI)
- View به Service وابسته است، نه Provider
- Service به Registry وابسته است، نه Provider مشخص
- همه به BaseProvider وابسته‌اند، نه پیاده‌سازی خاص

### 4. Don't Repeat Yourself (DRY)
- منطق مشترک یک بار در UnifiedAIService
- بدون تکرار کد در 4 سرویس جداگانه

## 🔐 امنیت

### API Key Management

```
┌──────────────────────────────────────────┐
│     API Key Priority System              │
├──────────────────────────────────────────┤
│                                          │
│  1. Personal API Key (Admin Specific)   │
│     ├─ Encrypted in DB                  │
│     ├─ Admin has full control           │
│     └─ Higher priority                  │
│                                          │
│  2. Shared API Key (Global)             │
│     ├─ Encrypted in DB                  │
│     ├─ Set by SuperAdmin                │
│     ├─ Can be restricted               │
│     └─ Fallback option                  │
│                                          │
└──────────────────────────────────────────┘
```

### Access Control

```python
class ModelAccessState(Enum):
    AVAILABLE_SHARED = "available_shared"      # می‌تواند از Shared استفاده کند
    AVAILABLE_PERSONAL = "available_personal"  # می‌تواند از Personal استفاده کند
    NO_ACCESS = "no_access"                    # دسترسی ندارد
    DISABLED = "disabled"                      # مدل غیرفعال است
```

### Encryption

```python
# EncryptedAPIKeyMixin
api_key_encrypted = encrypt_key(api_key_plain)
# استفاده از Fernet (AES 128)
# Key از SECRET_KEY استخراج می‌شود
```

## 📦 لایه‌بندی

```
┌─────────────────────────────────────────────┐
│        Presentation Layer (Views)            │  ← HTTP handlers
├─────────────────────────────────────────────┤
│      Business Logic Layer (Service)          │  ← UnifiedAIService
├─────────────────────────────────────────────┤
│      Provider Layer (Providers)              │  ← API communication
├─────────────────────────────────────────────┤
│      Data Layer (Models + Cache)             │  ← Database & Redis
└─────────────────────────────────────────────┘
```

## 🚀 Performance Optimizations

### 1. Caching Strategy

```python
# Cache Keys
active_model_{provider_slug}_{capability}  # 5 min
ai_provider_{slug}                         # 5 min
ai_models_by_capability_{capability}       # 5 min
ai_admin_settings_{admin_id}_{provider_id} # 5 min
```

### 2. Database Optimization

```python
# Select Related (تقلیل N+1 queries)
AIModel.objects.select_related('provider').get(id=model_id)

# Composite Indexes
models.Index(fields=['provider', 'is_active', 'sort_order'])
models.Index(fields=['is_active', 'sort_order'])
```

### 3. Registry Pattern

```python
# بجای import مکرر در هر request
from src.ai.providers import GeminiProvider  # ❌

# یک بار در startup
AIProviderRegistry.auto_discover()  # ✓
```

## 🔄 Sync System

### Management Command Flow

```
python manage.py sync_ai_models
         │
         ├─→ Query active providers from DB
         │
         ├─→ For each provider:
         │    │
         │    ├─→ Check if supports dynamic models
         │    │
         │    ├─→ Call provider.get_available_models()
         │    │   (fetches from provider API)
         │    │
         │    ├─→ For each model:
         │    │    │
         │    │    ├─→ Detect capabilities
         │    │    │   (based on name, description)
         │    │    │
         │    │    └─→ Update or create in DB
         │    │
         │    └─→ Return count
         │
         └─→ Display summary
```

## 🎨 Design Patterns

### 1. Singleton (Registry)
```python
class AIProviderRegistry:
    _instance = None
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
```

### 2. Factory (Provider Creation)
```python
AIProviderRegistry.create_instance('openai', api_key, config)
# Returns: OpenAIProvider instance
```

### 3. Strategy (Multiple Providers)
```python
# هر provider استراتژی خودش را پیاده‌سازی می‌کند
provider.generate_image(prompt)
```

### 4. Template Method (BaseProvider)
```python
class BaseProvider(ABC):
    @abstractmethod
    def generate_image(self, prompt: str, **kwargs):
        pass
```

## 📈 Scalability

### افقی (Horizontal)
- Redis برای cache مشترک بین سرورها
- Database replication برای خواندن
- Load balancer برای توزیع بار

### عمودی (Vertical)
- Async/await برای I/O operations
- Connection pooling در providers
- Batch processing برای sync

### مدل‌ها
- تا 100+ مدل در DB
- Registry نامحدود
- Cache efficient

## 🧪 Testing Strategy

### Unit Tests
```python
# Test Registry
def test_provider_registration()
def test_auto_discovery()

# Test Service
def test_get_active_model()
def test_api_key_priority()
def test_access_check()

# Test Providers
def test_generate_image()
def test_validate_api_key()
```

### Integration Tests
```python
# Test End-to-End
def test_image_generation_flow()
def test_model_sync()
def test_access_control()
```

## 🎓 خلاصه

معماری جدید:

✅ **Modular**: هر بخش مستقل است  
✅ **Scalable**: تا 100+ مدل و provider  
✅ **Maintainable**: کد تمیز و خوانا  
✅ **Dynamic**: بدون hardcode  
✅ **Secure**: encryption + access control  
✅ **Fast**: caching + optimization  
✅ **Extensible**: اضافه کردن آسان  

این معماری تمام نیازهای سناریو را برآورده می‌کند! 🚀

# 🤖 سیستم Dynamic AI - Django Backend

سیستم مدیریت دینامیک و مقیاس‌پذیر برای تمام عملیات AI در پروژه.

## ✨ ویژگی‌ها

- 🔥 **دینامیک 100%**: بدون نیاز به hardcode برای provider یا مدل جدید
- ⚡ **سریع**: با caching هوشمند و optimization
- 🎯 **یک سرویس واحد**: بجای 4+ سرویس جداگانه
- 🔒 **امن**: Encryption API keys + Access control
- 📊 **مقیاس‌پذیر**: تا 100+ مدل و provider
- 🚀 **Auto-discovery**: Providerها خودکار شناسایی می‌شوند
- 🔄 **Auto-sync**: مدل‌های دینامیک خودکار sync می‌شوند

## 🎯 قابلیت‌ها

### تولید تصویر (Image Generation)
```python
image = UnifiedAIService.generate_image(
    prompt="a beautiful sunset",
    admin=request.user
)
```

### تولید محتوا (Content Generation)
```python
content = UnifiedAIService.generate_content(
    topic="AI in healthcare",
    admin=request.user,
    word_count=1000
)
```

### چت (Chat)
```python
reply = UnifiedAIService.chat(
    message="What is AI?",
    admin=request.user
)
```

### متن به گفتار (Text-to-Speech)
```python
audio = UnifiedAIService.text_to_speech(
    text="Hello world",
    admin=request.user
)
```

## 🚀 نصب و راه‌اندازی

### 1. کپی فایل‌های جدید

```bash
# فایل‌های اصلی
Backend/src/ai/providers/registry.py
Backend/src/ai/services/unified_service.py
Backend/src/ai/management/commands/sync_ai_models.py
Backend/src/ai/views/generation_views_v2.py
```

### 2. به‌روزرسانی `providers/__init__.py`

```python
from .registry import AIProviderRegistry, get_provider_instance

# Import تمام providerها
from .gemini import GeminiProvider
from .openai import OpenAIProvider
from .huggingface import HuggingFaceProvider
from .deepseek import DeepSeekProvider
from .openrouter import OpenRouterProvider
from .groq import GroqProvider

__all__ = [
    'AIProviderRegistry',
    'get_provider_instance',
    # ... دیگر providerها
]
```

### 3. Sync کردن مدل‌ها

```bash
# Sync تمام providerهای دینامیک (OpenRouter, HuggingFace, Groq)
python manage.py sync_ai_models

# یا فقط یک provider
python manage.py sync_ai_models --provider openrouter
```

### 4. به‌روزرسانی URLs

```python
# src/ai/urls.py
from src.ai.views.generation_views_v2 import UnifiedAIGenerationViewSet

router = DefaultRouter()
router.register(r'admin/ai', UnifiedAIGenerationViewSet, basename='ai-unified')
```

## 📝 استفاده سریع

### در View

```python
from src.ai.services.unified_service import UnifiedAIService

class MyView(APIView):
    def post(self, request):
        # تولید تصویر
        image = UnifiedAIService.generate_image(
            prompt=request.data['prompt'],
            admin=request.user,
            size='1024x1024'
        )
        
        # ذخیره و بازگشت
        return Response({'image': image})
```

### در Service/Helper

```python
from src.ai.services.unified_service import UnifiedAIService

def generate_blog_content(topic, admin):
    """تولید محتوای وبلاگ"""
    content = UnifiedAIService.generate_content(
        topic=topic,
        admin=admin,
        word_count=1000,
        tone='professional',
        keywords=['SEO', 'blog']
    )
    return content
```

### دریافت مدل‌های قابل دسترس

```python
# دریافت لیست مدل‌های فعال برای کاربر
models = UnifiedAIService.get_available_models('image', request.user)

# خروجی:
[
    {
        'id': 1,
        'name': 'DALL-E 3',
        'provider': {'slug': 'openai', 'name': 'OpenAI'},
        'access_state': 'available_shared',
        'is_free': False,
        ...
    }
]
```

## 🔑 مدیریت API Keys

### دو نوع API Key

```
Priority:
1. Personal API Key (ادمین)  ← بالاترین اولویت
2. Shared API Key (سوپرادمین)  ← fallback
```

### تنظیم Shared API Key

```python
# در پنل ادمین یا Django Admin
provider = AIProvider.objects.get(slug='openai')
provider.shared_api_key = "sk-abc123..."  # خودکار encrypt می‌شود
provider.save()
```

### تنظیم Personal API Key

```python
# توسط هر ادمین
settings = AdminProviderSettings.objects.create(
    admin=request.user,
    provider=provider,
    personal_api_key="sk-xyz789..."  # خودکار encrypt می‌شود
)
```

## 📦 ساختار فایل‌ها

```
Backend/src/ai/
├── providers/
│   ├── __init__.py          # Import تمام providerها
│   ├── registry.py          # ⭐ جدید: Auto-discovery و مدیریت
│   ├── base.py              # کلاس پایه
│   ├── gemini.py
│   ├── openai.py
│   ├── openrouter.py
│   ├── groq.py
│   ├── huggingface.py
│   └── deepseek.py
│
├── services/
│   ├── unified_service.py   # ⭐ جدید: سرویس واحد
│   ├── image_generation_service.py  # قدیمی - می‌توان حذف کرد
│   ├── content_generation_service.py  # قدیمی - می‌توان حذف کرد
│   ├── chat_service.py      # قدیمی - می‌توان حذف کرد
│   └── audio_generation_service.py  # قدیمی - می‌توان حذف کرد
│
├── views/
│   ├── generation_views_v2.py  # ⭐ جدید: Unified views
│   ├── ai_provider_views.py
│   └── ... (دیگر viewها)
│
├── management/
│   └── commands/
│       └── sync_ai_models.py  # ⭐ جدید: Sync command
│
└── models/
    └── ai_provider.py       # مدل‌های دیتابیس
```

## 🎯 تفاوت با سیستم قبلی

### قبل ❌

```python
# باید در هر سرویس providerها را import کنید
from src.ai.providers import GeminiProvider, OpenAIProvider, DeepSeekProvider

class AIImageGenerationService:
    PROVIDER_MAP = {
        'gemini': GeminiProvider,
        'openai': OpenAIProvider,
        'deepseek': DeepSeekProvider,
        # برای provider جدید باید دستی اضافه کنید
    }
    
    @classmethod
    def generate_image(cls, provider_name, ...):
        provider_class = cls.PROVIDER_MAP.get(provider_name)  # Hardcoded
        # ...

# همین کد در 4 سرویس دیگر هم تکرار می‌شد!
```

### بعد ✅

```python
# فقط یک سرویس
from src.ai.services.unified_service import UnifiedAIService

# همه چیز دینامیک
image = UnifiedAIService.generate_image(prompt="...", admin=user)
content = UnifiedAIService.generate_content(topic="...", admin=user)
reply = UnifiedAIService.chat(message="...", admin=user)
audio = UnifiedAIService.text_to_speech(text="...", admin=user)

# هیچ hardcode ای نیست!
# Provider جدید؟ فقط یک فایل اضافه کنید!
```

## 🆕 اضافه کردن Provider جدید

### فقط 2 مرحله!

#### 1. ایجاد فایل provider

```python
# src/ai/providers/newprovider.py
from .base import BaseProvider

class NewProvider(BaseProvider):
    def get_provider_name(self) -> str:
        return 'newprovider'
    
    async def generate_image(self, prompt: str, **kwargs):
        # پیاده‌سازی شما
        pass
    
    # ... دیگر متدها
```

#### 2. Import در `__init__.py`

```python
# src/ai/providers/__init__.py
from .newprovider import NewProvider

__all__ = [
    # ...
    'NewProvider',
]
```

### تمام! 🎉

Provider شما:
- ✅ خودکار در Registry ثبت می‌شود
- ✅ در API endpoint ها ظاهر می‌شود
- ✅ قابل استفاده توسط UnifiedAIService است
- ✅ نیاز به تغییر کد دیگری نیست!

## 🔧 Management Commands

### Sync مدل‌های دینامیک

```bash
# Sync همه
python manage.py sync_ai_models

# Sync یک provider
python manage.py sync_ai_models --provider openrouter

# Sync یک capability
python manage.py sync_ai_models --capability image

# Dry run (بدون تغییر)
python manage.py sync_ai_models --dry-run
```

## 📊 Endpoints جدید

### تولید تصویر
```
POST /api/admin/ai/image/generate
GET  /api/admin/ai/image/models
```

### تولید محتوا
```
POST /api/admin/ai/content/generate
GET  /api/admin/ai/content/models
```

### چت
```
POST /api/admin/ai/chat/send
GET  /api/admin/ai/chat/models
```

### تولید صدا
```
POST /api/admin/ai/audio/generate
GET  /api/admin/ai/audio/models
```

### عمومی
```
GET  /api/admin/ai/providers?capability=image
```

## ⚙️ تنظیمات

### Cache TTL

```python
# src/core/cache/namespaces.py
class CacheTTL:
    SESSION_ADMIN = 3 * 24 * 60 * 60  # 3 روز
    SESSION_USER = 30 * 24 * 60 * 60  # 30 روز
    PERMISSIONS = 5 * 60               # 5 دقیقه
    PROFILE = 15 * 60                  # 15 دقیقه
    DEFAULT = 15 * 60                  # 15 دقیقه
```

### Provider Config

```python
# در دیتابیس AIProvider.config (JSONField)
{
    "chat_model": "gpt-4",
    "image_model": "dall-e-3",
    "tts": {
        "model": "tts-1-hd",
        "voice": "alloy",
        "speed": 1.0
    }
}
```

## 🐛 رفع مشکلات رایج

### Provider یافت نشد
```
ValueError: Provider 'xxx' not found
```
**راه‌حل**: مطمئن شوید provider در `__init__.py` import شده و server restart شده.

### مدل فعالی وجود ندارد
```
ValueError: No active model found
```
**راه‌حل**: در پنل ادمین یک مدل را فعال کنید یا `sync_ai_models` را اجرا کنید.

### API key موجود نیست
```
ValueError: No API key available
```
**راه‌حل**: Shared یا Personal API key را تنظیم کنید.

## 📚 مستندات کامل

- [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) - راهنمای مهاجرت گام به گام
- [ARCHITECTURE.md](ARCHITECTURE.md) - معماری و نمودارها
- [API_DOCS.md](API_DOCS.md) - مستندات API (در صورت نیاز)

## 🎓 مثال‌های کاربردی

### 1. تولید thumbnail برای وبلاگ

```python
def generate_blog_thumbnail(blog_title, admin):
    prompt = f"Professional blog thumbnail for: {blog_title}"
    
    image = UnifiedAIService.generate_image(
        prompt=prompt,
        admin=admin,
        size='1200x630',  # بهینه برای social media
        quality='hd'
    )
    
    # ذخیره و استفاده
    return save_to_media(image, title=f"Thumbnail: {blog_title}")
```

### 2. تولید محتوای SEO

```python
def generate_seo_article(topic, admin):
    content = UnifiedAIService.generate_content(
        topic=topic,
        admin=admin,
        word_count=1500,
        tone='professional',
        keywords=['SEO', 'marketing', topic]
    )
    
    # content شامل: title, meta_title, meta_description, content, keywords, slug
    return content
```

### 3. چت‌بات پشتیبانی

```python
def support_chatbot(message, history, admin):
    system_message = "You are a helpful customer support assistant."
    
    reply = UnifiedAIService.chat(
        message=message,
        admin=admin,
        conversation_history=history,
        system_message=system_message,
        temperature=0.7
    )
    
    return reply
```

## 🚀 Performance

### Benchmark (تقریبی)

- **تولید تصویر**: 3-10 ثانیه (بستگی به provider)
- **تولید محتوا**: 2-5 ثانیه
- **چت**: 1-3 ثانیه
- **TTS**: 1-2 ثانیه

### Optimization Tips

1. ✅ استفاده از cache برای مدل‌های فعال
2. ✅ Select related برای کاهش queries
3. ✅ Async/await برای عملیات I/O
4. ✅ Connection pooling در providerها

## 🤝 مشارکت

برای افزودن provider جدید یا بهبود سیستم:

1. Fork کنید
2. Branch جدید بسازید (`git checkout -b feature/NewProvider`)
3. تغییرات را commit کنید
4. Push کنید (`git push origin feature/NewProvider`)
5. Pull Request ایجاد کنید

## 📄 لایسنس

[نوع لایسنس پروژه]

## ✉️ پشتیبانی

برای سوالات یا مشکلات:
- GitHub Issues
- Email: [your-email]
- Documentation: [لینک]

---

**ساخته شده با ❤️ برای پروژه‌های بزرگ و مقیاس‌پذیر**






1️⃣ AIProviderRegistry (registry.py)

✨ Auto-Discovery: providerها را خودکار پیدا و ثبت می‌کند
✨ Singleton Pattern: فقط یک instance در کل برنامه
✨ Zero Config: نیازی به تنظیم اضافی نیست

2️⃣ UnifiedAIService (unified_service.py)

🎯 یک سرویس برای همه: تصویر، محتوا، چت، صدا
🔑 اولویت API Key: Personal → Shared → Error
🔒 Access Control: کامل و خودکار
⚡ سریع: با caching و optimization

3️⃣ Sync Command (sync_ai_models.py)
bashpython manage.py sync_ai_models

🔄 مدل‌های دینامیک را از API می‌خواند
💾 در دیتابیس ذخیره می‌کند
🎯 Capability detection خودکار

4️⃣ Unified Views (generation_views_v2.py)

📡 Endpoint های تمیز و RESTful
🎨 دینامیک برای همه providerها
📊 لیست مدل‌های قابل دسترس

5️⃣ MIGRATION_GUIDE.md

📚 راهنمای گام به گام مهاجرت
💡 مثال‌های کاربردی
🐛 راه‌حل مشکلات رایج

6️⃣ ARCHITECTURE.md

🏗️ نمودارهای کامل معماری
🔄 جریان درخواست
📊 Design Patterns

7️⃣ README + IMPLEMENTATION.md

🚀 شروع سریع
✅ Checklist کامل پیاده‌سازی
📋 هر مرحله با جزئیات

🎯 مزایای کلیدی:
برای Developer:
python# قبل ❌ (Hardcoded)
PROVIDER_MAP = {
    'gemini': GeminiProvider,
    'openai': OpenAIProvider,
    # باید دستی اضافه کنید...
}

# بعد ✅ (Dynamic)
UnifiedAIService.generate_image(prompt="...", admin=user)
# همه چیز خودکار!

برای پروژه:

✅ مقیاس‌پذیر: تا 100+ مدل بدون مشکل
✅ سریع: با caching هوشمند
✅ تمیز: یک سرویس واحد
✅ دینامیک: مدل‌ها از DB خوانده می‌شوند
✅ امن: encryption + access control

اضافه کردن Provider جدید:
python# فقط 1 فایل!
# src/ai/providers/newprovider.py
class NewProvider(BaseProvider):
    # پیاده‌سازی...

# تمام! هیچ کد دیگری نیاز نیست! 🎉
📦 نحوه استفاده:
1. کپی فایل‌ها:

registry.py → Backend/src/ai/providers/
unified_service.py → Backend/src/ai/services/
sync_ai_models.py → Backend/src/ai/management/commands/
generation_views_v2.py → Backend/src/ai/views/

2. ویرایش فایل‌های موجود:

providers/__init__.py - اضافه کردن registry
messages/messages.py - اضافه کردن پیام‌های جدید
urls.py - ثبت viewset جدید

