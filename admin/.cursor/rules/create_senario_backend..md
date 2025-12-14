
📌 درک درست از سناریو:
✅ چیزهایی که باید بمونن:

✅ هر تولید (Chat, Content, Image, Audio) ViewSet و API جداگانه دارن
✅ جدول AIModel در دیتابیس باید باشه
✅ هر capability (chat, image, ...) فقط یک مدل فعال داره
✅ در پنل ادمین میتونن مدل انتخاب کنن

❌ مشکل فعلی:
python# الان این اتفاق میفته:
@action(detail=False, methods=['post'], url_path='sync-models')
def sync_models(self, request):
    # میره 400 مدل OpenRouter رو میاره
    # همه رو توی جدول AIModel ذخیره می‌کنه 😱
    # دیتابیس پر میشه!
✅ راه‌حل درست:

لیست مدل‌ها real-time از API بگیریم (بدون ذخیره در DB)
وقتی ادمین مدل انتخاب کرد، فقط اون یکی رو در AIModel ذخیره کنیم
برای هر provider فقط مدل‌های انتخاب شده در DB باشن (نه صدها مدل!)


🎯 راه‌حل بهینه:
1️⃣ حذف Sync - استفاده از Real-time API
python# ❌ قبل: Sync تمام مدل‌ها
@action(detail=False, methods=['post'], url_path='sync-models')
def sync_models(self, request):
    models = OpenRouterProvider.get_available_models()  # 400 model
    for model in models:
        AIModel.objects.create(...)  # 😱 400 رکورد!

# ✅ بعد: فقط لیست بگیر (بدون ذخیره)
@action(detail=False, methods=['get'], url_path='available-models')
def available_models(self, request):
    """لیست مدل‌ها برای انتخاب در پنل - بدون ذخیره"""
    provider_slug = request.query_params.get('provider')
    capability = request.query_params.get('capability')
    
    # دریافت real-time از API
    models = self._fetch_models_from_api(provider_slug)
    
    # فیلتر بر اساس capability
    filtered = self._filter_by_capability(models, capability)
    
    # فقط برگردون - ذخیره نکن!
    return APIResponse.success(data=filtered)

2️⃣ ذخیره فقط مدل انتخاب شده
python# Backend/src/ai/views/ai_model_management_views.py

