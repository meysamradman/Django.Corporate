from django.urls import path, include
from rest_framework.routers import DefaultRouter
from src.page.views import (
    AboutPageViewSet,
    TermsPageViewSet,
    PublicAboutPageView,
    PublicTermsPageView,
)

router = DefaultRouter()
router.register(r'pages/about', AboutPageViewSet, basename='about-page')
router.register(r'pages/terms', TermsPageViewSet, basename='terms-page')

urlpatterns = [
    path('public/pages/about/', PublicAboutPageView.as_view(), name='public-about-page'),
    path('public/pages/terms/', PublicTermsPageView.as_view(), name='public-terms-page'),
    path('', include(router.urls)),
]

