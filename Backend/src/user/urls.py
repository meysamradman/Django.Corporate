from django.urls import path, include
from rest_framework.routers import DefaultRouter
from src.user.auth.user_jwt_refresh import UserJWTRefreshView
from src.user.views.admin import (
    AdminLoginView, AdminRegisterView, AdminLogoutView, 
    AdminManagementView, AdminProfileView, UserManagementView
)
from src.user.authorization import AdminRoleView, AdminPermissionView
from src.user.views.otp_views import SendOTPView, VerifyOTPView, OTPSettingsView
from src.user.views.user.user_login_view import UserLoginView
from src.user.views.user.user_logout_view import UserLogoutView
from src.user.views.user.user_register_view import UserRegisterView
from src.user.views.user.user_profile_view import UserProfileView
from src.user.views.location_views import ProvinceViewSet, CityViewSet
from src.user.permissions.api import get_permission_map, check_permission

app_name = 'user'

urlpatterns = [
    path('admin/register/', AdminRegisterView.as_view(), name='admin-register'),
    path("admin/login/", AdminLoginView.as_view(), name="admin-login"),
    path('admin/logout/', AdminLogoutView.as_view(), name='admin-logout'),
    path('admin/auth/captcha/', include('src.core.security.captcha.urls', namespace='captcha')),
    path('admin/management/', AdminManagementView.as_view(), name='admin-management'),
    path('admin/management/<int:admin_id>/', AdminManagementView.as_view(), name='admin-management-detail'),
    path('admin/management/me/', AdminManagementView.as_view(), {'action': 'me'}, name='admin-management-me'),
    path('admin/management/by-public-id/<uuid:public_id>/', AdminManagementView.get_by_public_id, name='admin-management-detail-public'),
    path('admin/management/bulk-delete/', AdminManagementView.as_view(), {'action': 'bulk-delete'}, name='admin-management-bulk-delete'),
    path('admin/profile/', AdminProfileView.as_view(), name='admin-profile'),
    path('admin/users-management/', UserManagementView.as_view(), name='user-management'),
    path('admin/users-management/<int:user_id>/', UserManagementView.as_view(), name='user-management-detail'),
    path('admin/users-management/bulk-delete/', UserManagementView.as_view(), {'action': 'bulk-delete'}, name='user-management-bulk-delete'),
]

router = DefaultRouter()
router.register(r'admin/roles', AdminRoleView, basename='admin-roles')
router.register(r'admin/permissions', AdminPermissionView, basename='admin-permissions')
router.register(r'provinces', ProvinceViewSet, basename='provinces')
router.register(r'cities', CityViewSet, basename='cities')

urlpatterns += [
    path('admin/roles/bulk-delete/', AdminRoleView.as_view({'post': 'bulk_delete'}), name='admin-roles-bulk-delete'),
    path('', include(router.urls)),
    
    path('user/login/', UserLoginView.as_view(), name='user-login'),
    path('user/register/', UserRegisterView.as_view(), name='user-register'),
    path('user/logout/', UserLogoutView.as_view(), name='user-logout'),
    path('user/profile/', UserProfileView.as_view(), name='user-profile'),
    
    path('token/refresh/', UserJWTRefreshView.as_view(), name='user-jwt-refresh'),
    path('mobile/send-otp/', SendOTPView.as_view(), name='send-otp'),
    path('mobile/verify-otp/', VerifyOTPView.as_view(), name='verify-otp'),
    path('mobile/otp-settings/', OTPSettingsView.as_view(), name='otp-settings'),
    
    path('admin/permissions/map/', get_permission_map, name='admin-permissions-map'),
    path('admin/permissions/check/', check_permission, name='admin-permissions-check'),
]