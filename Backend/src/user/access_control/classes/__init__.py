"""Permission Classes - تمام کلاس‌ها و instance های permission"""

# Base Permission Classes
from .admin_permission import (
    AdminRolePermission,
    RequireModuleAccess,
    RequireAdminRole,
    UserManagementPermission,
    SimpleAdminPermission,
    SuperAdminOnly,
    require_admin_roles,
    require_module_access,
    RequirePermission,
    AdminPermissionCache,
)

# Views
from .admin_role_view import AdminRoleView
from .admin_permission_view import AdminPermissionView

# Utilities
from .role_utils import (
    create_default_admin_roles,
    ensure_admin_roles_exist,
    get_role_summary
)

# Permission Instances - برای استفاده مستقیم در ViewSets
from .instances import (
    blog_permission,
    portfolio_permission,
    analytics_permission,
    analytics_any_permission,  # جدید
    media_permission,
    user_permission,
    admin_permission,
    ai_permission,
    ai_any_permission,  # جدید: هر نوع دسترسی AI
    panel_permission,
    email_permission,
    ticket_permission,
    chatbot_permission,
    form_permission,
    page_permission,
    super_admin_permission,
)

__all__ = [
    # Base Permission Classes
    "AdminRolePermission",
    "RequireModuleAccess",
    "RequireAdminRole",
    "UserManagementPermission",
    "SimpleAdminPermission",
    "SuperAdminOnly",
    "require_admin_roles",
    "require_module_access",
    "RequirePermission",
    "AdminPermissionCache",
    # Views
    "AdminRoleView",
    "AdminPermissionView",
    # Utilities
    "create_default_admin_roles",
    "ensure_admin_roles_exist",
    "get_role_summary",
    # Permission Instances
    "blog_permission",
    "portfolio_permission",
    "analytics_permission",
    "analytics_any_permission",  # جدید
    "media_permission",
    "user_permission",
    "admin_permission",
    "ai_permission",
    "ai_any_permission",  # جدید
    "panel_permission",
    "email_permission",
    "ticket_permission",
    "chatbot_permission",
    "form_permission",
    "page_permission",
    "super_admin_permission",
]