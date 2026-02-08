import { Suspense, lazy } from 'react';
import { useGlobalDrawerStore } from './store';
import { DRAWER_IDS } from './types';

const BlogTagSide = lazy(() => import('@/components/blogs/tags/BlogTagSide').then(module => ({ default: module.BlogTagSide })));
const BlogCategorySide = lazy(() => import('@/components/blogs/categories/BlogCategorySide').then(module => ({ default: module.BlogCategorySide })));
const PortfolioTagSide = lazy(() => import('@/components/portfolios/tags/PortfolioTagSide').then(module => ({ default: module.PortfolioTagSide })));
const PortfolioCategorySide = lazy(() => import('@/components/portfolios/categories/PortfolioCategorySide').then(module => ({ default: module.PortfolioCategorySide })));
const PortfolioOptionSide = lazy(() => import('@/components/portfolios/options/PortfolioOptionSide').then(module => ({ default: module.PortfolioOptionSide })));

const PropertyTypeSide = lazy(() => import('@/components/real-estate/types/PropertyTypeSide').then(module => ({ default: module.PropertyTypeSide })));
const PropertyStateSide = lazy(() => import('@/components/real-estate/states/PropertyStateSide').then(module => ({ default: module.PropertyStateSide })));
const PropertyLabelSide = lazy(() => import('@/components/real-estate/labels/PropertyLabelSide').then(module => ({ default: module.PropertyLabelSide })));
const PropertyFeatureSide = lazy(() => import('@/components/real-estate/features/PropertyFeatureSide').then(module => ({ default: module.PropertyFeatureSide })));
const PropertyTagSide = lazy(() => import('@/components/real-estate/tags/PropertyTagSide').then(module => ({ default: module.PropertyTagSide })));

const GeneralSettingsSide = lazy(() => import('@/components/settings/GeneralSettingsSide').then(module => ({ default: module.GeneralSettingsSide })));
const ContactPhoneSide = lazy(() => import('@/components/settings/ContactPhoneSide').then(module => ({ default: module.ContactPhoneSide })));
const ContactMobileSide = lazy(() => import('@/components/settings/ContactMobileSide').then(module => ({ default: module.ContactMobileSide })));
const ContactEmailSide = lazy(() => import('@/components/settings/ContactEmailSide').then(module => ({ default: module.ContactEmailSide })));
const SocialMediaSide = lazy(() => import('@/components/settings/SocialMediaSide').then(module => ({ default: module.SocialMediaSide })));
const SliderSide = lazy(() => import('@/components/settings/SliderSide').then(module => ({ default: module.SliderSide })));
const FAQSide = lazy(() => import('@/components/chatbot/FAQSide').then(module => ({ default: module.FAQSide })));
const FormFieldSide = lazy(() => import('@/components/form-builder/FormFieldSide').then(module => ({ default: module.FormFieldSide })));
const MapSettingsSide = lazy(() => import('@/components/settings/MapSettingsSide').then(module => ({ default: module.MapSettingsSide })));

const DRAWERS = {
    [DRAWER_IDS.BLOG_TAG_FORM]: BlogTagSide,
    [DRAWER_IDS.BLOG_CATEGORY_FORM]: BlogCategorySide,
    [DRAWER_IDS.PORTFOLIO_TAG_FORM]: PortfolioTagSide,
    [DRAWER_IDS.PORTFOLIO_CATEGORY_FORM]: PortfolioCategorySide,
    [DRAWER_IDS.PORTFOLIO_OPTION_FORM]: PortfolioOptionSide,
    [DRAWER_IDS.REAL_ESTATE_TYPE_FORM]: PropertyTypeSide,
    [DRAWER_IDS.REAL_ESTATE_STATE_FORM]: PropertyStateSide,
    [DRAWER_IDS.REAL_ESTATE_LABEL_FORM]: PropertyLabelSide,
    [DRAWER_IDS.REAL_ESTATE_FEATURE_FORM]: PropertyFeatureSide,
    [DRAWER_IDS.REAL_ESTATE_TAG_FORM]: PropertyTagSide,
    [DRAWER_IDS.SETTINGS_GENERAL_FORM]: GeneralSettingsSide,
    [DRAWER_IDS.SETTINGS_PHONE_FORM]: ContactPhoneSide,
    [DRAWER_IDS.SETTINGS_MOBILE_FORM]: ContactMobileSide,
    [DRAWER_IDS.SETTINGS_EMAIL_FORM]: ContactEmailSide,
    [DRAWER_IDS.SETTINGS_SOCIAL_FORM]: SocialMediaSide,
    [DRAWER_IDS.SETTINGS_SLIDER_FORM]: SliderSide,
    [DRAWER_IDS.CHATBOT_FAQ_FORM]: FAQSide,
    [DRAWER_IDS.FORM_BUILDER_FIELD_FORM]: FormFieldSide,
    [DRAWER_IDS.SETTINGS_MAP_FORM]: MapSettingsSide,
};

export function GlobalDrawer() {
    const { activeDrawer, drawerProps, close } = useGlobalDrawerStore();

    if (!activeDrawer) return null;

    const DrawerComponent = DRAWERS[activeDrawer];

    if (!DrawerComponent) return null;

    return (
        <Suspense fallback={null}>
            <DrawerComponent
                isOpen={true}
                onClose={close}
                onSuccess={() => {
                    if (drawerProps?.onSuccess) {
                        drawerProps.onSuccess();
                    }
                    close();
                }}
                {...drawerProps}
            />
        </Suspense>
    );
}