class AIModelManagementViewSet(viewsets.ViewSet):
    """مدیریت مدل‌ها در پنل ادمین"""
    
    @action(detail=False, methods=['get'], url_path='browse-models')
    def browse_models(self, request):
        """
        📋 لیست مدل‌های available برای انتخاب
        این مدل‌ها در DB ذخیره نمیشن!
        
        Query params:
        - provider: openrouter, huggingface, groq
        - capability: chat, image, content, audio
        """
        provider_slug = request.query_params.get('provider')
        capability = request.query_params.get('capability')
        
        if not provider_slug:
            return APIResponse.error(
                message="Provider is required",
                status_code=400
            )
        
        try:
            provider = AIProvider.objects.get(slug=provider_slug, is_active=True)
            api_key = provider.get_shared_api_key()
            
            # دریافت لیست از API (کش میشه برای سرعت)
            cache_key = f"available_models_{provider_slug}_{capability}"
            models = cache.get(cache_key)
            
            if not models:
                models = self._fetch_from_provider_api(
                    provider_slug, 
                    api_key,
                    capability
                )
                cache.set(cache_key, models, 6 * 60 * 60)  # 6 hours
            
            return APIResponse.success(
                message=f"Found {len(models)} models",
                data={
                    'provider': provider_slug,
                    'capability': capability,
                    'models': models,
                    'total': len(models)
                }
            )
            
        except Exception as e:
            return APIResponse.error(
                message=f"Error fetching models: {str(e)}",
                status_code=500
            )
    
    @action(detail=False, methods=['post'], url_path='select-model')
    def select_model(self, request):
        """
        ✅ انتخاب و ذخیره مدل در DB
        فقط مدل انتخاب شده ذخیره میشه!
        
        Body:
        {
            "provider": "openrouter",
            "capability": "chat",
            "model_id": "google/gemini-2.0-flash",
            "model_name": "Gemini 2.0 Flash"
        }
        """
        provider_slug = request.data.get('provider')
        capability = request.data.get('capability')
        model_id = request.data.get('model_id')
        model_name = request.data.get('model_name')
        
        try:
            provider = AIProvider.objects.get(slug=provider_slug, is_active=True)
            
            # 1. غیرفعال کردن مدل قبلی همین capability
            AIModel.objects.filter(
                provider=provider,
                capabilities__contains=capability
            ).update(is_active=False)
            
            # 2. ایجاد/آپدیت مدل جدید
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
            
            # 3. کش را پاک کن
            AICacheManager.invalidate_models()
            
            return APIResponse.success(
                message=f"Model selected successfully",
                data={
                    'id': model.id,
                    'model_id': model.model_id,
                    'name': model.display_name,
                    'capability': capability,
                    'is_active': model.is_active
                }
            )
            
        except Exception as e:
            return APIResponse.error(
                message=f"Error selecting model: {str(e)}",
                status_code=500
            )
    
    @action(detail=False, methods=['get'], url_path='selected-models')
    def get_selected_models(self, request):
        """
        📌 لیست مدل‌های انتخاب شده (که در DB هستن)
        """
        provider_slug = request.query_params.get('provider')
        
        queryset = AIModel.objects.filter(
            is_active=True,
            provider__is_active=True
        ).select_related('provider')
        
        if provider_slug:
            queryset = queryset.filter(provider__slug=provider_slug)
        
        serializer = AIModelListSerializer(queryset, many=True)
        
        return APIResponse.success(
            message="Selected models retrieved",
            data=serializer.data
        )
    
    def _fetch_from_provider_api(self, provider_slug: str, api_key: str, 
                                 capability: str = None) -> list:
        """دریافت لیست مدل‌ها از API provider"""
        
        if provider_slug == 'openrouter':
            from src.ai.providers.openrouter import OpenRouterProvider
            models = OpenRouterProvider.get_available_models(
                api_key=api_key,
                use_cache=True
            )
            
        elif provider_slug == 'huggingface':
            from src.ai.providers.huggingface import HuggingFaceProvider
            task_map = {
                'chat': 'text-generation',
                'content': 'text-generation',
                'image': 'text-to-image',
                'audio': 'text-to-speech'
            }
            task = task_map.get(capability)
            models = HuggingFaceProvider.get_available_models(
                api_key=api_key,
                task_filter=task,
                use_cache=True
            )
            
        elif provider_slug == 'groq':
            from src.ai.providers.groq import GroqProvider
            models = GroqProvider.get_available_models(
                api_key=api_key,
                use_cache=True
            )
        else:
            return []
        
        # فیلتر بر اساس capability
        if capability:
            models = [m for m in models if self._model_supports_capability(m, capability)]
        
        return models
    
    def _model_supports_capability(self, model: dict, capability: str) -> bool:
        """بررسی اینکه مدل از capability پشتیبانی می‌کنه"""
        model_id = model.get('id', '').lower()
        
        if capability == 'image':
            return any(kw in model_id for kw in ['dall-e', 'flux', 'stable', 'imagen'])
        elif capability == 'audio':
            return any(kw in model_id for kw in ['tts', 'whisper', 'audio'])
        else:  # chat, content
            return True  # اکثر مدل‌ها

3️⃣ Registry Pattern (بدون import دستی)
python# Backend/src/ai/providers/registry.py

