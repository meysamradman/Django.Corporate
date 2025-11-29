"""
✅ Dynamic AI Provider System - Scalable for 40+ Models (2025)

Performance Optimizations:
- Redis Cache with 5min TTL
- DB Indexes on critical fields
- Batch queries for multiple models
- Lazy loading for large datasets

Security:
- Fernet Encryption for API keys
- Field-level encryption
- Secure key storage

Scalability:
- No code changes needed for new providers
- JSONField for flexible configuration
- Supports unlimited models per provider
"""
from django.db import models
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.conf import settings
from django.utils.text import slugify
from django.utils import timezone
from cryptography.fernet import Fernet
import base64
import hashlib

from src.core.models.base import BaseModel


# ========================================
# 🔐 Encryption Mixin (DRY)
# ========================================

class EncryptedAPIKeyMixin:
    """
    Mixin for encrypting/decrypting API keys
    استفاده مجدد در چندین مدل بدون تکرار کد
    """
    
    @staticmethod
    def _get_encryption_key():
        """Get encryption key from SECRET_KEY"""
        secret = settings.SECRET_KEY.encode()
        key = hashlib.sha256(secret).digest()
        return base64.urlsafe_b64encode(key)
    
    @classmethod
    def encrypt_key(cls, api_key: str) -> str:
        """Encrypt API key"""
        if not api_key or not api_key.strip():
            return ''
        
        # Already encrypted?
        if api_key.startswith('gAAAAAB'):
            return api_key
        
        try:
            key = cls._get_encryption_key()
            fernet = Fernet(key)
            encrypted = fernet.encrypt(api_key.strip().encode())
            return encrypted.decode()
        except Exception as e:
            raise ValidationError(f"خطا در رمزنگاری API key: {str(e)}")
    
    @classmethod
    def decrypt_key(cls, encrypted_key: str) -> str:
        """Decrypt API key"""
        if not encrypted_key:
            raise ValidationError("API key خالی است")
        
        try:
            key = cls._get_encryption_key()
            fernet = Fernet(key)
            decrypted = fernet.decrypt(encrypted_key.encode())
            return decrypted.decode()
        except Exception as e:
            raise ValidationError(f"خطا در رمزگشایی API key: {str(e)}")


# ========================================
# 🔄 Cache Mixin (DRY)
# ========================================

class CacheMixin:
    """
    Mixin for Redis caching
    استفاده مجدد برای همه مدل‌های AI
    """
    CACHE_TIMEOUT = 300  # 5 minutes
    
    def _get_cache_key(self, suffix=''):
        """Generate cache key"""
        model_name = self.__class__.__name__.lower()
        pk = getattr(self, 'slug', None) or getattr(self, 'id', 'unknown')
        return f"ai_{model_name}_{pk}{f'_{suffix}' if suffix else ''}"
    
    def clear_cache(self):
        """Clear this instance cache"""
        cache_key = self._get_cache_key()
        cache.delete(cache_key)
    
    @classmethod
    def clear_all_cache(cls, pattern=''):
        """Clear all cache for this model"""
        try:
            cache.delete_pattern(f"ai_{cls.__name__.lower()}_*{pattern}*")
        except (AttributeError, NotImplementedError):
            # Fallback if delete_pattern not available
            pass


# ========================================
# 📦 AIProvider Model
# ========================================

