"""
🔥 UNIFIED PERMISSIONS & ROLES CONFIG - Single Source of Truth
این فایل مرکزی و واحد برای تعریف همه Permissions و Roles است

بخش‌های این فایل:
1. PERMISSIONS - تعریف همه دسترسی‌های موجود در سیستم
2. SYSTEM_ROLES - تعریف همه نقش‌های پیش‌فرض سیستم
3. AVAILABLE_MODULES - ماژول‌های قابل دسترسی
4. AVAILABLE_ACTIONS - عملیات‌های قابل انجام
5. Helper Functions - توابع کمکی برای کار با permissions و roles

Compatible with Django 5.2.6
"""

from typing import Dict, List, Tuple, Any, Optional
from dataclasses import dataclass

from src.user.messages import ROLE_TEXT

# Import modular permissions
from .modules.base import BASE_PERMISSIONS
from .modules.panel import PANEL_PERMISSIONS
from .modules.media import MEDIA_PERMISSIONS
from .modules.users import USERS_PERMISSIONS
from .modules.content import CONTENT_PERMISSIONS
from .modules.communication import COMMUNICATION_PERMISSIONS
from .modules.ai import AI_PERMISSIONS
from .modules.statistics import STATISTICS_PERMISSIONS
from .modules.management import MANAGEMENT_PERMISSIONS


# =============================================================================
# PART 1: PERMISSIONS CONFIGURATION
# =============================================================================

# Base permissions for all admins
# These permissions are automatically granted to every admin user
# Only includes truly essential permissions:
# - View general dashboard (without sensitive data)
# - View and edit own profile
# Note: Media is NO LONGER in BASE - must be granted separately per role
BASE_ADMIN_PERMISSIONS = {
    'dashboard.read': {
        'module': 'statistics',
        'action': 'read',
        'display_name': 'View Dashboard',
        'description': 'Access the admin dashboard overview (safe, general info)',
        'is_base': True,
    },
    'profile.read': {
        'module': 'admin',
        'action': 'read',
        'display_name': 'View Personal Profile',
        'description': 'View own admin profile information',
        'is_base': True,
    },
    'profile.update': {
        'module': 'admin',
        'action': 'update',
        'display_name': 'Update Personal Profile',
        'description': 'Update own admin profile information',
        'is_base': True,
    },
}

# All available permissions in the system
# Merged from modular files for better organization
# ✅ BASE_ADMIN_PERMISSIONS هم اضافه می‌شود تا در لیست کامل permissions باشد
PERMISSIONS: Dict[str, Dict[str, Any]] = {
    **BASE_ADMIN_PERMISSIONS,  # Base permissions for all admins
    **BASE_PERMISSIONS,         # Base module permissions
    **PANEL_PERMISSIONS,        # Panel and Pages permissions
    **MEDIA_PERMISSIONS,        # Media library permissions
    **USERS_PERMISSIONS,        # Admin and User management permissions
    **CONTENT_PERMISSIONS,       # Blog and Portfolio permissions
    **COMMUNICATION_PERMISSIONS, # Email and Ticket permissions
    **AI_PERMISSIONS,           # AI tools permissions
    **STATISTICS_PERMISSIONS,    # Statistics permissions
    **MANAGEMENT_PERMISSIONS,    # Forms, Settings, Chatbot permissions
}


# =============================================================================
# PART 2: ROLES CONFIGURATION
# =============================================================================

@dataclass
class RoleConfig:
    """Configuration for a system role"""
    name: str
    display_name: str
    display_name_short: str
    description: str
    level: int
    is_system_role: bool
    default_permissions: Dict[str, Any]


def _get_role_text(role_name: str) -> Dict[str, str]:
    """Return localized text for a given role name."""
    defaults = {
        'display_name': role_name,
        'display_name_short': role_name,
        'description': role_name,
    }
    text = ROLE_TEXT.get(role_name, {})
    return {
        'display_name': text.get('display_name', defaults['display_name']),
        'display_name_short': text.get('display_name_short', defaults['display_name_short']),
        'description': text.get('description', defaults['description']),
    }


def _build_role_config(
    name: str,
    level: int,
    permissions: Dict[str, Any],
    is_system_role: bool = True,
) -> RoleConfig:
    """Helper to create RoleConfig instances using centralized text resources."""
    text = _get_role_text(name)
    return RoleConfig(
        name=name,
        display_name=text['display_name'],
        display_name_short=text['display_name_short'],
        description=text['description'],
        level=level,
        is_system_role=is_system_role,
        default_permissions=permissions,
    )


