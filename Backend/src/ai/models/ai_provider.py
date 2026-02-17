from django.db import models
from django.db.models import Q
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
from src.ai.utils.cache_ttl import AICacheTTL
from src.ai.messages.messages import AI_ERRORS

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
            raise ValidationError(AI_ERRORS['api_key_encryption_error'].format(error=str(e)))
    
    @classmethod
    def decrypt_key(cls, encrypted_key: str) -> str:
        if not encrypted_key:
            raise ValidationError(AI_ERRORS['api_key_required'])
        
        try:
            key = cls._get_encryption_key()
            fernet = Fernet(key)
            decrypted = fernet.decrypt(encrypted_key.encode())
            return decrypted.decode()
        except Exception as e:
            raise ValidationError(AI_ERRORS['api_key_decryption_error'].format(error=str(e)))

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
    
    provider_class = models.CharField(
        max_length=200,
        blank=True,
        verbose_name="Provider Class Path",
        help_text="Python class path (e.g., src.ai.providers.openai.OpenAIProvider)"
    )
    capabilities = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Capabilities",
        help_text="Provider capabilities options"
    )
    
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
            models.Index(fields=['slug', 'is_active']),
            models.Index(fields=['is_active', 'sort_order']),
            models.Index(fields=['allow_shared_for_normal_admins', 'is_active']),
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
    
    def supports_capability(self, capability: str) -> bool:
        if not self.capabilities:
            return False
        return self.capabilities.get(capability, {}).get('supported', False)
    
    def has_dynamic_models(self, capability: str) -> bool:
        if not self.capabilities:
            return False
        return self.capabilities.get(capability, {}).get('has_dynamic_models', False)
    
    def get_static_models(self, capability: str) -> list:
        if not self.capabilities:
            return []
        return self.capabilities.get(capability, {}).get('models', [])
    
    def get_provider_instance(self, api_key: str, config: dict = None):
        
        if not self.provider_class:
            raise ValueError(AI_ERRORS['provider_class_not_configured'].format(provider_slug=self.slug))
        
        import importlib
        
        try:
            module_path, class_name = self.provider_class.rsplit('.', 1)
        except ValueError:
            raise ValueError(AI_ERRORS['provider_class_format_invalid'].format(provider_class=self.provider_class))
        
        try:
            module = importlib.import_module(module_path)
            provider_class = getattr(module, class_name)
        except (ImportError, AttributeError) as e:
            raise ImportError(
                AI_ERRORS['provider_class_import_failed'].format(provider_class=self.provider_class, error=str(e))
            )
        
        return provider_class(api_key=api_key, config=config or self.config)
    
    def increment_usage(self):
        self.total_requests += 1
        self.last_used_at = timezone.now()
        self.save(update_fields=['total_requests', 'last_used_at'])
    
    @classmethod
    def get_active_providers(cls):
        """
        Get active providers - don't cache Django model objects
        to avoid JSON serialization issues with Redis
        """
        providers = list(
            cls.objects.filter(is_active=True)
            .order_by('sort_order')
            .only('id', 'name', 'slug', 'display_name', 'is_active', 'allow_shared_for_normal_admins')
        )
        return providers
    
    @classmethod
    def get_provider_by_slug(cls, slug: str):
        """
        Get provider by slug - don't cache the Django model object
        to avoid JSON serialization issues with Redis
        """
        try:
            provider = cls.objects.get(slug=slug, is_active=True)
            return provider
        except cls.DoesNotExist:
            return None

class AIModelManager(models.Manager):

    def get_active_model(self, provider_slug: str, capability: str | None = None):
        import logging
        logger = logging.getLogger(__name__)

        cache_key = AICacheKeys.active_provider_model(provider_slug, capability)
        cached_model_id = cache.get(cache_key)

        if cached_model_id is not None:
            try:
                cached_model = self.select_related('provider').get(id=cached_model_id)
                if capability and (not cached_model.capabilities or capability not in cached_model.capabilities):
                    cache.delete(cache_key)
                else:
                    return cached_model
            except self.model.DoesNotExist:
                cache.delete(cache_key)

        queryset = (
            self.filter(
                provider__slug=provider_slug,
                provider__is_active=True,
                is_active=True,
            )
            .select_related('provider')
            .order_by('sort_order', 'id')
        )

        if capability:
            for model in queryset:
                if model.capabilities and capability in model.capabilities:
                    cache.set(cache_key, model.id, AICacheTTL.ACTIVE_MODEL)
                    return model
            logger.info(
                "[AIModel] No active model for provider=%s with capability=%s",
                provider_slug,
                capability,
            )
            return None

        model = queryset.first()
        if model:
            cache.set(cache_key, model.id, AICacheTTL.ACTIVE_MODEL)
        return model
    
    def deactivate_other_models(self, provider_id: int, capability: str, exclude_id: int = None):
        
        queryset = self.filter(
            provider_id=provider_id,
            is_active=True
        )
        
        if exclude_id:
            queryset = queryset.exclude(id=exclude_id)
        
        deactivated_count = 0
        for model in queryset:
            if capability in model.capabilities:
                if len(model.capabilities) == 1:
                    model.is_active = False
                    model.save(update_fields=['is_active', 'updated_at'])
                    deactivated_count += 1
                else:
                    model.capabilities.remove(capability)
                    model.save(update_fields=['capabilities', 'updated_at'])
                    deactivated_count += 1
        
        return deactivated_count

