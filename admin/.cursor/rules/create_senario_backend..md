📌 درک صحیح از سناریو:
✅ چیزهایی که باید باشه:

لیست مدل‌ها از API بخونیم (بدون ذخیره در DB)
مدل انتخاب شده در DB ذخیره بشه (فقط یکی برای هر capability)
Dynamic - provider جدید خودکار اضافه بشه
بدون import دستی - از Registry استفاده کنیم
سرعت - cache کنیم


🎯 ساختار صحیح:
1️⃣ جدول AIModel (فقط مدل‌های انتخاب شده)
python# Backend/src/ai/models/ai_provider.py

class AIModel(BaseModel):
    """
    فقط مدل‌های انتخاب شده در این جدول ذخیره می‌شن
    مثلاً: فقط 5-10 رکورد (یکی برای هر capability)
    """
    provider = models.ForeignKey(AIProvider, on_delete=models.CASCADE)
    model_id = models.CharField(max_length=200)  # "google/gemini-2.0-flash"
    display_name = models.CharField(max_length=200)
    capabilities = models.JSONField(default=list)  # ["chat"]
    is_active = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ['provider', 'model_id']
    
    def save(self, *args, **kwargs):
        """فقط یک مدل فعال برای هر provider+capability"""
        if self.is_active:
            for capability in self.capabilities:
                # غیرفعال کردن مدل‌های قبلی
                AIModel.objects.filter(
                    provider=self.provider,
                    capabilities__contains=capability,
                    is_active=True
                ).exclude(pk=self.pk).update(is_active=False)
        
        super().save(*args, **kwargs)

2️⃣ Registry Pattern (Auto-discovery)
python# Backend/src/ai/providers/registry.py

from typing import Dict, Type, Optional, List
from .base import BaseProvider

class AIProviderRegistry:
    """
    ⭐ تمام providerها رو خودکار پیدا می‌کنه
    ⭐ بدون نیاز به import دستی در Viewها
    """
    
    _instance = None
    _providers: Dict[str, Type[BaseProvider]] = {}
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if not hasattr(self, '_initialized'):
            self._initialized = True
            self._auto_discover()
    
    def _auto_discover(self):
        """کشف خودکار providerها"""
        # این import فقط یک بار در اینجا انجام میشه
        from .gemini import GeminiProvider
        from .openai import OpenAIProvider
        from .openrouter import OpenRouterProvider
        from .groq import GroqProvider
        from .huggingface import HuggingFaceProvider
        from .deepseek import DeepSeekProvider
        
        # ثبت providerها
        self._providers = {
            'gemini': GeminiProvider,
            'openai': OpenAIProvider,
            'openrouter': OpenRouterProvider,
            'groq': GroqProvider,
            'huggingface': HuggingFaceProvider,
            'deepseek': DeepSeekProvider,
        }
    
    def get_provider_class(self, slug: str) -> Optional[Type[BaseProvider]]:
        """دریافت کلاس provider"""
        return self._providers.get(slug)
    
    def get_all_providers(self) -> Dict[str, Type[BaseProvider]]:
        """لیست تمام providerها"""
        return self._providers.copy()
    
    def create_instance(self, slug: str, api_key: str, 
                       config: dict = None) -> BaseProvider:
        """ایجاد instance از provider"""
        provider_class = self.get_provider_class(slug)
        if not provider_class:
            raise ValueError(f"Provider '{slug}' not found")
        
        return provider_class(api_key=api_key, config=config or {})
    
    @staticmethod
    def get_available_models(slug: str, api_key: str, 
                            capability: str = None) -> List[dict]:
        """
        ⭐ دریافت لیست مدل‌ها از API (بدون ذخیره در DB)
        این مدل‌ها cache میشن برای سرعت
        """
        from django.core.cache import cache
        
        # کش برای سرعت
        cache_key = f"available_models_{slug}_{capability}"
        cached = cache.get(cache_key)
        if cached:
            return cached
        
        # دریافت کلاس provider
        registry = AIProviderRegistry()
        provider_class = registry.get_provider_class(slug)
        
        if not provider_class or not hasattr(provider_class, 'get_available_models'):
            return []
        
        # دریافت از API
        try:
            models = provider_class.get_available_models(
                api_key=api_key,
                use_cache=True
            )
            
            # فیلتر بر اساس capability
            if capability:
                models = [m for m in models 
                         if registry._supports_capability(m, capability, slug)]
            
            # کش کردن (6 ساعت)
            cache.set(cache_key, models, 6 * 60 * 60)
            return models
            
        except Exception:
            return []
    
    @staticmethod
    def _supports_capability(model: dict, capability: str, provider_slug: str) -> bool:
        """بررسی اینکه مدل از capability پشتیبانی می‌کنه"""
        model_id = model.get('id', '').lower()
        
        # هر provider شیوه خاص خودش رو داره
        if provider_slug == 'huggingface':
            task = model.get('task', '').lower()
            capability_map = {
                'chat': ['text-generation'],
                'content': ['text-generation'],
                'image': ['text-to-image', 'image-to-image'],
                'audio': ['text-to-speech', 'automatic-speech-recognition']
            }
            return task in capability_map.get(capability, [])
        
        # برای بقیه، از نام مدل استفاده می‌کنیم
        capability_keywords = {
            'image': ['dall-e', 'stable-diffusion', 'flux', 'midjourney', 'imagen'],
            'audio': ['tts', 'whisper', 'text-to-speech'],
            'chat': ['gpt', 'llama', 'gemini', 'claude', 'mistral'],
            'content': ['gpt', 'llama', 'gemini', 'claude', 'mistral']
        }
        
        keywords = capability_keywords.get(capability, [])
        return any(kw in model_id for kw in keywords)