# System roles configuration
SYSTEM_ROLES: Dict[str, RoleConfig] = {
    'super_admin': _build_role_config(
        'super_admin',
        level=1,
        permissions={
            'modules': ['all'],
            'actions': ['all'],
            'special': ['user_management', 'system_settings', 'role_management']
        },
    ),
    'content_manager': _build_role_config(
        'content_manager',
        level=2,
        permissions={
            'modules': [
                'portfolio',
                'blog',
                'media',
                'blog_categories',
                'blog_tags',
                'portfolio_categories',
                'portfolio_tags',
                'portfolio_options',
                'portfolio_option_values'
            ],
            'actions': ['create', 'read', 'update', 'delete'],
            'restrictions': ['no_user_management', 'no_system_settings']
        },
    ),
    'blog_manager': _build_role_config(
        'blog_manager',
        level=3,
        permissions={
            'modules': ['blog', 'blog_categories', 'blog_tags'],
            'actions': ['create', 'read', 'update', 'delete'],
            'restrictions': ['no_portfolio_access', 'no_user_management']
        },
    ),
    'portfolio_manager': _build_role_config(
        'portfolio_manager',
        level=3,
        permissions={
            'modules': [
                'portfolio',
                'portfolio_categories',
                'portfolio_tags',
                'portfolio_options',
                'portfolio_option_values'
            ],
            'actions': ['create', 'read', 'update', 'delete'],
            'restrictions': ['no_blog_access', 'no_user_management']
        },
    ),
    'media_manager': _build_role_config(
        'media_manager',
        level=4,
        permissions={
            'modules': ['media'],
            'actions': ['create', 'read', 'update', 'delete'],
            'restrictions': ['file_size_limit', 'no_user_management']
        },
    ),
    'forms_manager': _build_role_config(
        'forms_manager',
        level=4,
        permissions={
            'modules': ['forms'],
            'actions': ['manage'],
            'restrictions': ['no_user_management', 'no_system_settings']
        },
    ),
    'pages_manager': _build_role_config(
        'pages_manager',
        level=4,
        permissions={
            'modules': ['pages'],
            'actions': ['manage'],
            'restrictions': ['no_blog_access', 'no_portfolio_access']
        },
    ),
    'chatbot_manager': _build_role_config(
        'chatbot_manager',
        level=4,
        permissions={
            'modules': ['chatbot'],
            'actions': ['manage'],
            'restrictions': ['no_user_management', 'no_system_settings']
        },
    ),
    'email_manager': _build_role_config(
        'email_manager',
        level=5,
        permissions={
            'modules': ['email'],
            'actions': ['create', 'read', 'update', 'delete'],
            'restrictions': ['no_user_management', 'no_system_settings']
        },
    ),
    'ticket_manager': _build_role_config(
        'ticket_manager',
        level=5,
        permissions={
            'modules': ['ticket'],
            'actions': ['create', 'read', 'update', 'delete'],
            'restrictions': ['no_user_management', 'no_system_settings']
        },
    ),
    'ai_manager': _build_role_config(
        'ai_manager',
        level=5,
        permissions={
            'modules': ['ai'],
            'actions': ['manage'],
            'restrictions': ['no_user_management']
        },
    ),
    'settings_manager': _build_role_config(
        'settings_manager',
        level=6,
        permissions={
            'modules': ['settings'],
            'actions': ['read', 'update', 'manage'],
            'restrictions': ['no_delete', 'audit_required']
        },
    ),
    'panel_manager': _build_role_config(
        'panel_manager',
        level=6,
        permissions={
            'modules': ['panel'],
            'actions': ['read', 'update', 'manage'],
            'restrictions': ['no_user_management', 'no_system_settings']
        },
    ),
    'statistics_viewer': _build_role_config(
        'statistics_viewer',
        level=7,
        permissions={
            'modules': ['statistics'],
            'actions': ['read'],
            'restrictions': ['read_only', 'no_user_management']
        },
    ),
    'user_manager': _build_role_config(
        'user_manager',
        level=7,
        permissions={
            'modules': ['users'],
            'actions': ['read', 'update'],
            'restrictions': ['no_admin_users', 'no_delete', 'no_system_settings']
        },
    ),
}


# =============================================================================
# PART 3: MODULES & ACTIONS METADATA
# =============================================================================

