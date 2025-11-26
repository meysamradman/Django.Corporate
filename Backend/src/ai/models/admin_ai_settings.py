from django.db import models
from django.core.exceptions import ValidationError
from src.core.models.base import BaseModel
from src.ai.messages.messages import AI_ERRORS
from cryptography.fernet import Fernet
from django.conf import settings
import base64
import hashlib


class AdminAISettings(BaseModel):
    """
    مدل برای ذخیره تنظیمات AI شخصی هر ادمین
    هر ادمین می‌تواند API Key شخصی خودش را داشته باشد
    """
    
    PROVIDER_CHOICES = [
        ('gemini', 'Google Gemini'),
        ('openai', 'OpenAI'),
        ('huggingface', 'Hugging Face'),  # ✅ اضافه شد
        ('deepseek', 'DeepSeek AI'),
        ('openrouter', 'OpenRouter (60+ Providers)'),
    ]
    
    admin = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='ai_settings',
        verbose_name="Admin User",
        limit_choices_to={'user_type': 'admin'}
    )
    
    provider_name = models.CharField(
        max_length=50,
        choices=PROVIDER_CHOICES,
        verbose_name="Provider Name"
    )
    
    api_key = models.TextField(
        verbose_name="Personal API Key",
        help_text="API key شخصی این ادمین (رمزنگاری شده)",
        blank=True,
        null=True
    )
    
    is_active = models.BooleanField(
        default=True,
        verbose_name="Active",
        help_text="آیا این API Key فعال است؟"
    )
    
    use_shared_api = models.BooleanField(
        default=True,
        verbose_name="Use Shared API",
        help_text="اگر True باشد، از API مشترک استفاده می‌کند. اگر False باشد، از API شخصی استفاده می‌کند."
    )
    
    usage_count = models.IntegerField(
        default=0,
        verbose_name="Usage Count",
        help_text="تعداد دفعات استفاده از این API"
    )
    
    last_used_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Last Used",
        help_text="آخرین زمان استفاده"
    )
    
    monthly_limit = models.IntegerField(
        default=1000,
        verbose_name="Monthly Limit",
        help_text="محدودیت ماهانه استفاده (تعداد request)"
    )
    
    monthly_usage = models.IntegerField(
        default=0,
        verbose_name="Monthly Usage",
        help_text="تعداد استفاده در ماه جاری"
    )
    
    class Meta:
        verbose_name = "Admin AI Settings"
        verbose_name_plural = "Admin AI Settings"
        ordering = ['-created_at']
        db_table = 'ai_admin_settings'
        unique_together = ['admin', 'provider_name']
        indexes = [
            models.Index(fields=['admin', 'provider_name']),
            models.Index(fields=['admin', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.admin.get_full_name()} - {self.get_provider_name_display()}"
    
    def save(self, *args, **kwargs):
        # Encrypt API key if new one is entered and not yet encrypted
        if self.api_key and self.api_key.strip():
            # Check if API key is already encrypted
            if not self.api_key.startswith('gAAAAAB'):
                self.api_key = self._encrypt_api_key(self.api_key.strip())
        elif not self.api_key or not self.api_key.strip():
            self.api_key = None
        
        super().save(*args, **kwargs)
    
    def _get_encryption_key(self):
        """Get encryption key from SECRET_KEY"""
        secret = settings.SECRET_KEY.encode()
        key = hashlib.sha256(secret).digest()
        return base64.urlsafe_b64encode(key)
    
    def _encrypt_api_key(self, api_key: str) -> str:
        """Encrypt API key"""
        try:
            key = self._get_encryption_key()
            fernet = Fernet(key)
            encrypted = fernet.encrypt(api_key.encode())
            return encrypted.decode()
        except Exception as e:
            raise ValidationError(f"خطا در رمزنگاری API key: {str(e)}")
    
    def get_api_key(self) -> str:
        """Decrypt and return API key"""
        if not self.api_key:
            return None
        
        try:
            key = self._get_encryption_key()
            fernet = Fernet(key)
            decrypted = fernet.decrypt(self.api_key.encode())
            return decrypted.decode()
        except Exception as e:
            raise ValidationError(f"خطا در رمزگشایی API key: {str(e)}")
    
    def increment_usage(self):
        """افزایش شمارنده استفاده"""
        from django.utils import timezone
        self.usage_count += 1
        self.monthly_usage += 1
        self.last_used_at = timezone.now()
        self.save(update_fields=['usage_count', 'monthly_usage', 'last_used_at'])
    
    def reset_monthly_usage(self):
        """ریست کردن استفاده ماهانه"""
        self.monthly_usage = 0
        self.save(update_fields=['monthly_usage'])
    
    def has_reached_limit(self) -> bool:
        """بررسی رسیدن به محدودیت ماهانه"""
        return self.monthly_usage >= self.monthly_limit
    
    @classmethod
    def get_api_key_for_admin(cls, admin, provider_name):
        """
        دریافت API Key برای یک ادمین بر اساس سناریو:
        
        سوپر ادمین‌ها:
        - می‌توانند از API شخصی یا مشترک استفاده کنند (آزاد)
        
        ادمین‌های معمولی:
        - اگر use_shared_api=True:
          - اگر permission 'ai.settings.shared.manage' داشته باشد → مجاز به shared API
          - اگر permission نداشته باشد → خطا (نمی‌تواند از shared API استفاده کند)
        - اگر use_shared_api=False:
          - همیشه از personal API استفاده می‌کند (نیازی به permission نیست)
        """
        import logging
        from src.user.permissions.validator import PermissionValidator
        
        logger = logging.getLogger(__name__)
        
        admin_email = admin.email if hasattr(admin, 'email') else str(admin)
        is_super_admin = admin.is_superuser or admin.is_admin_full
        
        logger.info(f"🔑 [AdminAISettings] get_api_key_for_admin - Admin: {admin_email}, Provider: {provider_name}, is_super_admin: {is_super_admin}")
        print(f"🔑 [AdminAISettings] get_api_key_for_admin - Admin: {admin_email}, Provider: {provider_name}, is_super_admin: {is_super_admin}")
        
        try:
            settings = cls.objects.get(
                admin=admin,
                provider_name=provider_name,
                is_active=True
            )
            
            logger.info(f"✅ [AdminAISettings] Found personal settings - use_shared_api={settings.use_shared_api}")
            print(f"✅ [AdminAISettings] Found personal settings - use_shared_api={settings.use_shared_api}")
            
            # اگر از API مشترک استفاده می‌کند
            if settings.use_shared_api:
                # بررسی دسترسی: سوپر ادمین همیشه مجاز، ادمین معمولی نیاز به permission داره
                if not is_super_admin:
                    # ادمین معمولی باید permission داشته باشه
                    has_shared_permission = PermissionValidator.has_permission(
                        admin, 
                        'ai.settings.shared.manage'
                    )
                    
                    if not has_shared_permission:
                        logger.error(f"❌ [AdminAISettings] Regular admin without permission tried to use shared API")
                        print(f"❌ [AdminAISettings] Regular admin without permission tried to use shared API")
                        raise ValidationError(
                            "شما به استفاده از API مشترک دسترسی ندارید. "
                            "لطفاً از API شخصی استفاده کنید یا با مدیر سیستم تماس بگیرید."
                        )
                    
                    logger.info(f"✅ [AdminAISettings] Regular admin has permission to use shared API")
                    print(f"✅ [AdminAISettings] Regular admin has permission to use shared API")
                
                # استفاده از shared API (مجاز)
                logger.info(f"🔗 [AdminAISettings] ⚡ DECISION: Using SHARED API for {provider_name}")
                print(f"🔗 [AdminAISettings] ⚡ DECISION: Using SHARED API for {provider_name}")
                
                from src.ai.models.image_generation import AIImageGeneration
                shared_provider = AIImageGeneration.get_active_provider(provider_name)
                if not shared_provider:
                    raise ValidationError(f"Provider '{provider_name}' فعال نیست یا یافت نشد.")
                
                shared_key = shared_provider.get_api_key()
                shared_key_preview = shared_key[:10] + "..." if shared_key and len(shared_key) > 10 else "None"
                logger.info(f"🔗 [AdminAISettings] Shared API key preview: {shared_key_preview}")
                print(f"🔗 [AdminAISettings] Shared API key preview: {shared_key_preview}")
                return shared_key
            
            # اگر از API شخصی استفاده می‌کند (همه مجاز)
            logger.info(f"👤 [AdminAISettings] ⚡ DECISION: Using PERSONAL API for {provider_name}")
            print(f"👤 [AdminAISettings] ⚡ DECISION: Using PERSONAL API for {provider_name}")
            
            # بررسی وجود personal API key
            personal_api_key = settings.get_api_key()
            if not personal_api_key:
                logger.error(f"❌ [AdminAISettings] Personal API key is missing")
                print(f"❌ [AdminAISettings] Personal API key is missing")
                raise ValidationError("برای استفاده از API شخصی، ابتدا باید API Key را در تنظیمات وارد کنید.")
            
            # بررسی محدودیت ماهانه (فقط برای personal API)
            if settings.has_reached_limit():
                logger.warning(f"⚠️ [AdminAISettings] Monthly limit reached")
                print(f"⚠️ [AdminAISettings] Monthly limit reached")
                raise ValidationError("شما به محدودیت ماهانه خود رسیده‌اید.")
            
            personal_api_key_preview = personal_api_key[:10] + "..." if len(personal_api_key) > 10 else "None"
            logger.info(f"👤 [AdminAISettings] Personal API key preview: {personal_api_key_preview}")
            print(f"👤 [AdminAISettings] Personal API key preview: {personal_api_key_preview}")
            
            return personal_api_key
        
        except cls.DoesNotExist:
            # اگر تنظیمات شخصی نداره
            logger.info(f"🔗 [AdminAISettings] ⚡ DECISION: No personal settings - Trying SHARED API")
            print(f"🔗 [AdminAISettings] ⚡ DECISION: No personal settings - Trying SHARED API")
            
            # بررسی دسترسی به shared API
            if not is_super_admin:
                has_shared_permission = PermissionValidator.has_permission(
                    admin, 
                    'ai.settings.shared.manage'
                )
                
                if not has_shared_permission:
                    logger.error(f"❌ [AdminAISettings] No settings found and no permission for shared API")
                    print(f"❌ [AdminAISettings] No settings found and no permission for shared API")
                    raise ValidationError(
                        "شما تنظیمات AI شخصی ندارید و به API مشترک هم دسترسی ندارید. "
                        "لطفاً ابتدا API Key شخصی خود را در تنظیمات وارد کنید."
                    )
            
            # استفاده از shared API
            from src.ai.models.image_generation import AIImageGeneration
            shared_provider = AIImageGeneration.get_active_provider(provider_name)
            if not shared_provider:
                raise ValidationError(f"Provider '{provider_name}' فعال نیست یا یافت نشد.")
            
            shared_key = shared_provider.get_api_key()
            shared_key_preview = shared_key[:10] + "..." if shared_key and len(shared_key) > 10 else "None"
            logger.info(f"🔗 [AdminAISettings] Shared API key preview: {shared_key_preview}")
            print(f"🔗 [AdminAISettings] Shared API key preview: {shared_key_preview}")
            return shared_key

