from django.urls import path
from .views import CaptchaGenerateView, CaptchaVerifyView

app_name = 'captcha'

urlpatterns = [
    path('generate/', CaptchaGenerateView.as_view(), name='generate-captcha'),
    path('verify/', CaptchaVerifyView.as_view(), name='verify-captcha'),
]
