from django.urls import path, include
from django.conf import settings
from rest_framework.routers import DefaultRouter
from src.user.auth.user_jwt_refresh import UserJWTRefreshView
from src.user.views.admin import (
    AdminLoginView, AdminRegisterView, AdminLogoutView, 
    AdminManagementView, AdminProfileView, UserManagementView,
    FakeAdminLoginView
)
from src.user.access_control import AdminRoleView, AdminPermissionView
from src.user.views.otp_views import SendOTPView, VerifyOTPView, OTPSettingsView
from src.user.views.user.user_login_view import UserLoginView
from src.user.views.user.user_logout_view import UserLogoutView
from src.user.views.user.user_register_view import UserRegisterView
from src.user.views.user.user_profile_view import UserProfileView
from src.user.views.location_views import ProvinceViewSet, CityViewSet
from src.user.access_control.definitions.api import get_permission_map, check_permission

app_name = 'user'

# 🔒 Admin URL Secret (از settings می‌آد)
ADMIN_SECRET = getattr(settings, 'ADMIN_URL_SECRET', 'x7K9mP2qL5nR8tY3vZ6wC4fH1jN0bM')

# 🍯 Honeypot: URLهای فیک برای گرفتن هکرها (قبل از URLهای واقعی!)
urlpatterns = [
    # Honeypot - URLهای قدیمی که هکرها امتحان می‌کنن
    path('admin/login/', FakeAdminLoginView.as_view(), name='admin-login-honeypot'),
    path('admin/auth/login/', FakeAdminLoginView.as_view(), name='admin-auth-login-honeypot'),
    path('admin/register/', FakeAdminLoginView.as_view(), name='admin-register-honeypot'),
]

# 🔒 URLهای واقعی ادمین با Secret Path
admin_urls = [
    path(f'admin/{ADMIN_SECRET}/auth/login/', AdminLoginView.as_view(), name='admin-login'),
    path(f'admin/{ADMIN_SECRET}/auth/register/', AdminRegisterView.as_view(), name='admin-register'),
    path(f'admin/{ADMIN_SECRET}/auth/logout/', AdminLogoutView.as_view(), name='admin-logout'),
    path(f'admin/{ADMIN_SECRET}/auth/captcha/', include('src.core.security.captcha.urls', namespace='captcha')),
    path(f'admin/{ADMIN_SECRET}/management/', AdminManagementView.as_view(), name='admin-management'),
    path(f'admin/{ADMIN_SECRET}/management/<int:admin_id>/', AdminManagementView.as_view(), name='admin-management-detail'),
    path(f'admin/{ADMIN_SECRET}/management/me/', AdminManagementView.as_view(), {'action': 'me'}, name='admin-management-me'),
    path(f'admin/{ADMIN_SECRET}/management/by-public-id/<uuid:public_id>/', AdminManagementView.get_by_public_id, name='admin-management-detail-public'),
    path(f'admin/{ADMIN_SECRET}/management/bulk-delete/', AdminManagementView.as_view(), {'action': 'bulk-delete'}, name='admin-management-bulk-delete'),
    path(f'admin/{ADMIN_SECRET}/profile/', AdminProfileView.as_view(), name='admin-profile'),
    path(f'admin/{ADMIN_SECRET}/users-management/', UserManagementView.as_view(), name='user-management'),
    path(f'admin/{ADMIN_SECRET}/users-management/<int:user_id>/', UserManagementView.as_view(), name='user-management-detail'),
    path(f'admin/{ADMIN_SECRET}/users-management/bulk-delete/', UserManagementView.as_view(), {'action': 'bulk-delete'}, name='user-management-bulk-delete'),
    path(f'admin/{ADMIN_SECRET}/permissions/map/', get_permission_map, name='admin-permissions-map'),
    path(f'admin/{ADMIN_SECRET}/permissions/check/', check_permission, name='admin-permissions-check'),
]

urlpatterns += admin_urls

# ✅ در حالت DEBUG، URLهای ساده‌تر هم اضافه می‌شوند (فقط برای development)
if settings.DEBUG:
    debug_admin_urls = [
        path('admin/auth/login/', AdminLoginView.as_view(), name='admin-login-debug'),
        path('admin/auth/register/', AdminRegisterView.as_view(), name='admin-register-debug'),
        path('admin/auth/logout/', AdminLogoutView.as_view(), name='admin-logout-debug'),
        path('admin/auth/captcha/', include('src.core.security.captcha.urls', namespace='captcha-debug')),
        path('admin/management/', AdminManagementView.as_view(), name='admin-management-debug'),
        path('admin/management/<int:admin_id>/', AdminManagementView.as_view(), name='admin-management-detail-debug'),
        path('admin/management/me/', AdminManagementView.as_view(), {'action': 'me'}, name='admin-management-me-debug'),
        path('admin/permissions/map/', get_permission_map, name='admin-permissions-map-debug'),
        path('admin/permissions/check/', check_permission, name='admin-permissions-check-debug'),
    ]
    urlpatterns += debug_admin_urls

# Router برای Role و Permission (همچنان با secret path)
router = DefaultRouter()
router.register(f'admin/{ADMIN_SECRET}/roles', AdminRoleView, basename='admin-roles')
router.register(f'admin/{ADMIN_SECRET}/permissions', AdminPermissionView, basename='admin-permissions')
router.register(r'provinces', ProvinceViewSet, basename='provinces')
router.register(r'cities', CityViewSet, basename='cities')

urlpatterns += [
    path(f'admin/{ADMIN_SECRET}/roles/bulk-delete/', AdminRoleView.as_view({'post': 'bulk_delete'}), name='admin-roles-bulk-delete'),
    path('', include(router.urls)),
    
    # User URLs (بدون تغییر)
    path('user/login/', UserLoginView.as_view(), name='user-login'),
    path('user/register/', UserRegisterView.as_view(), name='user-register'),
    path('user/logout/', UserLogoutView.as_view(), name='user-logout'),
    path('user/profile/', UserProfileView.as_view(), name='user-profile'),
    
    path('token/refresh/', UserJWTRefreshView.as_view(), name='user-jwt-refresh'),
    path('mobile/send-otp/', SendOTPView.as_view(), name='send-otp'),
    path('mobile/verify-otp/', VerifyOTPView.as_view(), name='verify-otp'),
    path('mobile/otp-settings/', OTPSettingsView.as_view(), name='otp-settings'),
]