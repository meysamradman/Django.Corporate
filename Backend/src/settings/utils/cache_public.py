class SettingsPublicCacheKeys:

    @staticmethod
    def general_settings():
        return "public:settings:general"

    @staticmethod
    def contact_payload():
        return "public:settings:contact"

    @staticmethod
    def footer():
        return "public:settings:footer"

    @staticmethod
    def footer_about():
        return "public:settings:footer:about"

    @staticmethod
    def branding_logo():
        return "public:settings:branding:logo"

    @staticmethod
    def branding_sliders():
        return "public:settings:branding:sliders"

    @staticmethod
    def all_keys():
        return [
            SettingsPublicCacheKeys.general_settings(),
            SettingsPublicCacheKeys.contact_payload(),
            SettingsPublicCacheKeys.footer(),
            SettingsPublicCacheKeys.footer_about(),
            SettingsPublicCacheKeys.branding_logo(),
            SettingsPublicCacheKeys.branding_sliders(),
        ]
