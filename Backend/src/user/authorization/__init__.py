"""
User Authorization - Permission System for Django 5.2.6
"""

# Most used permission classes
from .admin_permission import (
    AdminRolePermission,
    UserManagementPermission,
    SimpleAdminPermission,
    SuperAdminOnly,
    ContentManagerAccess,
    UserManagerAccess,
    MediaManagerAccess,
    require_admin_roles,
    require_module_access
)

# ViewSets for admin panel
from .admin_role_view import AdminRoleView
from .admin_permission_view import AdminPermissionView

# Role management
from .role_permissions import ADMIN_ROLE_PERMISSIONS, AVAILABLE_MODULES
from .roles_config import (
    SYSTEM_ROLES,
    get_role_config,
    get_role_display_name,
    get_default_permissions,
    get_all_role_configs,
    validate_role_permissions
)
from .create_admin_roles import (
    create_default_admin_roles,
    ensure_admin_roles_exist,
    get_role_summary
)

# Profile helpers for serializers
# Removed - not needed

# Manual system for maximum performance

__all__ = [
    # Most used classes
    "AdminRolePermission",
    "UserManagementPermission",
    "SimpleAdminPermission",
    "SuperAdminOnly",
    "ContentManagerAccess", 
    "UserManagerAccess",
    "MediaManagerAccess",
    "require_admin_roles",
    
    # ViewSets
    "AdminRoleView",
    "AdminPermissionView",
    
    # Constants
    "ADMIN_ROLE_PERMISSIONS",
    "AVAILABLE_MODULES",
    "SYSTEM_ROLES",
    
    # Role Config Functions
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