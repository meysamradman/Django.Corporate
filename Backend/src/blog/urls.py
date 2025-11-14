from django.urls import path, include
from rest_framework.routers import DefaultRouter
from src.blog import views

router = DefaultRouter()
router.register(r'admin/blog', views.BlogAdminViewSet, basename='admin-blog')
router.register(r'blog', views.BlogPublicViewSet, basename='public-blog')
router.register(r'admin/blog-category', views.BlogCategoryAdminViewSet, basename='admin-blog-category')
router.register(r'blog-category', views.BlogCategoryPublicViewSet, basename='public-blog-category')
router.register(r'admin/blog-tag', views.BlogTagAdminViewSet, basename='admin-blog-tag')
router.register(r'blog-tag', views.BlogTagPublicViewSet, basename='public-blog-tag')
# BlogMediaViewSet is removed as BlogMedia model no longer exists

# Note: Export endpoint is defined in config/urls.py before this include to take precedence
urlpatterns = [
    path('', include(router.urls)),
]# Debug: Print URL patterns
import sys
if 'runserver' in sys.argv or 'test' in sys.argv:
    print("=" * 50)
    print("Blog URL Patterns:")
    for pattern in urlpatterns:
        print(f"  {pattern.pattern}")
    print("Router URLs:")
    for url in router.urls:
        print(f"  {url.pattern}")
    print("=" * 50)

