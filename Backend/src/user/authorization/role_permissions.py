"""
Centralized Role and Permission Management
All admin role definitions and permission mappings in one place
Compatible with Django 5.2.6 and Permission_System.mdc
"""

from typing import Dict, List, Any

# Base permissions that ALL admins have (regardless of their roles)
BASE_ADMIN_PERMISSIONS = [
    {
        'id': 'base_dashboard_read',
        'resource': 'dashboard',
        'action': 'read',
        'display_name': 'مشاهده Dashboard',
        'description': 'دسترسی به صفحه اصلی پنل ادمین',
        'is_base': True
    },
    {
        'id': 'base_media_read',
        'resource': 'media',
        'action': 'read',
        'display_name': 'مشاهده Media',
        'description': 'مشاهده لیست فایل‌ها و رسانه‌ها',
        'is_base': True
    },
    {
        'id': 'base_profile_read',
        'resource': 'profile',
        'action': 'read',
        'display_name': 'مشاهده پروفایل شخصی',
        'description': 'مشاهده اطلاعات پروفایل خود',
        'is_base': True
    },
    {
        'id': 'base_profile_update',
        'resource': 'profile',
        'action': 'update',
        'display_name': 'ویرایش پروفایل شخصی',
        'description': 'ویرایش اطلاعات پروفایل خود',
        'is_base': True
    }
]

# Simplified version without descriptions (for list views)
BASE_ADMIN_PERMISSIONS_SIMPLE = [
    {
        'id': perm['id'],
        'display_name': perm['display_name']
    }
    for perm in BASE_ADMIN_PERMISSIONS
]

# Role definitions with their default permissions
ADMIN_ROLE_PERMISSIONS = {
    'super_admin': {
        'display_name': 'Super Admin',
        'description': 'Full system access with all permissions. Can manage all users, content, and system settings.',
        'level': 1,
        'permissions': {
            'modules': ['all'],
            'actions': ['create', 'read', 'update', 'delete', 'export'],
            'special': ['user_management', 'system_settings', 'role_management']
        }
    },
    'content_manager': {
        'display_name': 'Content Manager',
        'description': 'Manages website content including portfolios, blog posts, categories, and media files.',
        'level': 3,
        'permissions': {
            'modules': ['portfolio', 'blog', 'categories', 'media'],
            'actions': ['create', 'read', 'update', 'delete'],
            'restrictions': ['no_user_management', 'no_system_settings']
        }
    },
    'user_manager': {
        'display_name': 'User Manager',
        'description': 'Manages website users. Can view and edit user profiles but cannot access admin users.',
        'level': 4,
        'permissions': {
            'modules': ['users', 'analytics'],
            'actions': ['read', 'update'],
            'restrictions': ['no_admin_users', 'no_delete', 'no_system_settings']
        }
    },
    'media_manager': {
        'display_name': 'Media Manager',
        'description': 'Manages media files, uploads, and file organization. Limited to media-related functions.',
        'level': 5,
        'permissions': {
            'modules': ['media'],
            'actions': ['create', 'read', 'update', 'delete'],
            'restrictions': ['file_size_limit', 'no_user_management']
        }
    },
    'analytics_viewer': {
        'display_name': 'Analytics Viewer',
        'description': 'Read-only access to analytics, statistics, and reports. Cannot modify any data.',
        'level': 6,
        'permissions': {
            'modules': ['analytics', 'users', 'portfolio', 'blog'],
            'actions': ['read'],
            'restrictions': ['read_only', 'no_user_management']
        }
    },
    'support_admin': {
        'display_name': 'Support Admin',
        'description': 'Limited support access for user assistance. Can view and edit basic user information.',
        'level': 7,
        'permissions': {
            'modules': ['users'],
            'actions': ['read', 'update'],
            'restrictions': ['limited_fields', 'no_sensitive_data', 'no_admin_users']
        }
    }
}

# Available modules in the system
AVAILABLE_MODULES = {
    'all': {
        'name': 'all',
        'display_name': 'All Modules',
        'description': 'Access to all system modules'
    },
    'users': {
        'name': 'users',
        'display_name': 'User Management',
        'description': 'Manage website users and profiles'
    },
    'media': {
        'name': 'media',
        'display_name': 'Media Management',
        'description': 'Manage files, images, and media library'
    },
    'portfolio': {
        'name': 'portfolio',
        'display_name': 'Portfolio Management',
        'description': 'Manage portfolio items and projects'
    },
    'blog': {
        'name': 'blog',
        'display_name': 'Blog Management',
        'description': 'Manage blog posts and articles'
    },
    'categories': {
        'name': 'categories',
        'display_name': 'Category Management',
        'description': 'Manage categories and taxonomies'
    },
    'analytics': {
        'name': 'analytics',
        'display_name': 'Analytics & Reports',
        'description': 'View statistics and generate reports'
    }
}

# Available actions in the system
AVAILABLE_ACTIONS = {
    'create': {
        'name': 'create',
        'display_name': 'Create',
        'description': 'Create new records'
    },
    'read': {
        'name': 'read',
        'display_name': 'Read',
        'description': 'View and read records'
    },
    'update': {
        'name': 'update',
        'display_name': 'Update',
        'description': 'Edit and update records'
    },
    'delete': {
        'name': 'delete',
        'display_name': 'Delete',
        'description': 'Delete records'
    },
    'export': {
        'name': 'export',
        'display_name': 'Export',
        'description': 'Export data and generate reports'
    },
    'all': {
        'name': 'all',
        'display_name': 'All Actions',
        'description': 'All available actions'
    }
}

