🎯 چیزهایی که خوب طراحی شده:
1. ✅ Registry Pattern - خوب
2. ✅ جدول AIModel - فقط انتخاب شده‌ها
3. ✅ ViewSet‌های جدا - مناسب
4. ✅ Cache Strategy - مفید
5. ✅ Personal/Shared API Key - درست
⚠️ مشکلات احتمالی:
1. ❌ Hardcode در Registry (_auto_discover)
2. ❌ Hardcode در Capabilities 
3. ⚠️ Migration برای 50 provider
4. ⚠️ Performance در لیست مدل‌ها
5. ❌ Frontend API structure

🏗️ معماری بهینه برای 50+ AI Provider
مقایسه با Best Practices:
معماریروش فعلیروش بهینه (Django 5.x + Next.js)Provider StorageHardcode در RegistryDynamic از DB + Auto-registerModel ListCache API callsDB cache + Lazy loadCapabilitiesHardcode dictionaryDB relation + DynamicFrontend APIMultiple endpointsUnified GraphQL/RESTScalabilityمحدود به 10-2050-100+ provider

🚀 معماری پیشنهادی (Production-Ready):
1️⃣ ساختار دیتابیس (بهینه‌شده)
python# Backend/src/ai/models/ai_provider.py

from django.db import models
from django.core.cache import cache
from django.contrib.postgres.fields import ArrayField  # اگه PostgreSQL داری

class AIProvider(BaseModel):
    """
    ⭐ Provider اصلی - ساده و قدرتمند
    """
    # اطلاعات پایه
    slug = models.SlugField(unique=True, max_length=50)
    name = models.CharField(max_length=100)
    display_name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    
    # Configuration
    provider_class = models.CharField(
        max_length=200,
        help_text="Python class path: src.ai.providers.openrouter.OpenRouterProvider"
    )
    api_base_url = models.URLField(blank=True)
    website = models.URLField(blank=True)
    
    # API Keys (encrypted)
    shared_api_key = models.TextField(blank=True)
    
    # Capabilities (dynamic!)
    capabilities = models.JSONField(
        default=dict,
        help_text="""
        {
            "chat": {"supported": true, "has_dynamic_models": true},
            "content": {"supported": true, "has_dynamic_models": true},
            "image": {"supported": true, "has_dynamic_models": false},
            "audio": {"supported": false}
        }
        """
    )
    
    # Settings
    config = models.JSONField(default=dict, blank=True)
    allow_personal_keys = models.BooleanField(default=True)
    allow_shared_for_normal_admins = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    
    # Metadata
    logo_url = models.URLField(blank=True)
    sort_order = models.IntegerField(default=0)
    
    # Stats
    total_requests = models.BigIntegerField(default=0)
    last_used_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'ai_providers'
        ordering = ['sort_order', 'name']
        indexes = [
            models.Index(fields=['slug', 'is_active']),
            models.Index(fields=['is_active', 'sort_order']),
        ]
    
    def get_provider_instance(self, api_key: str, config: dict = None):
        """
        ⭐ Dynamic instantiation - بدون hardcode!
        """
        import importlib
        
        # Parse class path
        module_path, class_name = self.provider_class.rsplit('.', 1)
        
        # Import dynamically
        module = importlib.import_module(module_path)
        provider_class = getattr(module, class_name)
        
        # Create instance
        return provider_class(api_key=api_key, config=config or self.config)
    
    def supports_capability(self, capability: str) -> bool:
        """چک کردن پشتیبانی از capability"""
        return self.capabilities.get(capability, {}).get('supported', False)
    
    def has_dynamic_models(self, capability: str) -> bool:
        """آیا لیست مدل‌ها از API میاد؟"""
        return self.capabilities.get(capability, {}).get('has_dynamic_models', False)


class AIModel(BaseModel):
    """
    فقط مدل‌های انتخاب شده
    """
    provider = models.ForeignKey(AIProvider, on_delete=models.CASCADE, related_name='selected_models')
    
    # Model info
    model_id = models.CharField(max_length=200)
    display_name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    
    # Capability (فقط یکی!)
    capability = models.CharField(
        max_length=20,
        choices=[
            ('chat', 'Chat'),
            ('content', 'Content'),
            ('image', 'Image'),
            ('audio', 'Audio'),
        ]
    )
    
    # Pricing
    is_free = models.BooleanField(default=False)
    pricing_input = models.DecimalField(max_digits=10, decimal_places=6, null=True, blank=True)
    pricing_output = models.DecimalField(max_digits=10, decimal_places=6, null=True, blank=True)
    
    # Config
    config = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)
    
    # Stats
    total_requests = models.BigIntegerField(default=0)
    last_used_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'ai_models'
        unique_together = ['provider', 'capability']  # ⭐ فقط یک مدل فعال
        indexes = [
            models.Index(fields=['provider', 'capability', 'is_active']),
        ]
    
    def save(self, *args, **kwargs):
        """فقط یک مدل فعال برای هر provider+capability"""
        if self.is_active:
            AIModel.objects.filter(
                provider=self.provider,
                capability=self.capability,
                is_active=True
            ).exclude(pk=self.pk).update(is_active=False)
        
        super().save(*args, **kwargs)

