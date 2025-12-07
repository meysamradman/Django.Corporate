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

import src.user.access_control.definitions.permission_factory as permission_factory

_permission_classes = {}
for class_name in permission_factory.__all__:
    _permission_classes[class_name] = getattr(permission_factory, class_name)

# NOTE: Blog and Portfolio manager access classes are now auto-generated from MODULE_MAPPINGS
BlogManagerAccess = _permission_classes.get('BlogManagerAccess')
PortfolioManagerAccess = _permission_classes.get('PortfolioManagerAccess')
UsersManagerAccess = _permission_classes.get('UsersManagerAccess')
MediaManagerAccess = _permission_classes.get('MediaManagerAccess')
FormsManagerAccess = _permission_classes.get('FormsManagerAccess')
PagesManagerAccess = _permission_classes.get('PagesManagerAccess')
SettingsManagerAccess = _permission_classes.get('SettingsManagerAccess')
PanelManagerAccess = _permission_classes.get('PanelManagerAccess')
EmailManagerAccess = _permission_classes.get('EmailManagerAccess')
AiManagerAccess = _permission_classes.get('AiManagerAccess')
StatisticsManagerAccess = _permission_classes.get('StatisticsManagerAccess')
StatisticsViewerAccess = _permission_classes.get('StatisticsViewerAccess')
ChatbotManagerAccess = _permission_classes.get('ChatbotManagerAccess')
TicketManagerAccess = _permission_classes.get('TicketManagerAccess')
AdminManagerAccess = _permission_classes.get('AdminManagerAccess')

# ContentManagerAccess = BlogManagerAccess  # Removed - app-specific
UserManagerAccess = UsersManagerAccess
AnalyticsViewerAccess = StatisticsManagerAccess
SupportAdminAccess = UsersManagerAccess
PanelSettingsAccess = PanelManagerAccess
AIManagerAccess = AiManagerAccess

from .admin_role_view import AdminRoleView
from .admin_permission_view import AdminPermissionView

from src.user.access_control.definitions.config import (
    SYSTEM_ROLES,
    AVAILABLE_MODULES,
    AVAILABLE_ACTIONS,
    get_role_config,
    get_role_display_name,
    get_default_permissions,
    get_all_role_configs,
    validate_role_permissions
)

ADMIN_ROLE_PERMISSIONS = SYSTEM_ROLES

from .role_utils import (
    create_default_admin_roles,
    ensure_admin_roles_exist,
    get_role_summary
)

__all__ = [
    "AdminRolePermission",
    "UserManagementPermission",
    "SimpleAdminPermission",
    "SuperAdminOnly",
    "RequireModuleAccess",
    "RequireAdminRole",
    "RequirePermission",
    "require_admin_roles",
    "require_module_access",
    "AdminPermissionCache",
    "BlogManagerAccess",
    "PortfolioManagerAccess",
    "UsersManagerAccess",
    "MediaManagerAccess",
    "FormsManagerAccess",
    "PagesManagerAccess",
    "SettingsManagerAccess",
    "PanelManagerAccess",
    "EmailManagerAccess",
    "AiManagerAccess",
    "StatisticsManagerAccess",
    "StatisticsViewerAccess",
    "ChatbotManagerAccess",
    "TicketManagerAccess",
    "AdminManagerAccess",
    "UserManagerAccess",
    "AnalyticsViewerAccess",
    "SupportAdminAccess",
    "PanelSettingsAccess",
    "AIManagerAccess",
    "AdminRoleView",
    "AdminPermissionView",
    "SYSTEM_ROLES",
    "AVAILABLE_MODULES",
    "AVAILABLE_ACTIONS",
    "ADMIN_ROLE_PERMISSIONS",
    "get_role_config",
    "get_role_display_name",
    "get_default_permissions",
    "get_all_role_configs",
    "validate_role_permissions",
    "create_default_admin_roles",
    "ensure_admin_roles_exist",
    "get_role_summary",
]