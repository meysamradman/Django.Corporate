from django.urls import path, include
from rest_framework.routers import DefaultRouter
from src.real_estate import views
from src.real_estate.views.admin import location_views as admin_location_views, property_geo_views
from src.real_estate.views.public import (
    listing_type_views,
    property_views,
    type_views,
    location_views as public_location_views,
    label_views,
    tag_views,
    feature_views,
    agent_views,
    agency_views,
    floor_plan_views,
)

admin_router = DefaultRouter()
admin_router.register(r'admin/property', views.PropertyAdminViewSet, basename='admin-property')
admin_router.register(r'admin/property-geo', property_geo_views.PropertyGeoViewSet, basename='admin-property-geo')
admin_router.register(r'admin/floor-plan', views.FloorPlanAdminViewSet, basename='admin-floor-plan')
admin_router.register(r'admin/property-type', views.PropertyTypeAdminViewSet, basename='admin-property-type')
admin_router.register(r'admin/listing-type', views.ListingTypeAdminViewSet, basename='admin-listing-type')
admin_router.register(r'admin/property-state', views.ListingTypeAdminViewSet, basename='admin-property-state')
admin_router.register(r'admin/property-label', views.PropertyLabelAdminViewSet, basename='admin-property-label')
admin_router.register(r'admin/property-feature', views.PropertyFeatureAdminViewSet, basename='admin-property-feature')
admin_router.register(r'admin/property-tag', views.PropertyTagAdminViewSet, basename='admin-property-tag')
admin_router.register(r'admin/property-agent', views.PropertyAgentAdminViewSet, basename='admin-property-agent')
admin_router.register(r'admin/real-estate-agency', views.RealEstateAgencyAdminViewSet, basename='admin-real-estate-agency')
admin_router.register(r'admin/real-estate-provinces', admin_location_views.RealEstateProvinceViewSet, basename='admin-real-estate-provinces')
admin_router.register(r'admin/real-estate-cities', admin_location_views.RealEstateCityViewSet, basename='admin-real-estate-cities')
admin_router.register(r'admin/real-estate-city-regions', admin_location_views.RealEstateCityRegionViewSet, basename='admin-real-estate-city-regions')
public_router = DefaultRouter()
public_router.register(r'real-estate/properties', property_views.PropertyPublicViewSet, basename='public-property')
public_router.register(r'real-estate/types', type_views.PropertyTypePublicViewSet, basename='public-property-type')
public_router.register(r'real-estate/listing-types', listing_type_views.ListingTypePublicViewSet, basename='public-listing-type')
public_router.register(r'real-estate/states', listing_type_views.ListingTypePublicViewSet, basename='public-property-state')
public_router.register(r'real-estate/provinces', public_location_views.ProvincePublicViewSet, basename='public-province')
public_router.register(r'real-estate/cities', public_location_views.CityPublicViewSet, basename='public-city')
public_router.register(r'real-estate/regions', public_location_views.RegionPublicViewSet, basename='public-region')
public_router.register(r'real-estate/labels', label_views.PropertyLabelPublicViewSet, basename='public-property-label')
public_router.register(r'real-estate/tags', tag_views.PropertyTagPublicViewSet, basename='public-property-tag')
public_router.register(r'real-estate/features', feature_views.PropertyFeaturePublicViewSet, basename='public-property-feature')
public_router.register(r'real-estate/floor-plans', floor_plan_views.FloorPlanPublicViewSet, basename='public-floor-plan')
public_router.register(r'real-estate/agents', agent_views.PropertyAgentPublicViewSet, basename='public-agent')
public_router.register(r'real-estate/agencies', agency_views.RealEstateAgencyPublicViewSet, basename='public-agency')

urlpatterns = [
    path('', include(admin_router.urls)),
    path('', include(public_router.urls)),
]