2️⃣ Registry Pattern (کاملاً Dynamic)
python# Backend/src/ai/providers/registry.py

import importlib
import inspect
from pathlib import Path
from typing import Dict, Type, Optional, List
from django.core.cache import cache

from .base import BaseProvider

class AIProviderRegistry:
    """
    ⭐ Registry کاملاً dynamic
    ⭐ Auto-discovery از دیتابیس
    ⭐ بدون هیچ hardcode!
    """
    
    _instance = None
    _providers_cache: Dict[str, Type[BaseProvider]] = {}
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def get_provider_class(self, slug: str) -> Optional[Type[BaseProvider]]:
        """
        دریافت کلاس provider
        ⭐ اول از cache، بعد از file system
        """
        # Check memory cache
        if slug in self._providers_cache:
            return self._providers_cache[slug]
        
        # Check Django cache
        cache_key = f"provider_class_{slug}"
        cached = cache.get(cache_key)
        if cached:
            self._providers_cache[slug] = cached
            return cached
        
        # Auto-discover from filesystem
        provider_class = self._discover_provider(slug)
        
        if provider_class:
            self._providers_cache[slug] = provider_class
            cache.set(cache_key, provider_class, 3600)  # 1 hour
        
        return provider_class
    
    def _discover_provider(self, slug: str) -> Optional[Type[BaseProvider]]:
        """
        ⭐ Auto-discovery از فایل‌های providers/
        """
        try:
            # Try to import provider module
            module_path = f"src.ai.providers.{slug}"
            module = importlib.import_module(module_path)
            
            # Find Provider class
            for name, obj in inspect.getmembers(module, inspect.isclass):
                if issubclass(obj, BaseProvider) and obj != BaseProvider:
                    return obj
            
        except ImportError:
            pass
        
        return None
    
    def get_all_providers(self) -> List[str]:
        """
        ⭐ لیست تمام providerها از filesystem
        """
        providers_dir = Path(__file__).parent
        providers = []
        
        for file in providers_dir.glob("*.py"):
            if file.stem not in ['__init__', 'base', 'registry', '_template']:
                providers.append(file.stem)
        
        return providers
    
    def create_instance(self, slug: str, api_key: str, 
                       config: dict = None) -> BaseProvider:
        """ایجاد instance"""
        provider_class = self.get_provider_class(slug)
        if not provider_class:
            raise ValueError(f"Provider '{slug}' not found")
        
        return provider_class(api_key=api_key, config=config or {})
    
    @staticmethod
    def get_available_models(slug: str, api_key: str, 
                            capability: str = None) -> List[dict]:
        """
        ⭐ دریافت لیست مدل‌ها با Cache Strategy
        """
        cache_key = f"models_{slug}_{capability}"
        cached = cache.get(cache_key)
        if cached:
            return cached
        
        # Get provider class
        registry = AIProviderRegistry()
        provider_class = registry.get_provider_class(slug)
        
        if not provider_class or not hasattr(provider_class, 'get_available_models'):
            return []
        
        try:
            # Fetch from API
            models = provider_class.get_available_models(
                api_key=api_key,
                use_cache=True
            )
            
            # Filter by capability (if provider supports it)
            if capability and hasattr(provider_class, 'filter_by_capability'):
                models = provider_class.filter_by_capability(models, capability)
            
            # Cache for 6 hours
            cache.set(cache_key, models, 6 * 60 * 60)
            return models
            
        except Exception as e:
            print(f"Error fetching models for {slug}: {e}")
            return []

# Singleton instance
_registry = AIProviderRegistry()

3️⃣ Unified API ViewSet (برای Next.js)
python# Backend/src/ai/views/unified_admin_views.py

from rest_framework import viewsets, status
from rest_framework.decorators import action
from django.db.models import Q, Prefetch

from src.ai.models import AIProvider, AIModel
from src.ai.providers.registry import AIProviderRegistry

