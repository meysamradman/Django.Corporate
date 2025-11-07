from django.urls import path, include
from rest_framework.routers import DefaultRouter
from src.page.views import AboutPageViewSet, TermsPageViewSet

router = DefaultRouter()
router.register(r'pages/about', AboutPageViewSet, basename='about-page')
router.register(r'pages/terms', TermsPageViewSet, basename='terms-page')

urlpatterns = [
    path('', include(router.urls)),
]