# Available modules in the system
# ✅ این شامل همه ماژول‌هایی است که در modules تعریف شده
AVAILABLE_MODULES = {
    'all': {
        'name': 'all',
        'display_name': 'All Modules',
        'description': 'Access to every module in the system.'
    },
    'dashboard': {
        'name': 'dashboard',
        'display_name': 'Dashboard',
        'description': 'Main admin dashboard and overview.'
    },
    'statistics': {
        'name': 'statistics',
        'display_name': 'Statistics Center',
        'description': 'View KPI dashboards and system metrics.'
    },
    'admin': {
        'name': 'admin',
        'display_name': 'Admin Management',
        'description': 'Manage admin accounts, roles, and privileges.'
    },
    'users': {
        'name': 'users',
        'display_name': 'User Management',
        'description': 'Manage website users and their profiles.'
    },
    'media': {
        'name': 'media',
        'display_name': 'Media Library',
        'description': 'Manage uploads, files, and the media library.'
    },
    'blog': {
        'name': 'blog',
        'display_name': 'Blog Management',
        'description': 'Manage blog posts, drafts, and editorial workflow.'
    },
    'blog_categories': {
        'name': 'blog_categories',
        'display_name': 'Blog Categories',
        'description': 'Manage blog category taxonomy.'
    },
    'blog_tags': {
        'name': 'blog_tags',
        'display_name': 'Blog Tags',
        'description': 'Manage blog tags and keywords.'
    },
    'portfolio': {
        'name': 'portfolio',
        'display_name': 'Portfolio Management',
        'description': 'Manage portfolio items, projects, and collections.'
    },
    'portfolio_categories': {
        'name': 'portfolio_categories',
        'display_name': 'Portfolio Categories',
        'description': 'Manage portfolio category taxonomy.'
    },
    'portfolio_tags': {
        'name': 'portfolio_tags',
        'display_name': 'Portfolio Tags',
        'description': 'Manage portfolio tags and labels.'
    },
    'portfolio_options': {
        'name': 'portfolio_options',
        'display_name': 'Portfolio Options',
        'description': 'Manage portfolio option definitions.'
    },
    'portfolio_option_values': {
        'name': 'portfolio_option_values',
        'display_name': 'Portfolio Option Values',
        'description': 'Manage portfolio option value entries.'
    },
    'email': {
        'name': 'email',
        'display_name': 'Email Center',
        'description': 'Manage outbound emails, templates, and campaigns.'
    },
    'ticket': {
        'name': 'ticket',
        'display_name': 'Ticket Management',
        'description': 'Manage support tickets and customer inquiries.'
    },
    'ai': {
        'name': 'ai',
        'display_name': 'AI Tools',
        'description': 'Access AI assistants, prompts, and automations.'
    },
    'chatbot': {
        'name': 'chatbot',
        'display_name': 'Chatbot Management',
        'description': 'Manage chatbot settings and FAQs.'
    },
    'forms': {
        'name': 'forms',
        'display_name': 'Forms Builder',
        'description': 'Create and maintain contact and custom forms.'
    },
    'pages': {
        'name': 'pages',
        'display_name': 'Pages Management',
        'description': 'Manage static pages, landing content, and metadata.'
    },
    'settings': {
        'name': 'settings',
        'display_name': 'System Settings',
        'description': 'Manage global configuration and security.'
    },
    'panel': {
        'name': 'panel',
        'display_name': 'Panel Settings',
        'description': 'Manage admin panel branding and configuration.'
    }
}

# Available actions in the system
# ✅ این فقط action های پایه است - permission های خاص در PERMISSIONS تعریف می‌شوند
AVAILABLE_ACTIONS = {
    'all': {
        'name': 'all',
        'display_name': 'All Actions',
        'description': 'All available operations.'
    },
    'create': {
        'name': 'create',
        'display_name': 'Create',
        'description': 'Create new records.'
    },
    'read': {
        'name': 'read',
        'display_name': 'Read',
        'description': 'View existing records.'
    },
    'update': {
        'name': 'update',
        'display_name': 'Update',
        'description': 'Edit and update records.'
    },
    'delete': {
        'name': 'delete',
        'display_name': 'Delete',
        'description': 'Remove records.'
    },
    'manage': {
        'name': 'manage',
        'display_name': 'Manage',
        'description': 'Full access to all operations (view, create, update, delete).'
    },
    'export': {
        'name': 'export',
        'display_name': 'Export',
        'description': 'Export data and generate reports.'
    },
    'import': {
        'name': 'import',
        'display_name': 'Import',
        'description': 'Import data from external files.'
    }
}


# =============================================================================
# PART 4: VALIDATION RULES
# =============================================================================

PERMISSION_VALIDATION_RULES = {
    'allowed_modules': set(AVAILABLE_MODULES.keys()),
    'allowed_actions': set(AVAILABLE_ACTIONS.keys()),
    'system_roles': set(SYSTEM_ROLES.keys()),
    'min_level': 1,
    'max_level': 10
}


# =============================================================================
# PART 5: HELPER FUNCTIONS - PERMISSIONS
# =============================================================================

def get_all_permissions() -> Dict[str, Dict[str, Any]]:
    """Get all permissions"""
    return PERMISSIONS.copy()