class UnifiedAIAdminViewSet(viewsets.ViewSet):
    """
    ⭐ یک API واحد برای تمام عملیات پنل ادمین
    ⭐ Optimized برای Next.js
    """
    
    @action(detail=False, methods=['get'], url_path='dashboard')
    def dashboard(self, request):
        """
        📊 Dashboard کامل - یک API برای همه چیز
        
        Response:
        {
            "providers": [
                {
                    "slug": "openrouter",
                    "name": "OpenRouter",
                    "logo": "...",
                    "is_active": true,
                    "has_api_key": true,
                    "capabilities": {
                        "chat": {"supported": true, "has_model": true, "selected_model": "..."},
                        "content": {...},
                        "image": {...},
                        "audio": {...}
                    },
                    "stats": {...}
                }
            ],
            "selected_models": {
                "chat": {...},
                "content": {...},
                "image": {...},
                "audio": {...}
            }
        }
        """
        # Fetch all providers
        providers = AIProvider.objects.filter(
            is_active=True
        ).prefetch_related(
            Prefetch('selected_models', queryset=AIModel.objects.filter(is_active=True))
        ).order_by('sort_order')
        
        # Build response
        result = {
            'providers': [],
            'selected_models': {}
        }
        
        for provider in providers:
            provider_data = {
                'slug': provider.slug,
                'name': provider.display_name,
                'logo': provider.logo_url,
                'is_active': provider.is_active,
                'has_api_key': bool(provider.shared_api_key),
                'capabilities': {},
                'stats': {
                    'total_requests': provider.total_requests,
                    'last_used': provider.last_used_at.isoformat() if provider.last_used_at else None
                }
            }
            
            # Capabilities
            for capability in ['chat', 'content', 'image', 'audio']:
                supported = provider.supports_capability(capability)
                
                # Check if has selected model
                selected_model = next(
                    (m for m in provider.selected_models.all() if m.capability == capability),
                    None
                )
                
                provider_data['capabilities'][capability] = {
                    'supported': supported,
                    'has_model': bool(selected_model),
                    'selected_model': {
                        'id': selected_model.model_id,
                        'name': selected_model.display_name,
                        'is_free': selected_model.is_free
                    } if selected_model else None
                }
                
                # Add to selected_models
                if selected_model:
                    result['selected_models'][capability] = {
                        'provider': provider.slug,
                        'model_id': selected_model.model_id,
                        'model_name': selected_model.display_name,
                        'is_free': selected_model.is_free
                    }
            
            result['providers'].append(provider_data)
        
        return APIResponse.success(
            message="Dashboard data retrieved",
            data=result
        )
    
    @action(detail=False, methods=['get'], url_path='models/browse')
    def browse_models(self, request):
        """
        📋 Browse مدل‌های available
        
        Query: ?provider=openrouter&capability=chat
        
        Response:
        {
            "provider": "openrouter",
            "capability": "chat",
            "models": [
                {
                    "id": "google/gemini-2.0-flash",
                    "name": "Gemini 2.0 Flash",
                    "is_free": true,
                    "is_selected": true,
                    "pricing": {...}
                }
            ]
        }
        """
        provider_slug = request.query_params.get('provider')
        capability = request.query_params.get('capability')
        
        if not provider_slug or not capability:
            return APIResponse.error(
                message="Both provider and capability required",
                status_code=400
            )
        
        try:
            provider = AIProvider.objects.get(slug=provider_slug, is_active=True)
            
            # Check if supported
            if not provider.supports_capability(capability):
                return APIResponse.success(
                    message=f"{provider.display_name} does not support {capability}",
                    data={
                        'provider': provider_slug,
                        'capability': capability,
                        'supported': False,
                        'models': []
                    }
                )
            
            # Get API key
            api_key = provider.get_shared_api_key()
            if not api_key:
                return APIResponse.error(
                    message="No API key configured",
                    status_code=400
                )
            
            # Fetch models
            registry = AIProviderRegistry()
            models = registry.get_available_models(provider_slug, api_key, capability)
            
            # Get selected model
            try:
                selected = AIModel.objects.get(
                    provider=provider,
                    capability=capability,
                    is_active=True
                )
                selected_id = selected.model_id
            except AIModel.DoesNotExist:
                selected_id = None
            
            # Format response
            formatted_models = []
            for model in models:
                formatted_models.append({
                    'id': model.get('id'),
                    'name': model.get('name'),
                    'description': model.get('description', ''),
                    'is_free': model.get('pricing', {}).get('prompt', 0) == 0,
                    'is_selected': model.get('id') == selected_id,
                    'pricing': model.get('pricing', {}),
                    'context_length': model.get('context_length', 0)
                })
            
            # Sort: selected first, then free, then by name
            formatted_models.sort(key=lambda x: (
                not x['is_selected'],  # selected first
                not x['is_free'],      # free second
                x['name']              # alphabetical
            ))
            
            return APIResponse.success(
                message=f"Found {len(formatted_models)} models",
                data={
                    'provider': provider_slug,
                    'provider_name': provider.display_name,
                    'capability': capability,
                    'supported': True,
                    'models': formatted_models,
                    'total': len(formatted_models)
                }
            )
            
        except AIProvider.DoesNotExist:
            return APIResponse.error(
                message="Provider not found",
                status_code=404
            )
        except Exception as e:
            return APIResponse.error(
                message=f"Error: {str(e)}",
                status_code=500
            )
    
    @action(detail=False, methods=['post'], url_path='models/select')
    def select_model(self, request):
        """
        ✅ انتخاب مدل
        
        Body:
        {
            "provider": "openrouter",
            "capability": "chat",
            "model_id": "google/gemini-2.0-flash",
            "model_name": "Gemini 2.0 Flash",
            "is_free": true
        }
        """
        provider_slug = request.data.get('provider')
        capability = request.data.get('capability')
        model_id = request.data.get('model_id')
        model_name = request.data.get('model_name')
        is_free = request.data.get('is_free', False)
        
        try:
            provider = AIProvider.objects.get(slug=provider_slug, is_active=True)
            
            # Save selected model
            model, created = AIModel.objects.update_or_create(
                provider=provider,
                capability=capability,
                defaults={
                    'model_id': model_id,
                    'display_name': model_name,
                    'is_free': is_free,
                    'is_active': True
                }
            )
            
            # Clear cache
            from src.ai.utils.cache import AICacheManager
            AICacheManager.invalidate_models()
            
            return APIResponse.success(
                message="Model selected successfully",
                data={
                    'provider': provider_slug,
                    'capability': capability,
                    'model_id': model.model_id,
                    'model_name': model.display_name,
                    'created': created
                }
            )
            
        except Exception as e:
            return APIResponse.error(
                message=f"Error: {str(e)}",
                status_code=500
            )

