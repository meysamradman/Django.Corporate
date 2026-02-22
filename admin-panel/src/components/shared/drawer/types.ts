export const DRAWER_IDS = {
    BLOG_TAG_FORM: 'BLOG_TAG_FORM',
    BLOG_CATEGORY_FORM: 'BLOG_CATEGORY_FORM',
    PORTFOLIO_TAG_FORM: 'PORTFOLIO_TAG_FORM',
    PORTFOLIO_CATEGORY_FORM: 'PORTFOLIO_CATEGORY_FORM',
    PORTFOLIO_OPTION_FORM: 'PORTFOLIO_OPTION_FORM',
    REAL_ESTATE_TYPE_FORM: 'REAL_ESTATE_TYPE_FORM',
    REAL_ESTATE_LISTING_TYPE_FORM: 'REAL_ESTATE_LISTING_TYPE_FORM',
    REAL_ESTATE_LABEL_FORM: 'REAL_ESTATE_LABEL_FORM',
    REAL_ESTATE_FEATURE_FORM: 'REAL_ESTATE_FEATURE_FORM',
    REAL_ESTATE_TAG_FORM: 'REAL_ESTATE_TAG_FORM',
    REAL_ESTATE_PROVINCE_FORM: 'REAL_ESTATE_PROVINCE_FORM',
    REAL_ESTATE_CITY_FORM: 'REAL_ESTATE_CITY_FORM',
    REAL_ESTATE_REGION_FORM: 'REAL_ESTATE_REGION_FORM',
    SETTINGS_GENERAL_FORM: 'SETTINGS_GENERAL_FORM',
    SETTINGS_PHONE_FORM: 'SETTINGS_PHONE_FORM',
    SETTINGS_MOBILE_FORM: 'SETTINGS_MOBILE_FORM',
    SETTINGS_EMAIL_FORM: 'SETTINGS_EMAIL_FORM',
    SETTINGS_SOCIAL_FORM: 'SETTINGS_SOCIAL_FORM',
    SETTINGS_SLIDER_FORM: 'SETTINGS_SLIDER_FORM',
    SETTINGS_FOOTER_SECTION_FORM: 'SETTINGS_FOOTER_SECTION_FORM',
    SETTINGS_FOOTER_LINK_FORM: 'SETTINGS_FOOTER_LINK_FORM',
    SETTINGS_FOOTER_ABOUT_FORM: 'SETTINGS_FOOTER_ABOUT_FORM',
    CHATBOT_FAQ_FORM: 'CHATBOT_FAQ_FORM',
    FORM_BUILDER_FIELD_FORM: 'FORM_BUILDER_FIELD_FORM',
    SETTINGS_MAP_FORM: 'SETTINGS_MAP_FORM',
} as const;

export type DrawerId = keyof typeof DRAWER_IDS;

export interface DrawerProps {
    BLOG_TAG_FORM: {
        editId?: number | null;
        onSuccess?: () => void;
    };
    BLOG_CATEGORY_FORM: {
        editId?: number | null;
        onSuccess?: () => void;
    };
    PORTFOLIO_TAG_FORM: {
        editId?: number | null;
        onSuccess?: () => void;
    };
    PORTFOLIO_CATEGORY_FORM: {
        editId?: number | null;
        onSuccess?: () => void;
    };
    PORTFOLIO_OPTION_FORM: {
        editId?: number | null;
        onSuccess?: () => void;
    };
    REAL_ESTATE_TYPE_FORM: {
        editId?: number | null;
        onSuccess?: () => void;
    };
    REAL_ESTATE_LISTING_TYPE_FORM: {
        editId?: number | null;
        onSuccess?: () => void;
    };
    REAL_ESTATE_LABEL_FORM: {
        editId?: number | null;
        onSuccess?: () => void;
    };
    REAL_ESTATE_FEATURE_FORM: {
        editId?: number | null;
        onSuccess?: () => void;
    };
    REAL_ESTATE_TAG_FORM: {
        editId?: number | null;
        onSuccess?: () => void;
    };
    REAL_ESTATE_PROVINCE_FORM: {
        editId?: number | null;
        onSuccess?: () => void;
    };
    REAL_ESTATE_CITY_FORM: {
        editId?: number | null;
        onSuccess?: () => void;
    };
    REAL_ESTATE_REGION_FORM: {
        editId?: number | null;
        onSuccess?: () => void;
    };
    SETTINGS_GENERAL_FORM: {
        onSuccess?: () => void;
    };
    SETTINGS_PHONE_FORM: {
        editId?: number | null;
        onSuccess?: () => void;
    };
    SETTINGS_MOBILE_FORM: {
        editId?: number | null;
        onSuccess?: () => void;
    };
    SETTINGS_EMAIL_FORM: {
        editId?: number | null;
        onSuccess?: () => void;
    };
    SETTINGS_SOCIAL_FORM: {
        editId?: number | null;
        onSuccess?: () => void;
    };
    SETTINGS_SLIDER_FORM: {
        editId?: number | null;
        onSuccess?: () => void;
    };
    SETTINGS_FOOTER_SECTION_FORM: {
        editId?: number | null;
        onSuccess?: () => void;
    };
    SETTINGS_FOOTER_LINK_FORM: {
        editId?: number | null;
        onSuccess?: () => void;
    };
    SETTINGS_FOOTER_ABOUT_FORM: {
        editId?: number | null;
        onSuccess?: () => void;
    };
    CHATBOT_FAQ_FORM: {
        editId?: number | null;
        onSuccess?: () => void;
    };
    FORM_BUILDER_FIELD_FORM: {
        editId?: number | null;
        onSuccess?: () => void;
    };
    SETTINGS_MAP_FORM: {
        onSuccess?: () => void;
    };
}
