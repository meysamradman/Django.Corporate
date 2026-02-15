from src.ai.models import AIProvider, AdminProviderSettings


class ProviderAccessService:
    @staticmethod
    def can_admin_access_provider(user, provider: AIProvider, is_super: bool | None = None) -> bool:
        if is_super is None:
            is_super = getattr(user, 'is_superuser', False) or getattr(user, 'is_admin_full', False)

        if is_super and provider.shared_api_key:
            return True

        personal_settings = AdminProviderSettings.objects.filter(
            admin=user,
            provider=provider,
            is_active=True,
            personal_api_key__isnull=False,
        ).exclude(personal_api_key='').first()

        if personal_settings:
            return True

        if provider.allow_shared_for_normal_admins and provider.shared_api_key:
            return True

        return False

    @staticmethod
    def can_admin_access_provider_by_slug(user, provider_slug: str, is_super: bool | None = None) -> bool:
        try:
            provider = AIProvider.objects.get(slug=provider_slug, is_active=True)
        except AIProvider.DoesNotExist:
            return False

        return ProviderAccessService.can_admin_access_provider(user=user, provider=provider, is_super=is_super)