# ⭐ Initialize تنها یک بار
_registry = AIProviderRegistry()

3️⃣ View برای پنل ادمین
python# Backend/src/ai/views/ai_model_management_views.py

from rest_framework import viewsets, status
from rest_framework.decorators import action
from django.core.cache import cache

from src.ai.providers.registry import AIProviderRegistry
from src.ai.models import AIProvider, AIModel

class AIModelManagementViewSet(viewsets.ViewSet):
    """
    ⭐ مدیریت مدل‌ها در پنل ادمین
    
    این ViewSet:
    1. لیست مدل‌ها رو real-time از API میگیره
    2. مدل انتخاب شده رو در DB ذخیره می‌کنه
    3. فقط یک مدل فعال برای هر capability
    """
    
    @action(detail=False, methods=['get'], url_path='browse-models')
    def browse_models(self, request):
        """
        📋 دریافت لیست مدل‌های available از API
        
        Query Params:
        - provider: openrouter, huggingface, groq (required)
        - capability: chat, image, content, audio (required)
        
        Response:
        {
            "provider": "openrouter",
            "capability": "chat",
            "models": [
                {
                    "id": "google/gemini-2.0-flash",
                    "name": "Gemini 2.0 Flash",
                    "pricing": {...}
                },
                ...
            ],
            "total": 400,
            "selected_model": "google/gemini-2.0-flash"  # مدل فعلی
        }
        """
        provider_slug = request.query_params.get('provider')
        capability = request.query_params.get('capability')
        
        if not provider_slug or not capability:
            return APIResponse.error(
                message="Both 'provider' and 'capability' are required",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # 1. چک کردن provider
            provider = AIProvider.objects.get(slug=provider_slug, is_active=True)
            
            # 2. دریافت API key
            api_key = provider.get_shared_api_key()
            if not api_key:
                return APIResponse.error(
                    message=f"No API key configured for {provider_slug}",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            # 3. دریافت لیست مدل‌ها از API (با cache)
            registry = AIProviderRegistry()
            models = registry.get_available_models(
                slug=provider_slug,
                api_key=api_key,
                capability=capability
            )
            
            # 4. پیدا کردن مدل انتخاب شده فعلی
            selected_model = None
            try:
                active_model = AIModel.objects.get(
                    provider=provider,
                    capabilities__contains=capability,
                    is_active=True
                )
                selected_model = active_model.model_id
            except AIModel.DoesNotExist:
                pass
            
            return APIResponse.success(
                message=f"Found {len(models)} models for {provider_slug}/{capability}",
                data={
                    'provider': provider_slug,
                    'provider_name': provider.display_name,
                    'capability': capability,
                    'models': models,
                    'total': len(models),
                    'selected_model': selected_model
                }
            )
            
        except AIProvider.DoesNotExist:
            return APIResponse.error(
                message=f"Provider '{provider_slug}' not found or inactive",
                status_code=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return APIResponse.error(
                message=f"Error fetching models: {str(e)}",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'], url_path='select-model')
    def select_model(self, request):
        """
        ✅ انتخاب مدل و ذخیره در DB
        
        Body:
        {
            "provider": "openrouter",
            "capability": "chat",
            "model_id": "google/gemini-2.0-flash",
            "model_name": "Gemini 2.0 Flash"
        }
        
        این endpoint:
        1. مدل قبلی رو غیرفعال می‌کنه
        2. مدل جدید رو ذخیره می‌کنه (فقط یکی!)
        3. کش رو پاک می‌کنه
        """
        provider_slug = request.data.get('provider')
        capability = request.data.get('capability')
        model_id = request.data.get('model_id')
        model_name = request.data.get('model_name')
        
        if not all([provider_slug, capability, model_id, model_name]):
            return APIResponse.error(
                message="All fields are required: provider, capability, model_id, model_name",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            provider = AIProvider.objects.get(slug=provider_slug, is_active=True)
            
            # ⚠️ مهم: فقط یک مدل فعال برای هر capability
            # مدل‌های قبلی خودکار غیرفعال میشن (در save())
            model, created = AIModel.objects.update_or_create(
                provider=provider,
                model_id=model_id,
                defaults={
                    'name': model_name,
                    'display_name': model_name,
                    'capabilities': [capability],
                    'is_active': True,
                }
            )
            
            # پاک کردن کش
            from src.ai.utils.cache import AICacheManager
            AICacheManager.invalidate_models()
            cache.delete(f"active_model_{provider_slug}_{capability}")
            
            return APIResponse.success(
                message=f"Model selected successfully",
                data={
                    'id': model.id,
                    'model_id': model.model_id,
                    'name': model.display_name,
                    'capability': capability,
                    'provider': provider_slug,
                    'is_active': model.is_active,
                    'created': created
                }
            )
            
        except AIProvider.DoesNotExist:
            return APIResponse.error(
                message=f"Provider '{provider_slug}' not found",
                status_code=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return APIResponse.error(
                message=f"Error selecting model: {str(e)}",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'], url_path='selected-models')
    def get_selected_models(self, request):
        """
        📌 لیست مدل‌های انتخاب شده (در DB)
        
        این فقط مدل‌هایی که ادمین انتخاب کرده رو برمیگردونه
        مثلاً: 5-10 مدل (یکی برای هر capability)
        """
        provider_slug = request.query_params.get('provider')
        capability = request.query_params.get('capability')
        
        queryset = AIModel.objects.filter(
            is_active=True,
            provider__is_active=True
        ).select_related('provider')
        
        if provider_slug:
            queryset = queryset.filter(provider__slug=provider_slug)
        
        if capability:
            queryset = queryset.filter(capabilities__contains=capability)
        
        from src.ai.serializers.ai_provider_serializer import AIModelListSerializer
        serializer = AIModelListSerializer(queryset, many=True)
        
        return APIResponse.success(
            message="Selected models retrieved",
            data=serializer.data
        )
    
    @action(detail=False, methods=['get'], url_path='providers')
    def get_providers(self, request):
        """
        🏢 لیست providerهای available
        
        این لیست dynamic هست - اگه provider جدید اضافه بشه،
        خودکار نمایش داده میشه
        """
        capability = request.query_params.get('capability')
        
        # دریافت از Registry (dynamic!)
        registry = AIProviderRegistry()
        all_providers = registry.get_all_providers()
        
        # فیلتر بر اساس DB
        db_providers = AIProvider.objects.filter(is_active=True)
        
        result = []
        for slug, provider_class in all_providers.items():
            try:
                db_provider = db_providers.get(slug=slug)
                
                # چک کردن capability
                if capability:
                    # بررسی اینکه provider این capability رو داره
                    from src.ai.providers.capabilities import supports_feature
                    if not supports_feature(slug, capability):
                        continue
                
                result.append({
                    'slug': slug,
                    'name': db_provider.display_name,
                    'has_api_key': bool(db_provider.shared_api_key),
                    'is_active': db_provider.is_active
                })
            except AIProvider.DoesNotExist:
                continue
        
        return APIResponse.success(
            message=f"Found {len(result)} providers",
            data=result
        )

4️⃣ استفاده در Chat View (مثال)
python# Backend/src/ai/views/chat_views.py

from src.ai.providers.registry import AIProviderRegistry

class AIChatViewSet(viewsets.ViewSet):
    
    @action(detail=False, methods=['post'], url_path='send-message')
    def send_message(self, request):
        """
        💬 ارسال پیام چت
        
        از مدل انتخاب شده برای chat استفاده می‌کنه
        """
        message = request.data.get('message')
        
        try:
            # 1. پیدا کردن مدل فعال برای chat
            active_model = AIModel.objects.select_related('provider').get(
                capabilities__contains='chat',
                is_active=True,
                provider__is_active=True
            )
            
            # 2. دریافت API key
            provider = active_model.provider
            settings = AdminProviderSettings.objects.filter(
                admin=request.user,
                provider=provider,
                is_active=True
            ).first()
            
            if settings and settings.personal_api_key:
                api_key = settings.get_personal_api_key()
            else:
                api_key = provider.get_shared_api_key()
            
            # 3. ایجاد instance از provider (بدون import دستی!)
            registry = AIProviderRegistry()
            provider_instance = registry.create_instance(
                slug=provider.slug,
                api_key=api_key,
                config={'model': active_model.model_id}
            )
            
            # 4. استفاده از provider
            loop = asyncio.get_event_loop()
            reply = loop.run_until_complete(
                provider_instance.chat(
                    message=message,
                    conversation_history=[]
                )
            )
            
            return APIResponse.success(
                message="Message sent successfully",
                data={
                    'message': message,
                    'reply': reply,
                    'model': active_model.display_name,
                    'provider': provider.display_name
                }
            )
            
        except AIModel.DoesNotExist:
            return APIResponse.error(
                message="No active chat model found. Please select a model first.",
                status_code=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return APIResponse.error(
                message=f"Chat error: {str(e)}",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
```

---

## 📁 **ساختار فایل‌ها:**
```
Backend/src/ai/
├── models/
│   └── ai_provider.py          ✅ AIProvider + AIModel
│
├── providers/
│   ├── base.py                 ✅ BaseProvider
│   ├── registry.py             ⭐ NEW - Auto-discovery
│   ├── gemini.py               ✅ Existing
│   ├── openai.py               ✅ Existing
│   ├── openrouter.py           ✅ Existing
│   ├── groq.py                 ✅ Existing
│   ├── huggingface.py          ✅ Existing
│   └── deepseek.py             ✅ Existing
│
├── views/
│   ├── ai_model_management_views.py  ⭐ NEW - Browse & Select
│   ├── chat_views.py           🔄 Update - Use Registry
│   ├── content_generation_views.py   🔄 Update - Use Registry
│   ├── image_generation_views.py     🔄 Update - Use Registry
│   └── audio_generation_views.py     🔄 Update - Use Registry
│
└── urls.py                     🔄 Update routes

🔗 APIهای پنل ادمین:
bash# 1️⃣ لیست providerهای موجود
GET /api/admin/ai-model-management/providers/?capability=chat
→ { data: [{slug: "openrouter", name: "OpenRouter", ...}] }

# 2️⃣ لیست مدل‌های یک provider (از API - بدون DB!)
GET /api/admin/ai-model-management/browse-models/?provider=openrouter&capability=chat
→ { models: [400 models...], selected_model: "google/gemini-2.0-flash" }

# 3️⃣ انتخاب مدل (ذخیره در DB)
POST /api/admin/ai-model-management/select-model/
Body: {provider: "openrouter", capability: "chat", model_id: "...", model_name: "..."}
→ ذخیره در AIModel

# 4️⃣ لیست مدل‌های انتخاب شده (از DB)
GET /api/admin/ai-model-management/selected-models/
→ { data: [فقط 5-10 مدل انتخاب شده] }

# 5️⃣ استفاده از Chat
POST /api/admin/ai-chat/send-message/
Body: {message: "hello"}
→ از مدل فعال chat استفاده می‌کنه
```

---

## ✅ **مزایا:**

| ویژگی | وضعیت |
|------|-------|
| **لیست مدل‌ها** | ✅ Real-time از API (کش شده) |
| **ذخیره در DB** | ✅ فقط مدل انتخاب شده (5-10 رکورد) |
| **Dynamic** | ✅ Provider جدید خودکار اضافه میشه |
| **بدون Import** | ✅ فقط در Registry |
| **سرعت** | ✅ Cache (6 ساعت) |
| **فقط یک مدل فعال** | ✅ در save() چک میشه |

---

## 🚀 **فلوی کامل:**
```
1. ادمین میره Chat Section → انتخاب مدل
   ↓
2. GET /providers/?capability=chat
   → لیست providerها (openrouter, groq, ...)
   ↓
3. انتخاب "openrouter"
   ↓
4. GET /browse-models/?provider=openrouter&capability=chat
   → لیست 400 مدل از OpenRouter API (کش شده)
   ↓
5. انتخاب "Gemini 2.0 Flash"
   ↓
6. POST /select-model/
   → ذخیره در AIModel (فقط این یکی!)
   → مدل قبلی غیرفعال میشه
   ↓
7. از این به بعد Chat از این مدل استفاده می‌کنه
   → بدون import دستی! (از Registry)

📝 خلاصه:
✅ لیست مدل‌ها: Real-time از API (بدون DB)
✅ مدل انتخاب شده: در DB (فقط یکی)
✅ Dynamic: Provider جدید خودکار اضافه میشه
✅ بدون Import: از Registry استفاده می‌کنیم
✅ سرعت: Cache برای لیست مدل‌ها
