from src.settings.utils.cache_admin import SettingsAdminCacheKeys, SettingsCacheManager
from src.settings.utils.cache_public import SettingsPublicCacheKeys

class SettingsCacheKeys:

    @staticmethod
    def general_settings():
        return SettingsAdminCacheKeys.general_settings()

    @staticmethod
    def general_settings_model_pk():
        return SettingsAdminCacheKeys.general_settings_model_pk()

    @staticmethod
    def footer_about_model_pk():
        return SettingsAdminCacheKeys.footer_about_model_pk()

    @staticmethod
    def contact_phones():
        return SettingsAdminCacheKeys.contact_phones()

    @staticmethod
    def contact_mobiles():
        return SettingsAdminCacheKeys.contact_mobiles()

    @staticmethod
    def contact_emails():
        return SettingsAdminCacheKeys.contact_emails()

    @staticmethod
    def social_media():
        return SettingsAdminCacheKeys.social_media()

    @staticmethod
    def footer_public():
        return SettingsPublicCacheKeys.footer()

    @staticmethod
    def footer_about_public():
        return SettingsPublicCacheKeys.footer_about()

    @staticmethod
    def all_keys():
        return SettingsAdminCacheKeys.all_keys() + SettingsPublicCacheKeys.all_keys()

__all__ = [
    'SettingsCacheKeys',
    'SettingsCacheManager',
    'SettingsAdminCacheKeys',
    'SettingsPublicCacheKeys',
]

