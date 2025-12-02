from .admin_permission import (
    AdminRolePermission,
    RequireModuleAccess,
    RequireAdminRole,
    UserManagementPermission,
    SimpleAdminPermission,
    SuperAdminOnly,
    require_admin_roles,
    require_module_access
)

import src.user.permissions.permission_factory as permission_factory
for class_name in permission_factory.__all__:
    globals()[class_name] = getattr(permission_factory, class_name)

try:
    globals()['ContentManagerAccess'] = globals().get('BlogManagerAccess')
    globals()['UserManagerAccess'] = globals().get('UsersManagerAccess')
    globals()['AnalyticsViewerAccess'] = globals().get('StatisticsManagerAccess')
    globals()['SupportAdminAccess'] = globals().get('UsersManagerAccess')
    globals()['PanelSettingsAccess'] = globals().get('PanelManagerAccess')
    globals()['AIManagerAccess'] = globals().get('AiManagerAccess')
except:
    pass

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
    # DRF Permission classes
    "AdminRolePermission",
    "UserManagementPermission",
    "SimpleAdminPermission",
    "SuperAdminOnly",
    "RequireModuleAccess",
    "RequireAdminRole",
    "require_admin_roles",
    "require_module_access",
    
    # Auto-generated module access classes
    "ContentManagerAccess",
    "PortfolioManagerAccess",
    "UserManagerAccess",
    "MediaManagerAccess",
    "BlogManagerAccess",
    "AnalyticsViewerAccess",
    "SupportAdminAccess",
    "FormsManagerAccess",
    "PagesManagerAccess",
    "SettingsManagerAccess",
    "PanelSettingsAccess",
    "PanelManagerAccess",
    "EmailManagerAccess",
    "AIManagerAccess",
    "AiManagerAccess",
    "StatisticsManagerAccess",
    "StatisticsViewerAccess",
    "UsersManagerAccess",
    
    # ViewSets
    "AdminRoleView",
    "AdminPermissionView",
    
    # Config (re-exported from permissions.config)
    "SYSTEM_ROLES",
    "AVAILABLE_MODULES",
    "AVAILABLE_ACTIONS",
    "ADMIN_ROLE_PERMISSIONS",  # Legacy
    
    # Helper functions (re-exported from permissions.config)
    "get_role_config",
    "get_role_display_name",
    "get_default_permissions",
    "get_all_role_configs",
    "validate_role_permissions",
    
    # Role Setup Utilities
    "create_default_admin_roles",
    "ensure_admin_roles_exist",
    "get_role_summary",
]