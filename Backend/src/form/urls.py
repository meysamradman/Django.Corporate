from django.urls import path, include
from rest_framework.routers import DefaultRouter
from src.form.views import (
    ContactFormFieldViewSet,
    ContactFormSubmissionViewSet,
    PublicContactFormFieldsView,
    PublicContactFormSubmissionView,
)

router = DefaultRouter()
router.register(r'form/fields', ContactFormFieldViewSet, basename='contact-form-field')
router.register(r'form/submissions', ContactFormSubmissionViewSet, basename='contact-form-submission')

urlpatterns = [
    path('public/form/fields/', PublicContactFormFieldsView.as_view(), name='public-contact-form-fields'),
    path('public/form/submissions/', PublicContactFormSubmissionView.as_view(), name='public-contact-form-submission'),
    path('', include(router.urls)),
]