# Permission validation rules
PERMISSION_VALIDATION_RULES = {
    'allowed_modules': set(AVAILABLE_MODULES.keys()),
    'allowed_actions': set(AVAILABLE_ACTIONS.keys()),
    'system_roles': {'super_admin', 'content_manager', 'user_manager', 'media_manager', 'analytics_viewer', 'support_admin'},
    'min_level': 1,
    'max_level': 10
}


def get_role_permissions(role_name: str) -> Dict[str, Any]:
    """
    Get default permissions for a specific role
    
    Args:
        role_name: Name of the admin role
        
    Returns:
        Dictionary containing role permissions
    """
    return ADMIN_ROLE_PERMISSIONS.get(role_name, {}).get('permissions', {})


# Removed auto-discovery for better performance


def validate_permissions(permissions: Dict[str, Any]) -> tuple[bool, List[str]]:
    """
    Validate permission structure and values
    
    Args:
        permissions: Permission dictionary to validate
        
    Returns:
        Tuple of (is_valid, error_messages)
    """
    errors = []
    
    if not isinstance(permissions, dict):
        return False, ["Permissions must be a dictionary"]
    
    # Validate modules
    if 'modules' in permissions:
        modules = permissions['modules']
        if not isinstance(modules, list):
            errors.append("modules must be a list")
        else:
            invalid_modules = set(modules) - PERMISSION_VALIDATION_RULES['allowed_modules']
            if invalid_modules:
                errors.append(f"Invalid modules: {', '.join(invalid_modules)}")
    
    # Validate actions
    if 'actions' in permissions:
        actions = permissions['actions']
        if not isinstance(actions, list):
            errors.append("actions must be a list")
        else:
            invalid_actions = set(actions) - PERMISSION_VALIDATION_RULES['allowed_actions']
            if invalid_actions:
                errors.append(f"Invalid actions: {', '.join(invalid_actions)}")
    
    return len(errors) == 0, errors


def check_role_hierarchy(user_level: int, target_level: int) -> bool:
    """
    Check if a user can manage a role based on hierarchy
    Lower level number = higher authority
    
    Args:
        user_level: Level of the user performing the action
        target_level: Level of the target role
        
    Returns:
        True if user can manage the target role
    """
    return user_level < target_level


def get_manageable_roles(user_roles: List[str]) -> List[str]:
    """
    Get list of roles that a user can manage based on their current roles
    
    Args:
        user_roles: List of role names the user has
        
    Returns:
        List of role names the user can manage
    """
    if 'super_admin' in user_roles:
        return list(ADMIN_ROLE_PERMISSIONS.keys())
    
    user_level = min([
        ADMIN_ROLE_PERMISSIONS[role]['level'] 
        for role in user_roles 
        if role in ADMIN_ROLE_PERMISSIONS
    ], default=10)
    
    manageable = []
    for role_name, role_data in ADMIN_ROLE_PERMISSIONS.items():
        if role_data['level'] > user_level:
            manageable.append(role_name)
    
    return manageable


def has_module_access(user_permissions: Dict[str, Any], required_modules: List[str]) -> bool:
    """
    Check if user has access to required modules
    
    Args:
        user_permissions: User's permission dictionary
        required_modules: List of required modules
        
    Returns:
        True if user has access to any of the required modules
    """
    if not isinstance(user_permissions, dict):
        return False
    
    allowed_modules = user_permissions.get('modules', [])
    
    if 'all' in allowed_modules:
        return True
    
    return any(module in allowed_modules for module in required_modules)


def has_action_permission(user_permissions: Dict[str, Any], required_action: str) -> bool:
    """
    Check if user has permission for a specific action
    
    Args:
        user_permissions: User's permission dictionary
        required_action: Required action name
        
    Returns:
        True if user has permission for the action
    """
    if not isinstance(user_permissions, dict):
        return False
    
    allowed_actions = user_permissions.get('actions', [])
    
    return 'all' in allowed_actions or required_action in allowed_actions


class RolePermissionManager:
    """
    Utility class for managing role permissions
    """
    
    @staticmethod
    def get_all_roles() -> Dict[str, Any]:
        """Get all available admin roles"""
        return ADMIN_ROLE_PERMISSIONS
    
    @staticmethod
    def get_all_modules() -> Dict[str, Any]:
        """Get all available modules"""
        return AVAILABLE_MODULES
    
    @staticmethod
    def get_all_actions() -> Dict[str, Any]:
        """Get all available actions"""
        return AVAILABLE_ACTIONS
    
    @staticmethod
    def is_system_role(role_name: str) -> bool:
        """Check if a role is a system role"""
        return role_name in PERMISSION_VALIDATION_RULES['system_roles']
    
    @staticmethod
    def get_role_level(role_name: str) -> int:
        """Get the level of a role"""
        return ADMIN_ROLE_PERMISSIONS.get(role_name, {}).get('level', 10)
    
    @staticmethod
    def can_assign_role(assigner_roles: List[str], target_role: str) -> bool:
        """Check if a user can assign a specific role"""
        if 'super_admin' in assigner_roles:
            return True
        
        assigner_level = min([
            RolePermissionManager.get_role_level(role) 
            for role in assigner_roles
        ], default=10)
        
        target_level = RolePermissionManager.get_role_level(target_role)
        
        return assigner_level < target_level
