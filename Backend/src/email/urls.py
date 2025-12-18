from django.urls import path, include
from rest_framework.routers import DefaultRouter
from src.email.views.email_views import EmailMessageViewSet

router = DefaultRouter()
router.register(r'email/messages', EmailMessageViewSet, basename='email-message')

urlpatterns = [
    path('', include(router.urls)),
]

