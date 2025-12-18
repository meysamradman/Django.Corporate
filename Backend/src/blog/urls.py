from django.urls import path, include
from rest_framework.routers import DefaultRouter
from src.blog import views

router = DefaultRouter()
router.register(r'admin/blog', views.BlogAdminViewSet, basename='admin-blog')
router.register(r'admin/blog-category', views.BlogCategoryAdminViewSet, basename='admin-blog-category')
router.register(r'admin/blog-tag', views.BlogTagAdminViewSet, basename='admin-blog-tag')
router.register(r'blog', views.BlogPublicViewSet, basename='public-blog')
router.register(r'blog-category', views.BlogCategoryPublicViewSet, basename='public-blog-category')
router.register(r'blog-tag', views.BlogTagPublicViewSet, basename='public-blog-tag')

urlpatterns = [
    path('', include(router.urls)),
]

