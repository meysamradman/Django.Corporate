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
        
        if api_key.startswith('gAAAAAB'):
            return api_key
        
        try:
            key = cls._get_encryption_key()
            fernet = Fernet(key)
            encrypted = fernet.encrypt(api_key.strip().encode())
            return encrypted.decode()
        except Exception as e:
            raise ValidationError(f"API key encryption error: {str(e)}")
    
    @classmethod
    def decrypt_key(cls, encrypted_key: str) -> str:
        if not encrypted_key:
            raise ValidationError("API key is required.")
        
        try:
            key = cls._get_encryption_key()
            fernet = Fernet(key)
            decrypted = fernet.decrypt(encrypted_key.encode())
            return decrypted.decode()
        except Exception as e:
            raise ValidationError(f"API key decryption error: {str(e)}")


class CacheMixin:
    CACHE_TIMEOUT = 300
    
    def _get_cache_key(self, suffix=''):
        model_name = self.__class__.__name__.lower()
        pk = getattr(self, 'slug', None) or getattr(self, 'id', 'unknown')
        return f"ai_{model_name}_{pk}{f'_{suffix}' if suffix else ''}"
    
    def clear_cache(self):
        cache_key = self._get_cache_key()
        cache.delete(cache_key)
        
        if hasattr(self, 'provider') and self.provider:
            AICacheManager.invalidate_provider(self.provider.slug)
            AICacheManager.invalidate_models_by_provider(self.provider.slug)
    
    @classmethod
    def clear_all_cache(cls, pattern=''):
        if cls.__name__ == 'AIModel':
            AICacheManager.invalidate_models()
        elif cls.__name__ == 'AIProvider':
            AICacheManager.invalidate_providers()


class AIProvider(BaseModel, EncryptedAPIKeyMixin, CacheMixin):
    """
    AI Provider model following DJANGO_MODEL_STANDARDS.md conventions.
    Field ordering: Content → Flags → Configuration → Statistics
    """
    # 2. Primary Content Fields
    name = models.CharField(
        max_length=100,
        unique=True,
        db_index=True,
        verbose_name="Provider Name",
        help_text="Unique provider identifier (e.g., 'openai', 'gemini')"
    )
    slug = models.SlugField(
        max_length=100,
        unique=True,
        db_index=True,
        allow_unicode=True,
        verbose_name="URL Slug",
        help_text="URL-friendly identifier for the provider"
    )
    display_name = models.CharField(
        max_length=150,
        verbose_name="Display Name",
        help_text="Human-readable provider name"
    )
    
    # 3. Description Fields
    description = models.TextField(
        blank=True,
        verbose_name="Description",
        help_text="Provider description"
    )
    website = models.URLField(
        blank=True,
        verbose_name="Website",
        help_text="Provider website URL"
    )
    api_base_url = models.URLField(
        blank=True,
        verbose_name="API Base URL",
        help_text="Base URL for API requests"
    )
    
    # 4. Boolean Flags
    allow_personal_keys = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name="Allow Personal Keys",
        help_text="Whether admins can use personal API keys"
    )
    allow_shared_for_normal_admins = models.BooleanField(
        default=False,
        db_index=True,
        verbose_name="Allow Shared for Normal Admins",
        help_text="Whether normal admins can use shared API key"
    )
    
    # Configuration & Security
    shared_api_key = models.TextField(
        blank=True,
        verbose_name="Shared API Key (Encrypted)",
        help_text="Encrypted shared API key for the provider"
    )
    config = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Configuration",
        help_text="Additional provider configuration"
    )
    
    # Statistics
    total_requests = models.BigIntegerField(
        default=0,
        verbose_name="Total Requests",
        help_text="Total number of API requests made"
    )
    last_used_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Last Used",
        help_text="Date and time when provider was last used"
    )
    sort_order = models.IntegerField(
        default=0,
        db_index=True,
        verbose_name="Sort Order",
        help_text="Order for displaying providers"
    )
    
    class Meta(BaseModel.Meta):
        db_table = 'ai_providers'
        verbose_name = "AI Provider"
        verbose_name_plural = "AI Providers"
        ordering = ['sort_order', 'name']
        indexes = [
            # Composite indexes for common query patterns
            models.Index(fields=['slug', 'is_active']),
            models.Index(fields=['is_active', 'sort_order']),
            models.Index(fields=['allow_shared_for_normal_admins', 'is_active']),
            # Note: name and slug already have db_index=True and unique=True (automatic indexes)
            # Note: BaseModel already provides indexes for public_id, is_active, created_at
        ]
    
    def __str__(self):
        return self.display_name
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        
        if self.shared_api_key:
            self.shared_api_key = self.encrypt_key(self.shared_api_key)
        
        super().save(*args, **kwargs)
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
        cache_key = AICacheKeys.provider(slug)
        provider = cache.get(cache_key)
        
        if provider is None:
            try:
                provider = cls.objects.get(slug=slug, is_active=True)
                cache.set(cache_key, provider, cls.CACHE_TIMEOUT)
            except cls.DoesNotExist:
                return None
        
        return provider


