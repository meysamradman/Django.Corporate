from django.urls import path, include
from rest_framework.routers import DefaultRouter
from src.real_estate import views
from src.real_estate.views.admin import location_views

router = DefaultRouter()
router.register(r'admin/property', views.PropertyAdminViewSet, basename='admin-property')
router.register(r'admin/property-type', views.PropertyTypeAdminViewSet, basename='admin-property-type')
router.register(r'admin/property-state', views.PropertyStateAdminViewSet, basename='admin-property-state')
router.register(r'admin/property-label', views.PropertyLabelAdminViewSet, basename='admin-property-label')
router.register(r'admin/property-feature', views.PropertyFeatureAdminViewSet, basename='admin-property-feature')
router.register(r'admin/property-tag', views.PropertyTagAdminViewSet, basename='admin-property-tag')
router.register(r'admin/property-agent', views.PropertyAgentAdminViewSet, basename='admin-property-agent')
router.register(r'admin/real-estate-agency', views.RealEstateAgencyAdminViewSet, basename='admin-real-estate-agency')
# Real Estate Location APIs - simplified
router.register(r'admin/real-estate-provinces', location_views.RealEstateProvinceViewSet, basename='admin-real-estate-provinces')
router.register(r'admin/real-estate-cities', location_views.RealEstateCityViewSet, basename='admin-real-estate-cities')
router.register(r'admin/real-estate-city-regions', location_views.RealEstateCityRegionViewSet, basename='admin-real-estate-city-regions')

urlpatterns = [
    path('', include(router.urls)),
]

