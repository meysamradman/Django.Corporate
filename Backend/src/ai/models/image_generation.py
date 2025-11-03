from django.db import models
from django.core.exceptions import ValidationError
from src.core.models.base import BaseModel
from src.ai.messages.messages import AI_ERRORS
from cryptography.fernet import Fernet
from django.conf import settings
import base64
import hashlib
import os


class AIImageGeneration(BaseModel):
    """
    Model for storing AI provider settings and API keys.
    This model stores settings for all AI providers (image generation, content generation, etc.).
    Each provider (Gemini, OpenAI, etc.) has a single API key that can be used for multiple purposes.
    """
    
    PROVIDER_CHOICES = [
        ('gemini', 'Google Gemini'),
        ('openai', 'OpenAI DALL-E'),
        ('huggingface', 'Hugging Face Stable Diffusion'),
        ('deepseek', 'DeepSeek AI'),
    ]
    
    provider_name = models.CharField(
        max_length=50,
        choices=PROVIDER_CHOICES,
        unique=True,
        verbose_name="Provider Name"
    )
    
    api_key = models.TextField(
        verbose_name="API Key",
        help_text="API key for the provider (stored encrypted). This key can be used for both image and content generation.",
        blank=True,
        null=True
    )
    
    is_active = models.BooleanField(
        default=False,
        verbose_name="Active",
        help_text="Is this provider active? (for both image and content generation)"
    )
    
    config = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Additional Settings",
        help_text="Additional provider settings (e.g., model version, parameters) - Example: {'model_version': 'v1', 'max_resolution': '1024x1024'}"
    )
    
    last_used_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Last Used",
        help_text="Date and time of last API usage"
    )
    
    usage_count = models.IntegerField(
        default=0,
        verbose_name="Usage Count",
        help_text="Number of times this API has been used"
    )
    
    class Meta:
        verbose_name = "AI Provider Settings"
        verbose_name_plural = "AI Provider Settings"
        ordering = ['-created_at']
        db_table = 'ai_aiimageprovider'  # Keep old table name for migration compatibility
    
    def __str__(self):
        status = "Active" if self.is_active else "Inactive"
        return f"{self.get_provider_name_display()} - {status}"
    
    def save(self, *args, **kwargs):
        # Encrypt API key if new one is entered and not yet encrypted
        api_key_changed = False
        if self.api_key and self.api_key.strip():
            # Check if API key is already encrypted
            # Fernet encrypted strings always start with 'gAAAAAB'
            if not self.api_key.startswith('gAAAAAB'):
                # New API key entered, must be encrypted
                self.api_key = self._encrypt_api_key(self.api_key.strip())
                api_key_changed = True
        elif not self.api_key or not self.api_key.strip():
            # If API key is empty, set it to None
            self.api_key = None
            api_key_changed = True
        
        super().save(*args, **kwargs)
        
        # Clear cache if API key or is_active changed
        if api_key_changed or 'is_active' in kwargs.get('update_fields', []):
            self._clear_cache()
    
    def _get_encryption_key(self):
        """Get encryption key from SECRET_KEY"""
        secret = settings.SECRET_KEY.encode()
        # Use hash to create 32-byte key
        key = hashlib.sha256(secret).digest()
        # Convert to base64 for Fernet
        return base64.urlsafe_b64encode(key)
    
    def _encrypt_api_key(self, api_key: str) -> str:
        """Encrypt API key"""
        try:
            key = self._get_encryption_key()
            f = Fernet(key)
            encrypted = f.encrypt(api_key.encode())
            return encrypted.decode()
        except Exception as e:
            raise ValidationError(AI_ERRORS["api_key_encryption_error"].format(error=str(e)))
    
    def get_api_key(self) -> str:
        """Get decrypted API key"""
        try:
            key = self._get_encryption_key()
            f = Fernet(key)
            decrypted = f.decrypt(self.api_key.encode())
            return decrypted.decode()
        except Exception as e:
            raise ValidationError(AI_ERRORS["api_key_decryption_error"].format(error=str(e)))
    
    def activate(self):
        """Activate provider (after API key is entered)"""
        if not self.api_key:
            raise ValidationError(AI_ERRORS["api_key_required"])
        self.is_active = True
        self.save(update_fields=['is_active'])
        self._clear_cache()
    
    def deactivate(self):
        """Deactivate provider"""
        self.is_active = False
        self.save(update_fields=['is_active'])
        self._clear_cache()
    
    def increment_usage(self):
        """Increment usage count"""
        self.usage_count += 1
        from django.utils import timezone
        self.last_used_at = timezone.now()
        self.save(update_fields=['usage_count', 'last_used_at'])
        # Don't clear cache because usage_count changed but API key didn't
    
    def _clear_cache(self):
        """Clear provider cache"""
        from django.core.cache import cache
        cache_key = f'ai_provider_{self.provider_name}'
        cache.delete(cache_key)
    
    @classmethod
    def get_active_providers(cls):
        """Get list of active providers"""
        return cls.objects.filter(is_active=True)
    
    @classmethod
    def is_provider_available(cls, provider_name: str) -> bool:
        """Check if specific provider is active"""
        return cls.objects.filter(
            provider_name=provider_name,
            is_active=True
        ).exists()

