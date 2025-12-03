from django.core.cache import cache


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
        cache.delete(SettingsCacheKeys.general_settings())
    
    @staticmethod
    def invalidate_contact_phones():
        cache.delete(SettingsCacheKeys.contact_phones())
    
    @staticmethod
    def invalidate_contact_mobiles():
        cache.delete(SettingsCacheKeys.contact_mobiles())
    
    @staticmethod
    def invalidate_contact_emails():
        cache.delete(SettingsCacheKeys.contact_emails())
    
    @staticmethod
    def invalidate_social_media():
        cache.delete(SettingsCacheKeys.social_media())
    
    @staticmethod
    def invalidate_all():
        cache.delete_many(SettingsCacheKeys.all_keys())

