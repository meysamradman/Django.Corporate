from src.core.cache import CacheService
from src.settings.utils.cache_public import SettingsPublicCacheKeys


class SettingsAdminCacheKeys:

    @staticmethod
    def general_settings():
        return "admin:settings:general"

    @staticmethod
    def general_settings_model_pk():
        return "admin:settings:general:model_pk"

    @staticmethod
    def footer_about_model_pk():
        return "admin:settings:footer:about:model_pk"

    @staticmethod
    def contact_phones():
        return "admin:settings:contact:phones"

    @staticmethod
    def contact_mobiles():
        return "admin:settings:contact:mobiles"

    @staticmethod
    def contact_emails():
        return "admin:settings:contact:emails"

    @staticmethod
    def social_media():
        return "admin:settings:social-media"

    @staticmethod
    def all_keys():
        return [
            SettingsAdminCacheKeys.general_settings(),
            SettingsAdminCacheKeys.general_settings_model_pk(),
            SettingsAdminCacheKeys.footer_about_model_pk(),
            SettingsAdminCacheKeys.contact_phones(),
            SettingsAdminCacheKeys.contact_mobiles(),
            SettingsAdminCacheKeys.contact_emails(),
            SettingsAdminCacheKeys.social_media(),
        ]


class SettingsCacheManager:

    @staticmethod
    def invalidate_general_settings():
        deleted = CacheService.delete(SettingsAdminCacheKeys.general_settings())
        deleted += CacheService.delete(SettingsAdminCacheKeys.general_settings_model_pk())
        deleted += CacheService.delete(SettingsPublicCacheKeys.general_settings())
        deleted += CacheService.delete(SettingsPublicCacheKeys.branding_logo())
        return deleted

    @staticmethod
    def invalidate_contact_phones():
        return CacheService.delete(SettingsAdminCacheKeys.contact_phones())

    @staticmethod
    def invalidate_contact_mobiles():
        return CacheService.delete(SettingsAdminCacheKeys.contact_mobiles())

    @staticmethod
    def invalidate_contact_emails():
        return CacheService.delete(SettingsAdminCacheKeys.contact_emails())

    @staticmethod
    def invalidate_social_media():
        return CacheService.delete(SettingsAdminCacheKeys.social_media())

    @staticmethod
    def invalidate_contact_public():
        return CacheService.delete(SettingsPublicCacheKeys.contact_payload())

    @staticmethod
    def invalidate_footer_public():
        return CacheService.delete(SettingsPublicCacheKeys.footer())

    @staticmethod
    def invalidate_footer_about_public():
        return CacheService.delete(SettingsPublicCacheKeys.footer_about())

    @staticmethod
    def invalidate_branding_public():
        deleted = CacheService.delete(SettingsPublicCacheKeys.branding_logo())
        deleted += CacheService.delete(SettingsPublicCacheKeys.branding_sliders())
        return deleted

    @staticmethod
    def invalidate_footer_about_model_pk():
        return CacheService.delete(SettingsAdminCacheKeys.footer_about_model_pk())

    @staticmethod
    def invalidate_all():
        deleted = CacheService.delete_many(SettingsAdminCacheKeys.all_keys())
        deleted += CacheService.delete_many(SettingsPublicCacheKeys.all_keys())
        return deleted