class AIProvider(BaseModel, EncryptedAPIKeyMixin, CacheMixin):
    """
    ✅ Dynamic AI Provider - Database-Driven
    
    مدیر سیستم می‌تونه از پنل Provider جدید اضافه کنه:
    - OpenAI, Anthropic, Google, OpenRouter, DeepSeek, Groq, ...
    - بدون تغییر کد یا Migration
    """
    
    name = models.CharField(
        max_length=100,
        unique=True,
        db_index=True,
        verbose_name="Provider Name"
    )
    
    slug = models.SlugField(
        max_length=100,
        unique=True,
        db_index=True,
        verbose_name="Slug"
    )
    
    display_name = models.CharField(
        max_length=150,
        verbose_name="Display Name"
    )
    
    website = models.URLField(
        blank=True,
        verbose_name="Website"
    )
    
    api_base_url = models.URLField(
        blank=True,
        verbose_name="API Base URL"
    )
    
    description = models.TextField(
        blank=True,
        verbose_name="Description"
    )
    
    # Shared API Key (encrypted)
    shared_api_key = models.TextField(
        blank=True,
        verbose_name="Shared API Key (Encrypted)"
    )
    
    # Permissions
    allow_personal_keys = models.BooleanField(
        default=True,
        verbose_name="Allow Personal Keys"
    )
    
    allow_shared_for_normal_admins = models.BooleanField(
        default=False,
        db_index=True,
        verbose_name="Allow Shared for Normal Admins"
    )
    
    # Configuration (JSONField for flexibility)
    config = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Configuration"
    )
    
    # Statistics
    total_requests = models.BigIntegerField(
        default=0,
        verbose_name="Total Requests"
    )
    
    last_used_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Last Used"
    )
    
    sort_order = models.IntegerField(
        default=0,
        db_index=True,
        verbose_name="Sort Order"
    )
    
    class Meta(BaseModel.Meta):
        verbose_name = "AI Provider"
        verbose_name_plural = "AI Providers"
        ordering = ['sort_order', 'name']
        db_table = 'ai_providers'
        indexes = [
            *BaseModel.Meta.indexes,
            models.Index(fields=['slug', 'is_active']),
            models.Index(fields=['is_active', 'sort_order']),
            models.Index(fields=['allow_shared_for_normal_admins']),
        ]
    
    def __str__(self):
        return self.display_name
    
    def save(self, *args, **kwargs):
        # Auto-generate slug
        if not self.slug:
            self.slug = slugify(self.name)
        
        # Encrypt API key
        if self.shared_api_key:
            self.shared_api_key = self.encrypt_key(self.shared_api_key)
        
        super().save(*args, **kwargs)
        self.clear_cache()
        self.clear_all_cache('active')  # Clear "active providers" cache
    
    def get_shared_api_key(self) -> str:
        """Get decrypted shared API key"""
        if not self.shared_api_key:
            return ''
        return self.decrypt_key(self.shared_api_key)
    
    def increment_usage(self):
        """Increment usage count"""
        self.total_requests += 1
        self.last_used_at = timezone.now()
        self.save(update_fields=['total_requests', 'last_used_at'])
    
    @classmethod
    def get_active_providers(cls):
        """Get all active providers (cached)"""
        cache_key = "ai_providers_active"
        providers = cache.get(cache_key)
        
        if providers is None:
            providers = list(
                cls.objects.filter(is_active=True)
                .order_by('sort_order')
                .only('id', 'name', 'slug', 'display_name', 'is_active', 'allow_shared_for_normal_admins')
            )
            cache.set(cache_key, providers, cls.CACHE_TIMEOUT)
        
        return providers
    
    @classmethod
    def get_provider_by_slug(cls, slug: str):
        """Get provider by slug (cached)"""
        cache_key = f"ai_provider_{slug}"
        provider = cache.get(cache_key)
        
        if provider is None:
            try:
                provider = cls.objects.get(slug=slug, is_active=True)
                cache.set(cache_key, provider, cls.CACHE_TIMEOUT)
            except cls.DoesNotExist:
                return None
        
        return provider


# ========================================
# 🤖 AIModel Model
# ========================================