class AIModel(BaseModel, CacheMixin):
    
    CAPABILITY_CHOICES = [
        ('chat', 'Chat / Text Generation'),
        ('content', 'Content Generation'),
        ('image', 'Image Generation'),
        ('audio', 'Audio Generation'),
        ('speech_to_text', 'Speech to Text'),
        ('text_to_speech', 'Text to Speech'),
        ('code', 'Code Generation'),
        ('embedding', 'Embeddings'),
        ('vision', 'Vision / Image Understanding'),
    ]
    
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
    
    description = models.TextField(
        blank=True,
        verbose_name="Description",
        help_text="Model description"
    )
    
    provider = models.ForeignKey(
        AIProvider,
        on_delete=models.CASCADE,
        related_name='models',
        db_index=True,
        verbose_name="Provider",
        help_text="AI provider that owns this model"
    )
    
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
    
    objects = AIModelManager()
    
    class Meta(BaseModel.Meta):
        db_table = 'ai_models'
        verbose_name = "AI Model"
        verbose_name_plural = "AI Models"
        ordering = ['provider', 'sort_order', 'name']
        unique_together = ['provider', 'model_id']
        indexes = [
            models.Index(fields=['provider', 'is_active', 'sort_order']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['provider'],
                condition=Q(is_active=True),
                name='ai_unique_active_model_per_provider',
            )
        ]
    
    def __str__(self):
        return f"{self.provider.name} - {self.display_name}"
    
    def save(self, *args, **kwargs):
        
        is_new = self.pk is None
        was_active = False
        
        if not is_new:
            try:
                old_instance = AIModel.objects.get(pk=self.pk)
                was_active = old_instance.is_active
            except AIModel.DoesNotExist:
                pass
        
        if self.is_active and self.provider_id:
            # Enforce a single active model per provider.
            AIModel.objects.filter(
                provider_id=self.provider_id,
                is_active=True,
            ).exclude(pk=self.pk).update(is_active=False)
        
        super().save(*args, **kwargs)
        
        if self.provider and self.provider.slug:
            AICacheManager.invalidate_models_by_provider(self.provider.slug)
            AICacheManager.invalidate_models()

            # New provider-level cache
            cache.delete(AICacheKeys.active_provider_model(self.provider.slug))
            
            # Legacy per-capability cache keys (safe to clear)
            for capability in self.capabilities:
                cache.delete(AICacheKeys.active_provider_model(self.provider.slug, capability))
    
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
        # Don't cache Django model objects to avoid JSON serialization issues
        query = cls.objects.filter(
            provider__slug=provider_slug,
            provider__is_active=True,
            is_active=True
        ).select_related('provider').order_by('sort_order')
        
        if capability:
            models_list = [m for m in query if capability in m.capabilities]
        else:
            models_list = list(query)
        
        return models_list
    
    @classmethod
    def get_active_models_bulk(cls, provider_slugs: list[str]):
        """
        Get active models for multiple providers - don't cache to avoid JSON serialization issues
        """
        models = (
            cls.objects.filter(
                provider__slug__in=provider_slugs,
                provider__is_active=True,
                is_active=True
            )
            .select_related('provider')
            .order_by('provider__sort_order', 'sort_order', 'id')
        )
        
        result = {}
        for model in models:
            provider_slug = model.provider.slug
            if provider_slug not in result:
                result[provider_slug] = model
        
        return result
    
    @classmethod
    def get_models_by_capability(cls, capability: str, include_inactive: bool = True):
        audio_capabilities = ['audio', 'speech_to_text', 'text_to_speech'] if capability == 'audio' else None
        
        cache_key = AICacheKeys.models_by_capability(capability, include_inactive)
        cached_ids = cache.get(cache_key)
        
        if cached_ids is None:
            query = cls.objects.filter(
                provider__is_active=True
            ).select_related('provider').order_by('provider__sort_order', 'sort_order')
            
            if not include_inactive:
                query = query.filter(is_active=True)
            
            if audio_capabilities:
                models_list = [m for m in query if any(cap in m.capabilities for cap in audio_capabilities)]
            else:
                models_list = [m for m in query if capability in m.capabilities]
            
            cached_ids = [m.id for m in models_list]
            cache.set(cache_key, cached_ids, cls.CACHE_TIMEOUT)
            
            return models_list
        
        return list(cls.objects.filter(
            id__in=cached_ids
        ).select_related('provider').order_by('provider__sort_order', 'sort_order'))

class AdminProviderSettings(BaseModel, EncryptedAPIKeyMixin):
    
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
            models.Index(fields=['admin', 'provider']),
            models.Index(fields=['admin', 'is_active']),
            models.Index(fields=['use_shared_api', 'is_active']),
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
        # Scenario: switch decides source. shared key value is managed by super admin only.
        is_super = getattr(self.admin, 'is_superuser', False) or getattr(self.admin, 'is_admin_full', False)

        if self.use_shared_api:
            if not is_super and not self.provider.allow_shared_for_normal_admins:
                raise ValidationError(AI_ERRORS['settings_not_authorized'])

            shared_key = self.provider.get_shared_api_key()
            if not shared_key or not shared_key.strip():
                raise ValidationError(
                    AI_ERRORS['shared_api_key_not_set'].format(provider_name=self.provider.display_name)
                )
            return shared_key

        personal_key = self.get_personal_api_key()
        if personal_key and personal_key.strip():
            return personal_key

        raise ValidationError(AI_ERRORS['api_key_required'])
    
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
