from django.urls import path, include
from rest_framework.routers import DefaultRouter
from src.real_estate import views
from src.real_estate.views.admin import location_views, property_geo_views
from src.real_estate.views.public import state_views

# Admin router
admin_router = DefaultRouter()
admin_router.register(r'admin/property', views.PropertyAdminViewSet, basename='admin-property')
admin_router.register(r'admin/property-geo', property_geo_views.PropertyGeoViewSet, basename='admin-property-geo')
admin_router.register(r'admin/floor-plan', views.FloorPlanAdminViewSet, basename='admin-floor-plan')
admin_router.register(r'admin/property-type', views.PropertyTypeAdminViewSet, basename='admin-property-type')
admin_router.register(r'admin/property-state', views.PropertyStateAdminViewSet, basename='admin-property-state')
admin_router.register(r'admin/property-label', views.PropertyLabelAdminViewSet, basename='admin-property-label')
admin_router.register(r'admin/property-feature', views.PropertyFeatureAdminViewSet, basename='admin-property-feature')
admin_router.register(r'admin/property-tag', views.PropertyTagAdminViewSet, basename='admin-property-tag')
admin_router.register(r'admin/property-agent', views.PropertyAgentAdminViewSet, basename='admin-property-agent')
admin_router.register(r'admin/real-estate-agency', views.RealEstateAgencyAdminViewSet, basename='admin-real-estate-agency')
admin_router.register(r'admin/real-estate-provinces', location_views.RealEstateProvinceViewSet, basename='admin-real-estate-provinces')
admin_router.register(r'admin/real-estate-cities', location_views.RealEstateCityViewSet, basename='admin-real-estate-cities')
admin_router.register(r'admin/real-estate-city-regions', location_views.RealEstateCityRegionViewSet, basename='admin-real-estate-city-regions')

# Public router
public_router = DefaultRouter()
public_router.register(r'public/real-estate/states', state_views.PropertyStatePublicViewSet, basename='public-property-state')

urlpatterns = [
    path('', include(admin_router.urls)),
    path('', include(public_router.urls)),
]

