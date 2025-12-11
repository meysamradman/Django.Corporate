from src.core.cache import CacheService


class SettingsCacheKeys:
    
    @staticmethod
    def general_settings():
        return "settings_general"
    
    @staticmethod
    def contact_phones():
        return "settings_contact_phones"
    
    @staticmethod
    def contact_mobiles():
        return "settings_contact_mobiles"
    
    @staticmethod
    def contact_emails():
        return "settings_contact_emails"
    
    @staticmethod
    def social_media():
        return "settings_social_media"
    
    @staticmethod
    def all_keys():
        return [
            SettingsCacheKeys.general_settings(),
            SettingsCacheKeys.contact_phones(),
            SettingsCacheKeys.contact_mobiles(),
            SettingsCacheKeys.contact_emails(),
            SettingsCacheKeys.social_media(),
        ]


class SettingsCacheManager:
    
    @staticmethod
    def invalidate_general_settings():
        return CacheService.delete(SettingsCacheKeys.general_settings())
    
    @staticmethod
    def invalidate_contact_phones():
        return CacheService.delete(SettingsCacheKeys.contact_phones())
    
    @staticmethod
    def invalidate_contact_mobiles():
        return CacheService.delete(SettingsCacheKeys.contact_mobiles())
    
    @staticmethod
    def invalidate_contact_emails():
        return CacheService.delete(SettingsCacheKeys.contact_emails())
    
    @staticmethod
    def invalidate_social_media():
        return CacheService.delete(SettingsCacheKeys.social_media())
    
    @staticmethod
    def invalidate_all():
        return CacheService.delete_many(SettingsCacheKeys.all_keys())

