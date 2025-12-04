"""
Authorization module for admin permissions and roles.
Provides permission classes, role management, and access control.
"""

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

# Import dynamically generated permission classes
import src.user.permissions.permission_factory as permission_factory

# Store generated classes in a dictionary first
_permission_classes = {}
for class_name in permission_factory.__all__:
    _permission_classes[class_name] = getattr(permission_factory, class_name)

# Create specific manager access classes
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

# Create aliases for compatibility
ContentManagerAccess = BlogManagerAccess
UserManagerAccess = UsersManagerAccess
AnalyticsViewerAccess = StatisticsManagerAccess
SupportAdminAccess = UsersManagerAccess
PanelSettingsAccess = PanelManagerAccess
AIManagerAccess = AiManagerAccess

from .admin_role_view import AdminRoleView
from .admin_permission_view import AdminPermissionView

from src.user.permissions.config import (
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

from src.user.authorization.role_utils import (
    create_default_admin_roles,
    ensure_admin_roles_exist,
    get_role_summary
)

__all__ = [
    # Permission classes
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
    
    # Manager Access Classes
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
    
    # Aliases (deprecated, for backward compatibility)
    "ContentManagerAccess",
    "UserManagerAccess",
    "AnalyticsViewerAccess",
    "SupportAdminAccess",
    "PanelSettingsAccess",
    "AIManagerAccess",
    
    # Views
    "AdminRoleView",
    "AdminPermissionView",
    
    # Config
    "SYSTEM_ROLES",
    "AVAILABLE_MODULES",
    "AVAILABLE_ACTIONS",
    "ADMIN_ROLE_PERMISSIONS",
    "get_role_config",
    "get_role_display_name",
    "get_default_permissions",
    "get_all_role_configs",
    "validate_role_permissions",
    
    # Role utils
    "create_default_admin_roles",
    "ensure_admin_roles_exist",
    "get_role_summary",
]