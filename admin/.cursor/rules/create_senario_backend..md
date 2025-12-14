🎯 بررسی دقیق و راه‌حل بهینه
بعد از بررسی دقیق کد و سناریو، مشکل اصلی رو شناسایی کردم:
❌ مشکلات فعلی:

ذخیره مدل‌ها در دیتابیس - جدول AIModel صدها رکورد ایجاد می‌کنه
نیاز به Sync - باید مدام sync کنی تا مدل‌های جدید بیان
پیچیدگی مدیریت - "فقط یک مدل فعال" رو باید در دیتابیس کنترل کنی
Import دستی - هر provider رو باید در همه جا import کنی
تکرار کد - توی هر View باید provider رو import و استفاده کنی

✅ راه‌حل بهینه (2025 Best Practice):
🏗️ معماری جدید - Real-time API + Config Storage
┌─────────────────────────────────────────────────────┐
│                   Frontend (Panel)                   │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐   │
│  │ Chat   │  │Content │  │ Image  │  │ Audio  │   │
│  └────────┘  └────────┘  └────────┘  └────────┘   │
└─────────────────────────────────────────────────────┘
                        ↓ API Call
┌─────────────────────────────────────────────────────┐
│               Backend (Django Views)                 │
│  ┌─────────────────────────────────────────────┐   │
│  │      UnifiedAIService (Single Entry)        │   │
│  └─────────────────────────────────────────────┘   │
│                        ↓                             │
│  ┌─────────────────────────────────────────────┐   │
│  │      AIProviderRegistry (Dynamic)           │   │
│  │  - Auto-discover providers                  │   │
│  │  - No manual imports                        │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│                  Database (Minimal)                  │
│  ┌──────────────────────────────────────────────┐  │
│  │  AIProvider (فقط config و انتخاب مدل)      │  │
│  │  - slug: "openrouter"                        │  │
│  │  - config: {                                 │  │
│  │      "selected_models": {                    │  │
│  │        "chat": "google/gemini-2.0-flash",    │  │
│  │        "image": "openai/dall-e-3"            │  │
│  │      }                                        │  │
│  │    }                                          │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  ❌ AIModel جدول حذف شد - نیازی نیست!            │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│        External APIs (Real-time)                     │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐            │
│  │OpenRouter│  │HuggingFace│ │  Groq  │            │
│  │400 models│  │300 models │ │50 models│           │
│  └─────────┘  └─────────┘  └─────────┘            │
│           مدل‌ها رو real-time می‌خونه              │
└─────────────────────────────────────────────────────┘

📁 ساختار فایل‌های جدید:
1️⃣ مدل دیتابیس (ساده‌شده)
python# Backend/src/ai/models/ai_provider.py

class AIProvider(BaseModel):
    """فقط Provider و config - بدون AIModel"""
    
    slug = models.SlugField(unique=True)
    display_name = models.CharField(max_length=150)
    shared_api_key = models.TextField(blank=True)  # رمزنگاری شده
    
    # ⭐ همه چیز در config
    config = models.JSONField(default=dict, blank=True)
    # {
    #     "selected_models": {
    #         "chat": "google/gemini-2.0-flash",
    #         "content": "google/gemini-2.0-flash",
    #         "image": "openai/dall-e-3",
    #         "audio": "openai/tts-1"
    #     },
    #     "capabilities": ["chat", "content", "image"]
    # }
    
    allow_personal_keys = models.BooleanField(default=True)
    allow_shared_for_normal_admins = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

# ❌ AIModel جدول حذف شد!

2️⃣ Registry Pattern (Auto-discovery)
python# Backend/src/ai/providers/registry.py

