from django.urls import path, include
from rest_framework.routers import DefaultRouter
from src.portfolio import views

router = DefaultRouter()
router.register(r'admin/portfolio', views.PortfolioAdminViewSet, basename='admin-portfolio')
router.register(r'portfolio', views.PortfolioPublicViewSet, basename='public-portfolio')
router.register(r'admin/portfolio-category', views.PortfolioCategoryAdminViewSet, basename='admin-portfolio-category')
router.register(r'portfolio-category', views.PortfolioCategoryPublicViewSet, basename='public-portfolio-category')
router.register(r'admin/portfolio-option', views.PortfolioOptionAdminViewSet, basename='admin-portfolio-option')
router.register(r'portfolio-option', views.PortfolioOptionPublicViewSet, basename='public-portfolio-option')
router.register(r'admin/portfolio-tag', views.PortfolioTagAdminViewSet, basename='admin-portfolio-tag')
router.register(r'portfolio-tag', views.PortfolioTagPublicViewSet, basename='public-portfolio-tag')

urlpatterns = [
    path('', include(router.urls)),
]