class AIModel(BaseModel, CacheMixin):
    """
    ✅ Dynamic AI Model - Database-Driven
    
    هر Provider می‌تونه چندین Model داشته باشه:
    - OpenAI: gpt-4o, dall-e-3, whisper, tts-1
    - Anthropic: claude-3-opus, claude-3-sonnet
    - Google: gemini-pro, gemini-flash
    """
    
    # Capability choices (extensible)
    CAPABILITY_CHOICES = [
        ('chat', 'Chat / Text Generation'),
        ('image', 'Image Generation'),
        ('audio', 'Audio Generation'),
        ('speech_to_text', 'Speech to Text'),
        ('text_to_speech', 'Text to Speech'),
        ('code', 'Code Generation'),
        ('embedding', 'Embeddings'),
        ('vision', 'Vision / Image Understanding'),
    ]
    
    provider = models.ForeignKey(
        AIProvider,
        on_delete=models.CASCADE,
        related_name='models',
        db_index=True,
        verbose_name="Provider"
    )
    
    name = models.CharField(
        max_length=150,
        db_index=True,
        verbose_name="Model Name"
    )
    
    model_id = models.CharField(
        max_length=200,
        verbose_name="Model ID"
    )
    
    display_name = models.CharField(
        max_length=200,
        verbose_name="Display Name"
    )
    
    description = models.TextField(
        blank=True,
        verbose_name="Description"
    )
    
    # Capabilities (JSONField for flexibility)
    capabilities = models.JSONField(
        default=list,
        verbose_name="Capabilities"
    )
    
    # Pricing (optional)
    pricing_input = models.DecimalField(
        max_digits=10,
        decimal_places=6,
        null=True,
        blank=True,
        verbose_name="Input Price ($/1M tokens)"
    )
    
    pricing_output = models.DecimalField(
        max_digits=10,
        decimal_places=6,
        null=True,
        blank=True,
        verbose_name="Output Price ($/1M tokens)"
    )
    
    # Limits
    max_tokens = models.IntegerField(
        null=True,
        blank=True,
        verbose_name="Max Tokens"
    )
    
    context_window = models.IntegerField(
        null=True,
        blank=True,
        verbose_name="Context Window"
    )
    
    # Configuration (JSONField for flexibility)
    config = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Configuration"
    )
    
    # Statistics
    total_requests = models.BigIntegerField(
        default=0,
        verbose_name="Total Requests"
    )
    
    last_used_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Last Used"
    )
    
    sort_order = models.IntegerField(
        default=0,
        db_index=True,
        verbose_name="Sort Order"
    )
    
    class Meta(BaseModel.Meta):
        verbose_name = "AI Model"
        verbose_name_plural = "AI Models"
        ordering = ['provider', 'sort_order', 'name']
        db_table = 'ai_models'
        unique_together = ['provider', 'model_id']
        indexes = [
            *BaseModel.Meta.indexes,
            models.Index(fields=['provider', 'is_active']),
            models.Index(fields=['is_active', 'sort_order']),
            models.Index(fields=['name']),
        ]
    
    def __str__(self):
        return f"{self.provider.name} - {self.display_name}"
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.clear_cache()
        self.clear_all_cache(f"provider_{self.provider.slug}")
    
    def increment_usage(self):
        """Increment usage count"""
        self.total_requests += 1
        self.last_used_at = timezone.now()
        self.save(update_fields=['total_requests', 'last_used_at'])
    
    def has_capability(self, capability: str) -> bool:
        """Check if model has capability"""
        return capability in self.capabilities
    
    def get_api_config(self, admin):
        """
        ✅ Computed Field: API configuration for this model/admin
        
        Returns:
            {
                "current_source": "shared" | "personal" | "none",
                "shared": {"available": bool, "has_access": bool},
                "personal": {"available": bool, "configured": bool}
            }
        """
        from src.ai.services.state_machine import ModelAccessState
        
        state = ModelAccessState.calculate(self.provider, self, admin)
        
        # Check if admin has personal settings
        has_personal_settings = False
        if admin:
            has_personal_settings = AdminProviderSettings.objects.filter(
                admin=admin,
                provider=self.provider,
                is_active=True,
                personal_api_key__isnull=False
            ).exclude(personal_api_key='').exists()
        
        return {
            "current_source": (
                "shared" if state == ModelAccessState.AVAILABLE_SHARED
                else "personal" if state == ModelAccessState.AVAILABLE_PERSONAL
                else "none"
            ),
            "shared": {
                "available": self.provider.allow_shared_for_normal_admins,
                "has_access": state == ModelAccessState.AVAILABLE_SHARED,
            },
            "personal": {
                "available": self.provider.allow_personal_keys,
                "configured": has_personal_settings
            }
        }
    
    def get_actions(self, admin):
        """
        ✅ Computed Field: Actions available for this model/admin
        
        Returns:
            {
                "can_use": bool,
                "can_configure": bool
            }
        """
        from src.ai.services.state_machine import ModelAccessState
        
        state = ModelAccessState.calculate(self.provider, self, admin)
        
        return {
            "can_use": state in [ModelAccessState.AVAILABLE_SHARED, ModelAccessState.AVAILABLE_PERSONAL],
            "can_configure": self.provider.allow_personal_keys
        }
    
    def get_usage_info(self, admin):
        """
        ✅ Computed Field: Usage information for this admin
        
        Returns:
            {"current": int, "limit": int}
        """
        if not admin:
            return {"current": 0, "limit": 0}
        
        try:
            settings = AdminProviderSettings.objects.get(
                admin=admin,
                provider=self.provider,
                is_active=True
            )
            return {
                "current": settings.monthly_usage,
                "limit": settings.monthly_limit
            }
        except AdminProviderSettings.DoesNotExist:
            return {"current": 0, "limit": 0}
    
    @classmethod
    def get_models_by_provider(cls, provider_slug: str, capability: str | None = None):
        """Get models by provider (cached)"""
        cache_key = f"ai_models_provider_{provider_slug}_{capability or 'all'}"
        models_list = cache.get(cache_key)
        
        if models_list is None:
            query = cls.objects.filter(
                provider__slug=provider_slug,
                provider__is_active=True,
                is_active=True
            ).select_related('provider').order_by('sort_order')
            
            if capability:
                # JSONField filter
                models_list = [m for m in query if capability in m.capabilities]
            else:
                models_list = list(query)
            
            cache.set(cache_key, models_list, cls.CACHE_TIMEOUT)
        
        return models_list
    
    @classmethod
    def get_active_models_bulk(cls, provider_slugs: list[str]):
        """
        ✅ Batch query for multiple providers - Optimized for 40+ models
        
        Args:
            provider_slugs: List of provider slugs
        
        Returns:
            Dict[str, List[AIModel]]: Models grouped by provider slug
        """
        cache_key = f"ai_models_bulk_{'_'.join(sorted(provider_slugs))}"
        result = cache.get(cache_key)
        
        if result is None:
            # Single query for all providers
            models = cls.objects.filter(
                provider__slug__in=provider_slugs,
                provider__is_active=True,
                is_active=True
            ).select_related('provider').order_by('provider__sort_order', 'sort_order')
            
            # Group by provider
            result = {}
            for model in models:
                provider_slug = model.provider.slug
                if provider_slug not in result:
                    result[provider_slug] = []
                result[provider_slug].append(model)
            
            cache.set(cache_key, result, cls.CACHE_TIMEOUT)
        
        return result
    
    @classmethod
    def get_models_by_capability(cls, capability: str, include_inactive: bool = True):
        """
        Get all models with capability (cached)
        
        Args:
            capability: Capability to filter by (chat, content, image, audio, etc.)
            include_inactive: If True, include inactive models (default: True for admin panel)
        
        Note:
            - 'content' capability returns the same models as 'chat' (both are text generation)
            - 'audio' capability includes models with 'audio', 'speech_to_text', or 'text_to_speech' capabilities
        """
        # ✅ برای "content" همان مدل‌های "chat" را برگردان (هر دو text generation هستند)
        if capability == 'content':
            capability = 'chat'
        
        # ✅ برای "audio" مدل‌هایی با 'audio', 'speech_to_text', یا 'text_to_speech' را برگردان
        audio_capabilities = ['audio', 'speech_to_text', 'text_to_speech'] if capability == 'audio' else None
        
        # Cache key (برای audio از 'audio' استفاده می‌کنیم نه audio_capabilities)
        cache_key = f"ai_models_capability_{capability}_{'all' if include_inactive else 'active'}"
        models_list = cache.get(cache_key)
        
        if models_list is None:
            query = cls.objects.filter(
                provider__is_active=True
            ).select_related('provider').order_by('provider__sort_order', 'sort_order')
            
            # ✅ اگر include_inactive=False باشد، فقط مدل‌های فعال را بگیر
            if not include_inactive:
                query = query.filter(is_active=True)
            
            # ✅ برای audio، مدل‌هایی با هر یک از audio capabilities را برگردان
            if audio_capabilities:
                models_list = [m for m in query if any(cap in m.capabilities for cap in audio_capabilities)]
            else:
                models_list = [m for m in query if capability in m.capabilities]
            
            cache.set(cache_key, models_list, cls.CACHE_TIMEOUT)
        
        return models_list