class AIModel(BaseModel, CacheMixin):
    """
    AI Model model following DJANGO_MODEL_STANDARDS.md conventions.
    Field ordering: Content → Relationships → Configuration → Statistics
    """
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
    
    # 2. Primary Content Fields
    name = models.CharField(
        max_length=150,
        db_index=True,
        verbose_name="Model Name",
        help_text="Model identifier name"
    )
    model_id = models.CharField(
        max_length=200,
        verbose_name="Model ID",
        help_text="API model identifier (e.g., 'gpt-4', 'claude-3.5-sonnet')"
    )
    display_name = models.CharField(
        max_length=200,
        verbose_name="Display Name",
        help_text="Human-readable model name"
    )
    
    # 3. Description Fields
    description = models.TextField(
        blank=True,
        verbose_name="Description",
        help_text="Model description"
    )
    
    # 5. Relationships
    provider = models.ForeignKey(
        AIProvider,
        on_delete=models.CASCADE,
        related_name='models',
        db_index=True,
        verbose_name="Provider",
        help_text="AI provider that owns this model"
    )
    
    # Configuration
    capabilities = models.JSONField(
        default=list,
        verbose_name="Capabilities",
        help_text="List of model capabilities"
    )
    config = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Configuration",
        help_text="Additional model configuration"
    )
    
    # Pricing & Limits
    pricing_input = models.DecimalField(
        max_digits=10,
        decimal_places=6,
        null=True,
        blank=True,
        verbose_name="Input Price ($/1M tokens)",
        help_text="Price per million input tokens"
    )
    pricing_output = models.DecimalField(
        max_digits=10,
        decimal_places=6,
        null=True,
        blank=True,
        verbose_name="Output Price ($/1M tokens)",
        help_text="Price per million output tokens"
    )
    max_tokens = models.IntegerField(
        null=True,
        blank=True,
        verbose_name="Max Tokens",
        help_text="Maximum tokens per request"
    )
    context_window = models.IntegerField(
        null=True,
        blank=True,
        verbose_name="Context Window",
        help_text="Maximum context window size in tokens"
    )
    
    # Statistics
    total_requests = models.BigIntegerField(
        default=0,
        verbose_name="Total Requests",
        help_text="Total number of requests made to this model"
    )
    last_used_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Last Used",
        help_text="Date and time when model was last used"
    )
    sort_order = models.IntegerField(
        default=0,
        db_index=True,
        verbose_name="Sort Order",
        help_text="Order for displaying models within provider"
    )
    
    class Meta(BaseModel.Meta):
        db_table = 'ai_models'
        verbose_name = "AI Model"
        verbose_name_plural = "AI Models"
        ordering = ['provider', 'sort_order', 'name']
        unique_together = ['provider', 'model_id']
        indexes = [
            # Composite indexes for common query patterns
            models.Index(fields=['provider', 'is_active', 'sort_order']),
            # Note: name already has db_index=True (automatic index)
            # Note: BaseModel already provides indexes for public_id, is_active, created_at
        ]
    
    def __str__(self):
        return f"{self.provider.name} - {self.display_name}"
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if self.provider and self.provider.slug:
            AICacheManager.invalidate_models_by_provider(self.provider.slug)
            AICacheManager.invalidate_models()
    
    def increment_usage(self):
        self.total_requests += 1
        self.last_used_at = timezone.now()
        self.save(update_fields=['total_requests', 'last_used_at'])
    
    def has_capability(self, capability: str) -> bool:
        return capability in self.capabilities
    
    def get_api_config(self, admin):
        from src.ai.utils.state_machine import ModelAccessState
        
        state = ModelAccessState.calculate(self.provider, self, admin)
        
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
        from src.ai.utils.state_machine import ModelAccessState
        
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
        cache_key = AICacheKeys.models_by_provider(provider_slug, capability)
        models_list = cache.get(cache_key)
        
        if models_list is None:
            query = cls.objects.filter(
                provider__slug=provider_slug,
                provider__is_active=True,
                is_active=True
            ).select_related('provider').order_by('sort_order')
            
            if capability:
                models_list = [m for m in query if capability in m.capabilities]
            else:
                models_list = list(query)
            
            cache.set(cache_key, models_list, cls.CACHE_TIMEOUT)
        
        return models_list
    
    @classmethod
    def get_active_models_bulk(cls, provider_slugs: list[str]):
        cache_key = AICacheKeys.models_bulk(provider_slugs)
        result = cache.get(cache_key)
        
        if result is None:
            models = cls.objects.filter(
                provider__slug__in=provider_slugs,
                provider__is_active=True,
                is_active=True
            ).select_related('provider').order_by('provider__sort_order', 'sort_order')
            
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


