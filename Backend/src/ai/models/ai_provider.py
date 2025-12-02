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
from src.ai.utils.cache import AICacheKeys, AICacheManager


# ========================================
# Encryption Mixin (DRY)
# ========================================

class EncryptedAPIKeyMixin:

    @staticmethod
    def _get_encryption_key():
        secret = settings.SECRET_KEY.encode()
        key = hashlib.sha256(secret).digest()
        return base64.urlsafe_b64encode(key)
    
    @classmethod
    def encrypt_key(cls, api_key: str) -> str:
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
# Cache Mixin (DRY)
# ========================================

class CacheMixin:
    """
    Cache Mixin for AI models
    Uses AICacheManager for standardized cache operations
    """
    CACHE_TIMEOUT = 300  # 5 minutes
    
    def _get_cache_key(self, suffix=''):
        model_name = self.__class__.__name__.lower()
        pk = getattr(self, 'slug', None) or getattr(self, 'id', 'unknown')
        return f"ai_{model_name}_{pk}{f'_{suffix}' if suffix else ''}"
    
    def clear_cache(self):
        # ✅ Use Cache Manager for standardized cache invalidation
        cache_key = self._get_cache_key()
        cache.delete(cache_key)
        
        # Also clear related caches if needed
        if hasattr(self, 'provider') and self.provider:
            AICacheManager.invalidate_provider(self.provider.slug)
            AICacheManager.invalidate_models_by_provider(self.provider.slug)
    
    @classmethod
    def clear_all_cache(cls, pattern=''):
        # ✅ Use Cache Manager for standardized cache invalidation (Redis)
        if cls.__name__ == 'AIModel':
            AICacheManager.invalidate_models()
        elif cls.__name__ == 'AIProvider':
            AICacheManager.invalidate_providers()


# ========================================
# AIProvider Model
# ========================================

class AIProvider(BaseModel, EncryptedAPIKeyMixin, CacheMixin):

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
        # ✅ Use Cache Manager for standardized cache invalidation
        if self.slug:
            AICacheManager.invalidate_provider(self.slug)
    
    def get_shared_api_key(self) -> str:
        if not self.shared_api_key:
            return ''
        return self.decrypt_key(self.shared_api_key)
    
    def increment_usage(self):
        self.total_requests += 1
        self.last_used_at = timezone.now()
        self.save(update_fields=['total_requests', 'last_used_at'])
    
    @classmethod
    def get_active_providers(cls):
        # ✅ Use standardized cache key from AICacheKeys
        cache_key = AICacheKeys.providers_active()
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
        # ✅ Use standardized cache key from AICacheKeys
        cache_key = AICacheKeys.provider(slug)
        provider = cache.get(cache_key)
        
        if provider is None:
            try:
                provider = cls.objects.get(slug=slug, is_active=True)
                cache.set(cache_key, provider, cls.CACHE_TIMEOUT)
            except cls.DoesNotExist:
                return None
        
        return provider


# ========================================
# AIModel Model
# ========================================

class AIModel(BaseModel, CacheMixin):
    
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
        # ✅ Use Cache Manager for standardized cache invalidation
        if self.provider and self.provider.slug:
            AICacheManager.invalidate_models_by_provider(self.provider.slug)
            AICacheManager.invalidate_models()  # Also clear capability-based caches
    
    def increment_usage(self):
        self.total_requests += 1
        self.last_used_at = timezone.now()
        self.save(update_fields=['total_requests', 'last_used_at'])
    
    def has_capability(self, capability: str) -> bool:
        return capability in self.capabilities
    
    def get_api_config(self, admin):

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

        from src.ai.services.state_machine import ModelAccessState
        
        state = ModelAccessState.calculate(self.provider, self, admin)
        
        return {
            "can_use": state in [ModelAccessState.AVAILABLE_SHARED, ModelAccessState.AVAILABLE_PERSONAL],
            "can_configure": self.provider.allow_personal_keys
        }
    
    def get_usage_info(self, admin):

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
        # ✅ Use standardized cache key from AICacheKeys
        cache_key = AICacheKeys.models_by_provider(provider_slug, capability)
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
        # ✅ Use standardized cache key from AICacheKeys
        cache_key = AICacheKeys.models_bulk(provider_slugs)
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
        if capability == 'content':
            capability = 'chat'
        
        audio_capabilities = ['audio', 'speech_to_text', 'text_to_speech'] if capability == 'audio' else None
        
        # ✅ Use standardized cache key from AICacheKeys
        cache_key = AICacheKeys.models_by_capability(capability, include_inactive)
        models_list = cache.get(cache_key)
        
        if models_list is None:
            query = cls.objects.filter(
                provider__is_active=True
            ).select_related('provider').order_by('provider__sort_order', 'sort_order')
            
            if not include_inactive:
                query = query.filter(is_active=True)
            
            if audio_capabilities:
                models_list = [m for m in query if any(cap in m.capabilities for cap in audio_capabilities)]
            else:
                models_list = [m for m in query if capability in m.capabilities]
            
            cache.set(cache_key, models_list, cls.CACHE_TIMEOUT)
        
        return models_list