4️⃣ Management Command (برای Import)
python# Backend/src/ai/management/commands/import_providers.py

from django.core.management.base import BaseCommand
from src.ai.models import AIProvider

class Command(BaseCommand):
    help = 'Import AI providers from configuration'
    
    PROVIDERS = [
        {
            'slug': 'openrouter',
            'name': 'OpenRouter',
            'display_name': 'OpenRouter (60+ Providers)',
            'provider_class': 'src.ai.providers.openrouter.OpenRouterProvider',
            'api_base_url': 'https://openrouter.ai/api/v1',
            'website': 'https://openrouter.ai',
            'capabilities': {
                'chat': {'supported': True, 'has_dynamic_models': True},
                'content': {'supported': True, 'has_dynamic_models': True},
                'image': {'supported': True, 'has_dynamic_models': True},
                'audio': {'supported': True, 'has_dynamic_models': True},
            },
            'logo_url': 'https://openrouter.ai/logo.png',
            'sort_order': 1
        },
        # ... 49 more providers
    ]
    
    def handle(self, *args, **options):
        for data in self.PROVIDERS:
            provider, created = AIProvider.objects.update_or_create(
                slug=data['slug'],
                defaults=data
            )
            
            action = 'Created' if created else 'Updated'
            self.stdout.write(
                self.style.SUCCESS(f'{action}: {provider.display_name}')
            )
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully imported {len(self.PROVIDERS)} providers')
        )

# Run: python manage.py import_providers

5️⃣ Next.js API Integration
typescript// frontend/lib/api/ai.ts

export const aiAPI = {
  // ⭐ یک API برای dashboard کامل
  async getDashboard() {
    const response = await fetch('/api/admin/ai/dashboard/')
    return response.json()
  },

  // Browse مدل‌ها
  async browseModels(provider: string, capability: string) {
    const response = await fetch(
      `/api/admin/ai/models/browse/?provider=${provider}&capability=${capability}`
    )
    return response.json()
  },

  // انتخاب مدل
  async selectModel(data: {
    provider: string
    capability: string
    model_id: string
    model_name: string
    is_free: boolean
  }) {
    const response = await fetch('/api/admin/ai/models/select/', {
      method: 'POST',
      body: JSON.stringify(data)
    })
    return response.json()
  }
}

📊 مقایسه نهایی:
ویژگیروش قبلیروش بهینهProvider ManagementHardcodeDynamic از DBAuto-discoveryمحدودکاملScalability10-20 provider100+ providerFrontend APIچند endpointیک unified APICache Strategyسادهچند لایهDeploymentنیاز به code changeفقط DB/configPerformanceمتوسطبهینه

✅ جمع‌بندی نهایی:
این معماری:

✅ Dynamic - هیچ hardcode نداره
✅ Scalable - آماده 100+ provider
✅ Fast - multi-layer caching
✅ Clean - unified API برای frontend
✅ Professional - production-ready