class AdminProviderSettings(BaseModel, EncryptedAPIKeyMixin):
    """
    Admin provider settings model following DJANGO_MODEL_STANDARDS.md conventions.
    Field ordering: Relationships → Configuration → Usage Limits → Statistics
    """
    # 5. Relationships
    admin = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='ai_provider_settings',
        db_index=True,
        verbose_name="Admin User",
        help_text="Admin user these settings belong to"
    )
    provider = models.ForeignKey(
        AIProvider,
        on_delete=models.CASCADE,
        related_name='admin_settings',
        db_index=True,
        verbose_name="Provider",
        help_text="AI provider these settings are for"
    )
    
    # Configuration
    personal_api_key = models.TextField(
        blank=True,
        verbose_name="Personal API Key (Encrypted)",
        help_text="Encrypted personal API key for this admin"
    )
    use_shared_api = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name="Use Shared API",
        help_text="Whether to use shared API key instead of personal"
    )
    
    # Usage Limits
    monthly_limit = models.IntegerField(
        default=1000,
        verbose_name="Monthly Limit",
        help_text="Monthly request limit for this admin"
    )
    monthly_usage = models.IntegerField(
        default=0,
        verbose_name="Monthly Usage",
        help_text="Current monthly usage count"
    )
    
    # Statistics
    total_requests = models.BigIntegerField(
        default=0,
        verbose_name="Total Requests",
        help_text="Total number of requests made by this admin"
    )
    last_used_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Last Used",
        help_text="Date and time when provider was last used by this admin"
    )
    
    class Meta(BaseModel.Meta):
        db_table = 'ai_admin_provider_settings'
        verbose_name = "Admin Provider Settings"
        verbose_name_plural = "Admin Provider Settings"
        ordering = ['-created_at']
        unique_together = ['admin', 'provider']
        indexes = [
            # Composite indexes for common query patterns
            models.Index(fields=['admin', 'provider']),
            models.Index(fields=['admin', 'is_active']),
            models.Index(fields=['use_shared_api', 'is_active']),
            # Note: BaseModel already provides indexes for public_id, is_active, created_at
        ]
    
    def __str__(self):
        admin_name = getattr(self.admin, 'get_full_name', lambda: str(self.admin))()
        return f"{admin_name} - {self.provider.display_name}"
    
    def save(self, *args, **kwargs):
        if self.personal_api_key:
            self.personal_api_key = self.encrypt_key(self.personal_api_key)
        
        super().save(*args, **kwargs)
        if self.admin_id:
            AICacheManager.invalidate_admin_settings(self.admin_id)
    
    def get_personal_api_key(self) -> str:

        if not self.personal_api_key:
            return ''
        return self.decrypt_key(self.personal_api_key)
    
    def get_api_key(self) -> str:
        is_super = getattr(self.admin, 'is_superuser', False) or getattr(self.admin, 'is_admin_full', False)
        
        if self.use_shared_api:
            if not is_super:
                if not self.provider.allow_shared_for_normal_admins:
                    raise ValidationError(
                        f"Shared API is not allowed for {self.provider.display_name}."
                    )
            
            shared_key = self.provider.get_shared_api_key()
            if not shared_key:
                raise ValidationError(
                    f"Shared API key is not set for {self.provider.display_name}."
                )
            
            return shared_key
        else:
            personal_key = self.get_personal_api_key()
            if not personal_key:
                raise ValidationError(
                    "Personal API key is not set."
                )
            
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
    
    def get_usage_info(self):

        return {
            "current": self.monthly_usage,
            "limit": self.monthly_limit
        }
    
    def get_api_config(self, admin):
        from src.ai.utils.state_machine import ModelAccessState
        
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
        from src.ai.utils.state_machine import ModelAccessState
        
        state = ModelAccessState.calculate(self.provider, None, admin)
        
        return {
            "can_use": state in [ModelAccessState.AVAILABLE_SHARED, ModelAccessState.AVAILABLE_PERSONAL],
            "can_configure": self.provider.allow_personal_keys
        }
