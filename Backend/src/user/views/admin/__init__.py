"""
Admin Views - For admin panel functionalities.
"""
from .admin_login_view import AdminLoginView
from .admin_logout_view import AdminLogoutView
from .admin_register_view import AdminRegisterView
from .admin_managment_view import AdminManagementView
from .admin_profile_view import AdminProfileView
from .user_management_view import UserManagementView

__all__ = [
    "AdminLoginView",
    "AdminLogoutView",
    "AdminRegisterView",
    "AdminManagementView",
    "AdminProfileView",
    "UserManagementView",
]
