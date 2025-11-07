from django.urls import path, include
from rest_framework.routers import DefaultRouter
from src.settings.views import (
    GeneralSettingsViewSet,
    ContactPhoneViewSet,
    ContactMobileViewSet,
    ContactEmailViewSet,
    SocialMediaViewSet,
)

router = DefaultRouter()
router.register(r'general', GeneralSettingsViewSet, basename='general-settings')
router.register(r'phones', ContactPhoneViewSet, basename='contact-phone')
router.register(r'mobiles', ContactMobileViewSet, basename='contact-mobile')
router.register(r'emails', ContactEmailViewSet, basename='contact-email')
router.register(r'social-media', SocialMediaViewSet, basename='social-media')

urlpatterns = [
    path('', include(router.urls)),
]