class AIProviderRegistry:
    """تمام providerها رو خودکار کشف و ثبت می‌کنه"""
    
    _instance = None
    _providers: Dict[str, Type[BaseProvider]] = {}
    
    @classmethod
    def auto_discover(cls):
        """Auto-discover تمام providerها - بدون import دستی"""
        import importlib
        import inspect
        from pathlib import Path
        
        # پیدا کردن تمام فایل‌های .py در پوشه providers
        providers_dir = Path(__file__).parent
        for file in providers_dir.glob("*.py"):
            if file.stem in ['__init__', 'base', 'registry']:
                continue
            
            # Import dynamic
            module = importlib.import_module(f"src.ai.providers.{file.stem}")
            
            # پیدا کردن کلاس‌های Provider
            for name, obj in inspect.getmembers(module, inspect.isclass):
                if issubclass(obj, BaseProvider) and obj != BaseProvider:
                    provider_name = file.stem  # نام فایل = نام provider
                    cls.register(provider_name, obj)
    
    @classmethod
    def get_available_models(cls, provider_slug: str, capability: str = None, 
                           api_key: str = None) -> List[Dict]:
        """دریافت مدل‌ها real-time از API"""
        provider_class = cls.get(provider_slug)
        if not provider_class or not hasattr(provider_class, 'get_available_models'):
            return []
        
        # کش کردن برای سرعت
        cache_key = f"models_{provider_slug}_{capability}"
        cached = cache.get(cache_key)
        if cached:
            return cached
        
        # دریافت از API
        models = provider_class.get_available_models(api_key=api_key)
        
        # فیلتر بر اساس capability
        if capability:
            models = [m for m in models if capability in cls._detect_capability(m)]
        
        cache.set(cache_key, models, 6 * 60 * 60)  # 6 ساعت
        return models

# Initialize تنها یک بار
_registry = AIProviderRegistry()

3️⃣ Unified Service (ساده‌شده)
python# Backend/src/ai/services/unified_service.py

class UnifiedAIService:
    """یک سرویس برای همه - بدون تکرار کد"""
    
    @classmethod
    def get_selected_model(cls, provider_slug: str, capability: str, admin) -> str:
        """دریافت مدل انتخاب شده از config"""
        provider = AIProvider.objects.get(slug=provider_slug, is_active=True)
        
        # 1. چک کردن Personal config
        if admin:
            settings = AdminProviderSettings.objects.filter(
                admin=admin, provider=provider, is_active=True
            ).first()
            
            if settings and settings.config:
                personal_model = settings.config.get('selected_models', {}).get(capability)
                if personal_model:
                    return personal_model
        
        # 2. چک کردن Shared config
        selected_models = provider.config.get('selected_models', {})
        return selected_models.get(capability)
    
    @classmethod
    def generate_content(cls, prompt: str, capability: str, admin, **kwargs):
        """تولید محتوا - تمام capabilityها"""
        
        # 1. پیدا کردن provider و مدل
        # (از config می‌خونه، نه از دیتابیس!)
        provider_slug = cls._find_active_provider(capability)
        model_id = cls.get_selected_model(provider_slug, capability, admin)
        
        # 2. دریافت API key
        api_key = cls._get_api_key(provider_slug, admin)
        
        # 3. دریافت provider از Registry
        registry = AIProviderRegistry()
        provider = registry.create_instance(provider_slug, api_key, {
            'model': model_id
        })
        
        # 4. تولید محتوا
        loop = asyncio.get_event_loop()
        if capability == 'chat':
            return loop.run_until_complete(provider.chat(prompt, **kwargs))
        elif capability == 'image':
            return loop.run_until_complete(provider.generate_image(prompt, **kwargs))
        elif capability == 'content':
            return loop.run_until_complete(provider.generate_content(prompt, **kwargs))
        elif capability == 'audio':
            return loop.run_until_complete(provider.text_to_speech(prompt, **kwargs))

4️⃣ Views (خیلی ساده)
python# Backend/src/ai/views/unified_views.py

