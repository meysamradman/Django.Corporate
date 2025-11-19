"""
User Permissions package - Unified Config

Centralized permission registry, validator, and configuration.
All permissions and roles are now in config.py (Single Source of Truth)
"""
from .registry import Permission, PermissionRegistry
from .validator import PermissionValidator
from .config import (
    PERMISSIONS,
    SYSTEM_ROLES,
    AVAILABLE_MODULES,
    AVAILABLE_ACTIONS,
    BASE_ADMIN_PERMISSIONS,
    RoleConfig,
    # Helper functions - Permissions
    get_all_permissions,
    get_permission,
    get_permissions_by_module,
    get_permissions_by_action,
    # Helper functions - Roles
    get_role_config,
    get_role_display_name,
    get_default_permissions,
    is_super_admin_role,
    get_system_roles,
    get_available_roles,
    get_user_role_display_text,
    get_module_display_name,
    get_action_display_name,
    validate_role_permissions,
    get_role_permissions_for_creation,
    get_all_role_configs,
)

__all__ = [
    # Core classes
    "Permission",
    "PermissionRegistry",
    "PermissionValidator",
    # Data structures
    "PERMISSIONS",
    "SYSTEM_ROLES",
    "AVAILABLE_MODULES",
    "AVAILABLE_ACTIONS",
    "BASE_ADMIN_PERMISSIONS",
    "RoleConfig",
    # Helper functions - Permissions
    "get_all_permissions",
    "get_permission",
    "get_permissions_by_module",
    "get_permissions_by_action",
    # Helper functions - Roles
    "get_role_config",
    "get_role_display_name",
    "get_default_permissions",
    "is_super_admin_role",
    "get_system_roles",
    "get_available_roles",
    "get_user_role_display_text",
    "get_module_display_name",
    "get_action_display_name",
    "validate_role_permissions",
    "get_role_permissions_for_creation",
    "get_all_role_configs",
]
