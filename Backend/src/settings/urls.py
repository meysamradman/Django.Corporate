from django.urls import path, include
from rest_framework.routers import DefaultRouter
from src.settings.views.public.branding_view import (
    PublicLogoView,
    PublicSliderListView,
)
from src.settings.views.public.contact_view import PublicContactView
from src.settings.views.public.general_settings_view import PublicGeneralSettingsView
from src.settings.views.public.footer_view import PublicFooterView
from src.settings.views.public.footer_about_view import PublicFooterAboutView
from src.settings.views.admin import (
    GeneralSettingsViewSet,
    MapSettingsViewSet,
    ContactPhoneViewSet,
    ContactMobileViewSet,
    ContactEmailViewSet,
    SocialMediaViewSet,
    SliderViewSet,
    FooterSectionViewSet,
    FooterLinkViewSet,
    FooterAboutViewSet,
)

router = DefaultRouter()
router.register(r'settings/general', GeneralSettingsViewSet, basename='general-settings')
router.register(r'settings/map', MapSettingsViewSet, basename='map-settings')
router.register(r'settings/phones', ContactPhoneViewSet, basename='contact-phone')
router.register(r'settings/mobiles', ContactMobileViewSet, basename='contact-mobile')
router.register(r'settings/emails', ContactEmailViewSet, basename='contact-email')
router.register(r'settings/social-media', SocialMediaViewSet, basename='social-media')
router.register(r'settings/sliders', SliderViewSet, basename='slider')
router.register(r'settings/footer-sections', FooterSectionViewSet, basename='footer-sections')
router.register(r'settings/footer-links', FooterLinkViewSet, basename='footer-links')
router.register(r'settings/footer-about', FooterAboutViewSet, basename='footer-about')

urlpatterns = [
    path('settings/logo/', PublicLogoView.as_view(), name='public-settings-logo'),
    path('settings/public/sliders/', PublicSliderListView.as_view(), name='public-settings-sliders'),
    path('settings/contact/', PublicContactView.as_view(), name='public-settings-contact'),
    path('settings/general/public/', PublicGeneralSettingsView.as_view(), name='public-settings-general'),
    path('settings/footer/', PublicFooterView.as_view(), name='public-settings-footer'),
    path('settings/footer/about/', PublicFooterAboutView.as_view(), name='public-settings-footer-about'),
    path('', include(router.urls)),
]

