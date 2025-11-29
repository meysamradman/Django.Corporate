"""
AI Model Access State Machine
محاسبه وضعیت دسترسی هر ادمین به هر مدل
"""
from enum import Enum


class ModelAccessState(str, Enum):
    """
    State Machine برای دسترسی به مدل‌های AI
    
    States:
    - AVAILABLE_SHARED: دسترسی اشتراکی فعال
    - AVAILABLE_PERSONAL: API شخصی تنظیم شده
    - NO_ACCESS: دسترسی ندارد
    - DISABLED: مدل غیرفعال است
    """
    AVAILABLE_SHARED = "available_shared"
    AVAILABLE_PERSONAL = "available_personal"
    NO_ACCESS = "no_access"
    DISABLED = "disabled"
    
    @classmethod
    def calculate(cls, provider, model, admin):
        """
        محاسبه state بر اساس provider, model, admin
        
        Args:
            provider: AIProvider instance
            model: AIModel instance (can be None)
            admin: User instance
        
        Returns:
            ModelAccessState
        """
        # 1. Check if model is disabled
        if model and not model.is_active:
            return cls.DISABLED
        
        # 2. Check if provider is disabled
        if not provider.is_active:
            return cls.DISABLED
        
        # 3. Super Admin → همیشه دسترسی shared داره
        if getattr(admin, 'is_superuser', False) or getattr(admin, 'is_admin_full', False):
            return cls.AVAILABLE_SHARED
        
        # 4. Check personal API first
        from src.ai.models import AdminProviderSettings
        
        settings = AdminProviderSettings.objects.filter(
            admin=admin,
            provider=provider,
            is_active=True
        ).first()
        
        if settings and settings.personal_api_key:
            return cls.AVAILABLE_PERSONAL
        
        # 5. Check shared access
        if provider.allow_shared_for_normal_admins:
            return cls.AVAILABLE_SHARED
        
        # 6. No access
        return cls.NO_ACCESS
