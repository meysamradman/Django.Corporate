from django.urls import path, include
from rest_framework.routers import DefaultRouter
from src.real_estate import views

router = DefaultRouter()
router.register(r'admin/property', views.PropertyAdminViewSet, basename='admin-property')
router.register(r'admin/property-type', views.PropertyTypeAdminViewSet, basename='admin-property-type')
router.register(r'admin/property-state', views.PropertyStateAdminViewSet, basename='admin-property-state')
router.register(r'admin/property-label', views.PropertyLabelAdminViewSet, basename='admin-property-label')
router.register(r'admin/property-feature', views.PropertyFeatureAdminViewSet, basename='admin-property-feature')
router.register(r'admin/property-tag', views.PropertyTagAdminViewSet, basename='admin-property-tag')
router.register(r'admin/property-agent', views.PropertyAgentAdminViewSet, basename='admin-property-agent')
router.register(r'admin/real-estate-agency', views.RealEstateAgencyAdminViewSet, basename='admin-real-estate-agency')

urlpatterns = [
    path('', include(router.urls)),
]