# ========================================
# ⚙️ AdminProviderSettings Model
# ========================================

class AdminProviderSettings(BaseModel, EncryptedAPIKeyMixin):
    """
    ✅ تنظیمات شخصی هر ادمین برای هر Provider
    
    جایگزین AdminAISettings - اما Dynamic!
    """
    
    admin = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='ai_provider_settings',
        db_index=True,
        verbose_name="Admin User"
    )
    
    provider = models.ForeignKey(
        AIProvider,
        on_delete=models.CASCADE,
        related_name='admin_settings',
        db_index=True,
        verbose_name="Provider"
    )
    
    # Personal API Key (encrypted)
    personal_api_key = models.TextField(
        blank=True,
        verbose_name="Personal API Key (Encrypted)"
    )
    
    use_shared_api = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name="Use Shared API"
    )
    
    # Usage Limits
    monthly_limit = models.IntegerField(
        default=1000,
        verbose_name="Monthly Limit"
    )
    
    monthly_usage = models.IntegerField(
        default=0,
        verbose_name="Monthly Usage"
    )
    
    # Statistics
    total_requests = models.BigIntegerField(
        default=0,
        verbose_name="Total Requests"
    )
    
    last_used_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Last Used"
    )
    
    class Meta(BaseModel.Meta):
        verbose_name = "Admin Provider Settings"
        verbose_name_plural = "Admin Provider Settings"
        ordering = ['-created_at']
        db_table = 'ai_admin_provider_settings'
        unique_together = ['admin', 'provider']
        indexes = [
            *BaseModel.Meta.indexes,
            models.Index(fields=['admin', 'provider']),
            models.Index(fields=['admin', 'is_active']),
            models.Index(fields=['use_shared_api']),
        ]
    
    def __str__(self):
        admin_name = getattr(self.admin, 'get_full_name', lambda: str(self.admin))()
        return f"{admin_name} - {self.provider.display_name}"
    
    def save(self, *args, **kwargs):
        # Encrypt personal API key
        if self.personal_api_key:
            self.personal_api_key = self.encrypt_key(self.personal_api_key)
        
        super().save(*args, **kwargs)
    
    def get_personal_api_key(self) -> str:
        """Get decrypted personal API key"""
        if not self.personal_api_key:
            return ''
        return self.decrypt_key(self.personal_api_key)
    
    def get_api_key(self) -> str:
        """
        Get API key based on settings (personal or shared)
        
        Logic:
        - Super Admin: آزاد (personal یا shared)
        - Normal Admin with use_shared_api=True: 
            - Check provider.allow_shared_for_normal_admins
            - If allowed → shared API
            - If not → ValidationError
        - Normal Admin with use_shared_api=False: 
            - Always personal API
        """
        # Check if super admin
        is_super = getattr(self.admin, 'is_superuser', False) or getattr(self.admin, 'is_admin_full', False)
        
        if self.use_shared_api:
            # Want to use shared API
            if not is_super:
                # Normal admin - check permission
                if not self.provider.allow_shared_for_normal_admins:
                    raise ValidationError(
                        f"استفاده از API مشترک {self.provider.display_name} برای ادمین‌های معمولی مجاز نیست"
                    )
            
            # Use shared API
            shared_key = self.provider.get_shared_api_key()
            if not shared_key:
                raise ValidationError(f"API Key مشترک {self.provider.display_name} تنظیم نشده است")
            return shared_key
        else:
            # Use personal API
            personal_key = self.get_personal_api_key()
            if not personal_key:
                raise ValidationError("API Key شخصی شما تنظیم نشده است")
            return personal_key
    
    def increment_usage(self):
        """Increment usage count"""
        self.total_requests += 1
        self.monthly_usage += 1
        self.last_used_at = timezone.now()
        self.save(update_fields=['total_requests', 'monthly_usage', 'last_used_at'])
    
    def has_reached_limit(self) -> bool:
        """Check if monthly limit reached"""
        return self.monthly_usage >= self.monthly_limit
    
    def reset_monthly_usage(self):
        """Reset monthly usage"""
        self.monthly_usage = 0
        self.save(update_fields=['monthly_usage'])
    
    # ========================================
    # ✅ Computed Fields (for API Response)
    # ========================================
    
    def get_usage_info(self):
        """
        Usage info برای API response
        فقط داده خام - بدون درصد
        """
        return {
            "current": self.monthly_usage,
            "limit": self.monthly_limit
        }
    
    def get_api_config(self, admin):
        """
        API config برای response
        محاسبه current_source, shared, personal
        """
        from src.ai.services.state_machine import ModelAccessState
        
        state = ModelAccessState.calculate(self.provider, None, admin)
        
        return {
            "current_source": (
                "shared" if state == ModelAccessState.AVAILABLE_SHARED
                else "personal" if state == ModelAccessState.AVAILABLE_PERSONAL
                else "none"
            ),
            "shared": {
                "available": self.provider.allow_shared_for_normal_admins,
                "has_access": state == ModelAccessState.AVAILABLE_SHARED,
            },
            "personal": {
                "available": self.provider.allow_personal_keys,
                "configured": bool(self.personal_api_key)
            }
        }
    
    def get_actions(self, admin):
        """
        Actions برای UI
        can_use, can_configure
        """
        from src.ai.services.state_machine import ModelAccessState
        
        state = ModelAccessState.calculate(self.provider, None, admin)
        
        return {
            "can_use": state in [ModelAccessState.AVAILABLE_SHARED, ModelAccessState.AVAILABLE_PERSONAL],
            "can_configure": self.provider.allow_personal_keys
        }