def get_permission(permission_id: str) -> Dict[str, Any] | None:
    """Get a single permission"""
    return PERMISSIONS.get(permission_id)


def get_permissions_by_module(module: str) -> List[Tuple[str, Dict[str, Any]]]:
    """Get all permissions for a module"""
    return [(pid, p) for pid, p in PERMISSIONS.items() if p['module'] == module]


def get_permissions_by_action(action: str) -> List[Tuple[str, Dict[str, Any]]]:
    """Get all permissions for an action"""
    return [(pid, p) for pid, p in PERMISSIONS.items() if p['action'] == action]


# =============================================================================
# PART 6: HELPER FUNCTIONS - ROLES
# =============================================================================

def get_role_config(role_name: str) -> Optional[RoleConfig]:
    """Return the role configuration for a given name"""
    return SYSTEM_ROLES.get(role_name)


def get_role_display_name(role_name: str, short: bool = False) -> str:
    """Return the display label for a role"""
    config = get_role_config(role_name)
    if not config:
        return role_name
    
    return config.display_name_short if short else config.display_name


def get_default_permissions(role_name: str) -> Dict[str, Any]:
    """Return the default permission payload for a role"""
    config = get_role_config(role_name)
    return config.default_permissions if config else {}


def is_super_admin_role(role_name: str) -> bool:
    """Check whether the provided role name belongs to the super admin"""
    return role_name == 'super_admin'


def get_system_roles() -> List[RoleConfig]:
    """Return all system roles ordered by their level"""
    return sorted(SYSTEM_ROLES.values(), key=lambda x: x.level)


def get_available_roles(current_user_level: int = 10) -> List[RoleConfig]:
    """Return assignable roles for a user based on their current level"""
    return [role for role in get_system_roles() if role.level > current_user_level]


def get_user_role_display_text(user) -> str:
    """Return a human-readable label for the primary role of the user"""
    if not user:
        return 'No role assigned'
    
    if getattr(user, 'is_superuser', False):
        return get_role_display_name('super_admin', short=True)
    
    roles = []
    try:
        if hasattr(user, 'adminuserrole_set'):
            user_role_assignments = user.adminuserrole_set.filter(is_active=True)
            roles = [ur.role.name for ur in user_role_assignments]
    except Exception:
        pass
    
    if not roles:
        return 'No role assigned'
    
    main_role = roles[0]
    return get_role_display_name(main_role, short=True)


def get_module_display_name(module_name: str) -> str:
    """Return the display label for a module"""
    module_info = AVAILABLE_MODULES.get(module_name, {})
    return module_info.get('display_name', module_name)


def get_action_display_name(action_name: str) -> str:
    """Return the display label for an action"""
    action_info = AVAILABLE_ACTIONS.get(action_name, {})
    return action_info.get('display_name', action_name)


def validate_role_permissions(permissions: Dict[str, Any]) -> tuple[bool, List[str]]:
    """Validate the structure of a permission payload"""
    errors = []
    
    if not isinstance(permissions, dict):
        return False, ["Permissions must be a dictionary"]
    
    if 'modules' in permissions:
        modules = permissions['modules']
        if not isinstance(modules, list):
            errors.append("modules must be a list")
        else:
            invalid_modules = set(modules) - PERMISSION_VALIDATION_RULES['allowed_modules']
            if invalid_modules and 'all' not in modules:
                errors.append(f"Invalid modules: {', '.join(invalid_modules)}")
    
    if 'actions' in permissions:
        actions = permissions['actions']
        if not isinstance(actions, list):
            errors.append("actions must be a list")
        else:
            invalid_actions = set(actions) - PERMISSION_VALIDATION_RULES['allowed_actions']
            if invalid_actions and 'all' not in actions:
                errors.append(f"Invalid actions: {', '.join(invalid_actions)}")
    
    return len(errors) == 0, errors


def get_role_permissions_for_creation(role_name: str) -> Dict[str, Any]:
    """
    Return the permission payload ready to be persisted in the database
    Intended for use within create_admin_roles.py
    """
    config = get_role_config(role_name)
    if not config:
        return {}
    
    return config.default_permissions


def get_all_role_configs() -> Dict[str, Dict[str, Any]]:
    """
    Return all role configurations as a serializable dictionary
    Intended for use within create_admin_roles.py
    """
    configs = {}
    for role_name, role_config in SYSTEM_ROLES.items():
        configs[role_name] = {
            'display_name': role_config.display_name,
            'description': role_config.description,
            'level': role_config.level,
            'permissions': role_config.default_permissions,
            'is_system_role': role_config.is_system_role
        }
    return configs
