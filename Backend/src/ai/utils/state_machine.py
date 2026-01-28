from enum import Enum

class ModelAccessState(str, Enum):
    AVAILABLE_SHARED = "available_shared"
    AVAILABLE_PERSONAL = "available_personal"
    NO_ACCESS = "no_access"
    DISABLED = "disabled"
    
    @classmethod
    def calculate(cls, provider, model, admin):
        from src.ai.models import AdminProviderSettings

        if model and not model.is_active:
            return cls.DISABLED

        if not provider.is_active:
            return cls.DISABLED
        
        if getattr(admin, 'is_superuser', False) or getattr(admin, 'is_admin_full', False):
            return cls.AVAILABLE_SHARED
        
        settings = AdminProviderSettings.objects.filter(
            admin=admin,
            provider=provider,
            is_active=True
        ).first()
        
        if settings and settings.personal_api_key:
            return cls.AVAILABLE_PERSONAL
        
        if provider.allow_shared_for_normal_admins:
            return cls.AVAILABLE_SHARED
        
        return cls.NO_ACCESS