class AIProviderRegistry:
    """Auto-discovery providerها - بدون import دستی"""
    
    _instance = None
    _providers: Dict[str, Type[BaseProvider]] = {}
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if not hasattr(self, '_initialized'):
            self._initialized = True
            self.auto_discover()
    
    def auto_discover(self):
        """کشف خودکار تمام providerها"""
        # Import فقط یکبار در اینجا
        from .gemini import GeminiProvider
        from .openai import OpenAIProvider
        from .openrouter import OpenRouterProvider
        from .groq import GroqProvider
        from .huggingface import HuggingFaceProvider
        from .deepseek import DeepSeekProvider
        
        self.register('gemini', GeminiProvider)
        self.register('openai', OpenAIProvider)
        self.register('openrouter', OpenRouterProvider)
        self.register('groq', GroqProvider)
        self.register('huggingface', HuggingFaceProvider)
        self.register('deepseek', DeepSeekProvider)
    
    @classmethod
    def register(cls, name: str, provider_class: Type[BaseProvider]):
        cls._providers[name] = provider_class
    
    @classmethod
    def get(cls, name: str) -> Type[BaseProvider]:
        return cls._providers.get(name)
    
    @classmethod
    def create_instance(cls, name: str, api_key: str, config: dict = None):
        provider_class = cls.get(name)
        if not provider_class:
            raise ValueError(f"Provider '{name}' not found")
        return provider_class(api_key, config)

# Initialize
_registry = AIProviderRegistry()

4️⃣ استفاده در Viewهای موجود
python# Backend/src/ai/views/chat_views.py (بدون تغییر اساسی!)

from src.ai.providers.registry import AIProviderRegistry

class AIChatViewSet(viewsets.ViewSet):
    
    @action(detail=False, methods=['post'], url_path='send-message')
    def send_message(self, request):
        # ... permission checks ...
        
        # 1. پیدا کردن مدل فعال
        model = AIModel.objects.get_active_model('openrouter', 'chat')
        
        # 2. دریافت API key
        api_key = self._get_api_key(model.provider, request.user)
        
        # 3. ایجاد provider از Registry (بدون import دستی!)
        registry = AIProviderRegistry()
        provider = registry.create_instance(
            name=model.provider.slug,
            api_key=api_key,
            config={'model': model.model_id}
        )
        
        # 4. استفاده از provider
        loop = asyncio.get_event_loop()
        reply = loop.run_until_complete(
            provider.chat(message, conversation_history)
        )
        
        return APIResponse.success(data={'reply': reply})
```

---

## 📁 **ساختار فایل‌های نهایی:**
```
Backend/src/ai/
├── models/
│   ├── ai_provider.py          ✅ نگه داشتن
│   └── __init__.py
│
├── providers/
│   ├── base.py                 ✅ نگه داشتن
│   ├── registry.py             ⭐ جدید - Auto-discovery
│   ├── gemini.py               ✅ نگه داشتن
│   ├── openai.py               ✅ نگه داشتن
│   ├── openrouter.py           ✅ نگه داشتن
│   ├── groq.py                 ✅ نگه داشتن
│   ├── huggingface.py          ✅ نگه داشتن
│   └── deepseek.py             ✅ نگه داشتن
│
├── views/
│   ├── ai_provider_views.py    ✅ نگه داشتن
│   ├── chat_views.py           ✅ نگه داشتن (با Registry)
│   ├── content_generation_views.py  ✅ نگه داشتن
│   ├── image_generation_views.py    ✅ نگه داشتن
│   ├── audio_generation_views.py    ✅ نگه داشتن
│   ├── ai_model_management_views.py ⭐ جدید - Browse & Select
│   └── ai_model_sync_views.py  ❌ حذف (دیگه sync نداریم!)
│
├── services/
│   ├── chat_service.py         ✅ نگه داشتن (با Registry)
│   ├── content_generation_service.py  ✅ نگه داشتن
│   ├── image_generation_service.py    ✅ نگه داشتن
│   └── audio_generation_service.py    ✅ نگه داشتن
│
└── urls.py                     🔄 آپدیت

🔄 URLs جدید:
python# Backend/src/ai/urls.py

router = DefaultRouter()

# ⭐ Model Management (جدید)
router.register(r'admin/ai-model-management', 
                AIModelManagementViewSet, 
                basename='ai-model-management')

# ✅ Viewهای موجود (بد