# ========================================
# AdminProviderSettings Model
# ========================================

class AdminProviderSettings(BaseModel, EncryptedAPIKeyMixin):
    
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
        if self.personal_api_key:
            self.personal_api_key = self.encrypt_key(self.personal_api_key)
        
        super().save(*args, **kwargs)
        # ✅ Use Cache Manager for standardized cache invalidation
        if self.admin_id:
            AICacheManager.invalidate_admin_settings(self.admin_id)
    
    def get_personal_api_key(self) -> str:

        if not self.personal_api_key:
            return ''
        return self.decrypt_key(self.personal_api_key)
    
    def get_api_key(self) -> str:

        import logging
        logger = logging.getLogger(__name__)
        
        is_super = getattr(self.admin, 'is_superuser', False) or getattr(self.admin, 'is_admin_full', False)
        admin_id = getattr(self.admin, 'id', 'unknown')
        provider_name = self.provider.display_name
        
        if self.use_shared_api:
            if not is_super:
                if not self.provider.allow_shared_for_normal_admins:
                    logger.error(f"❌ [API Key Selection] Admin {admin_id} cannot use shared API for {provider_name} (not allowed)")
                    raise ValidationError(
                        f"استفاده از API مشترک {self.provider.display_name} برای ادمین‌های معمولی مجاز نیست"
                    )
            
            shared_key = self.provider.get_shared_api_key()
            if not shared_key:
                logger.error(f"❌ [API Key Selection] Shared API key not set for {provider_name}")
                raise ValidationError(f"API Key مشترک {self.provider.display_name} تنظیم نشده است")
            
            logger.info(f"✅ [API Key Selection] Admin {admin_id} using SHARED API for {provider_name} (use_shared_api=True)")
            return shared_key
        else:
            personal_key = self.get_personal_api_key()
            if not personal_key:
                logger.error(f"❌ [API Key Selection] Personal API key not set for admin {admin_id}, provider {provider_name}")
                raise ValidationError("API Key شخصی شما تنظیم نشده است")
            
            logger.info(f"✅ [API Key Selection] Admin {admin_id} using PERSONAL API for {provider_name} (use_shared_api=False)")
            return personal_key
    
    def increment_usage(self):
        self.total_requests += 1
        self.monthly_usage += 1
        self.last_used_at = timezone.now()
        self.save(update_fields=['total_requests', 'monthly_usage', 'last_used_at'])
    
    def has_reached_limit(self) -> bool:
        return self.monthly_usage >= self.monthly_limit
    
    def reset_monthly_usage(self):
        self.monthly_usage = 0
        self.save(update_fields=['monthly_usage'])
    
    # ========================================
    # Computed Fields (for API Response)
    # ========================================
    
    def get_usage_info(self):

        return {
            "current": self.monthly_usage,
            "limit": self.monthly_limit
        }
    
    def get_api_config(self, admin):

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

        from src.ai.services.state_machine import ModelAccessState
        
        state = ModelAccessState.calculate(self.provider, None, admin)
        
        return {
            "can_use": state in [ModelAccessState.AVAILABLE_SHARED, ModelAccessState.AVAILABLE_PERSONAL],
            "can_configure": self.provider.allow_personal_keys
        }