class UnifiedAIViewSet(viewsets.ViewSet):
    """یک ViewSet برای همه capabilityها"""
    
    @action(detail=False, methods=['get'], url_path='models')
    def get_models(self, request):
        """دریافت لیست مدل‌ها real-time"""
        capability = request.query_params.get('capability')  # chat, image, content, audio
        provider_slug = request.query_params.get('provider')  # optional
        
        if provider_slug:
            # مدل‌های یک provider خاص
            providers_to_check = [provider_slug]
        else:
            # همه providerهای فعال
            providers_to_check = AIProvider.objects.filter(
                is_active=True
            ).values_list('slug', flat=True)
        
        all_models = []
        registry = AIProviderRegistry()
        
        for slug in providers_to_check:
            try:
                provider = AIProvider.objects.get(slug=slug, is_active=True)
                api_key = provider.get_shared_api_key()
                
                # دریافت مدل‌ها real-time
                models = registry.get_available_models(slug, capability, api_key)
                
                # اضافه کردن مدل انتخاب شده
                selected = provider.config.get('selected_models', {}).get(capability)
                
                all_models.append({
                    'provider': slug,
                    'provider_name': provider.display_name,
                    'models': models,
                    'selected_model': selected,
                    'count': len(models)
                })
            except Exception:
                continue
        
        return APIResponse.success(
            message=f"Found {sum(m['count'] for m in all_models)} models",
            data=all_models
        )
    
    @action(detail=False, methods=['post'], url_path='<capability>/generate')
    def generate(self, request, capability):
        """تولید محتوا برای هر capability"""
        prompt = request.data.get('prompt')
        
        result = UnifiedAIService.generate_content(
            prompt=prompt,
            capability=capability,
            admin=request.user,
            **request.data
        )
        
        return APIResponse.success(
            message=f"{capability.title()} generated successfully",
            data=result
        )

5️⃣ Admin Panel Serializer
python# Backend/src/ai/serializers/admin_serializers.py

class AIProviderAdminSerializer(serializers.ModelSerializer):
    """Serializer ساده برای پنل ادمین"""
    
    # Real-time model counts
    available_models_count = serializers.SerializerMethodField()
    
    class Meta:
        model = AIProvider
        fields = ['slug', 'display_name', 'config', 'available_models_count']
    
    def get_available_models_count(self, obj):
        """تعداد مدل‌ها real-time"""
        registry = AIProviderRegistry()
        counts = {}
        
        for capability in ['chat', 'image', 'content', 'audio']:
            models = registry.get_available_models(obj.slug, capability)
            counts[capability] = len(models)
        
        return counts

class ModelSelectionSerializer(serializers.Serializer):
    """برای انتخاب مدل در پنل"""
    
    provider = serializers.CharField()
    capability = serializers.ChoiceField(choices=['chat', 'image', 'content', 'audio'])
    model_id = serializers.CharField()
    
    def save(self):
        """ذخیره انتخاب در config"""
        provider = AIProvider.objects.get(slug=self.validated_data['provider'])
        
        if not provider.config:
            provider.config = {}
        
        if 'selected_models' not in provider.config:
            provider.config['selected_models'] = {}
        
        provider.config['selected_models'][self.validated_data['capability']] = \
            self.validated_data['model_id']
        
        provider.save()
        return provider

🚀 مزایای این معماری:
ویژگیقبلبعدذخیره در DB✅ صدها رکورد❌ فقط configSync✅ نیاز به sync❌ Real-timeImport دستی✅ در هر فایل❌ Auto-discoverتکرار کد✅ در هر View❌ یک Serviceسرعت⚠️ Query زیاد✅ Cache شدهFlexibility⚠️ Sync لازم✅ Instant updateحجم کد⚠️ زیاد✅ خیلی کم

📝 تغییرات لازم:
✅ فایل‌های نیاز به تغییر:

ai/models/ai_provider.py - حذف AIModel
ai/providers/registry.py - Auto-discovery
ai/services/unified_service.py - ساده‌سازی
ai/views/unified_views.py - یک ViewSet
ai/urls.py - ساده‌سازی روت‌ها

❌ فایل‌های حذف شده:

ai/models/ai_model.py ❌
ai/views/chat_views.py ❌
ai/views/image_generation_views.py ❌
ai/views/content_generation_views.py ❌
ai/views/audio_generation_views.py ❌
ai/views/ai_model_sync_views.py ❌


🎯 نتیجه‌گیری:
این معماری:

✅ ساده - فقط 5 فایل اصلی
✅ سریع - Cache + No DB queries
✅ Dynamic - Real-time از API
✅ Scalable - هر تعداد provider
✅ Maintainable - بدون تکرار کد
✅ Professional - Best practice 2025

