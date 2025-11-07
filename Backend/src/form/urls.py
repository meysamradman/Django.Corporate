from django.urls import path, include
from rest_framework.routers import DefaultRouter
from src.form.views import ContactFormFieldViewSet, ContactFormSubmissionViewSet

router = DefaultRouter()
router.register(r'form/fields', ContactFormFieldViewSet, basename='contact-form-field')
router.register(r'form/submissions', ContactFormSubmissionViewSet, basename='contact-form-submission')

urlpatterns = [
    path('', include(router.urls)),
]

