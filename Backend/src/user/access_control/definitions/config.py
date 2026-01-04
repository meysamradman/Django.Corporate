from typing import Dict, List, Tuple, Any, Optional
from dataclasses import dataclass

from src.user.messages import ROLE_TEXT

from .modules.base import BASE_PERMISSIONS
from .modules.media import MEDIA_PERMISSIONS
from .modules.users import USERS_PERMISSIONS
from .modules.blog import BLOG_PERMISSIONS
from .modules.portfolio import PORTFOLIO_PERMISSIONS
from .modules.email import EMAIL_PERMISSIONS
from .modules.ticket import TICKET_PERMISSIONS
from .modules.ai import AI_PERMISSIONS
from .modules.analytics import ANALYTICS_PERMISSIONS
from .modules.management import MANAGEMENT_PERMISSIONS
from .modules.real_estate import REAL_ESTATE_PERMISSIONS


BASE_ADMIN_PERMISSIONS = BASE_PERMISSIONS

PERMISSIONS: Dict[str, Dict[str, Any]] = {
    **BASE_PERMISSIONS,
    **MEDIA_PERMISSIONS,
    **USERS_PERMISSIONS,
    **BLOG_PERMISSIONS,
    **PORTFOLIO_PERMISSIONS,
    **EMAIL_PERMISSIONS,
    **TICKET_PERMISSIONS,
    **AI_PERMISSIONS,
    **ANALYTICS_PERMISSIONS,
    **MANAGEMENT_PERMISSIONS,
    **REAL_ESTATE_PERMISSIONS,
}

@dataclass
class RoleConfig:
    name: str
    display_name: str
    display_name_short: str
    description: str
    level: int
    is_system_role: bool
    default_permissions: Dict[str, Any]


def _get_role_text(role_name: str) -> Dict[str, str]:
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
    'blog_manager': _build_role_config(
        'blog_manager',
        level=3,
        permissions={
            'modules': ['blog'],
            'actions': ['create', 'read', 'update', 'delete'],
            'restrictions': ['no_user_management', 'no_system_settings']
        },
    ),
    'portfolio_manager': _build_role_config(
        'portfolio_manager',
        level=3,
        permissions={
            'modules': ['portfolio'],
            'actions': ['create', 'read', 'update', 'delete'],
            'restrictions': ['no_user_management', 'no_system_settings']
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
    'panel_manager': _build_role_config(
        'panel_manager',
        level=4,
        permissions={
            'modules': ['panel'],
            'actions': ['manage'],
            'restrictions': ['no_user_management', 'no_system_settings']
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
            'actions': ['manage'],
            'restrictions': ['no_delete', 'audit_required']
        },
    ),
    'analytics_manager': _build_role_config(
        'analytics_manager',
        level=5,
        permissions={
            'modules': ['analytics'],
            'actions': ['manage'],
            'restrictions': ['no_user_management', 'no_system_settings']
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
    'real_estate_manager': _build_role_config(
        'real_estate_manager',
        level=2,
        permissions={
            'modules': ['real_estate', 'real_estate_properties', 'real_estate_agents', 'real_estate_agencies', 'media', 'analytics'],
            'actions': ['manage'],
            'restrictions': ['no_user_management', 'no_system_settings']
        },
    ),
    'property_agent': _build_role_config(
        'property_agent',
        level=4,
        permissions={
            'modules': ['real_estate_properties', 'media'],
            'actions': ['create', 'read', 'update'],
            'restrictions': [
                'no_delete',
                'own_properties_only',
                'no_user_management',
                'no_system_settings'
            ]
        },
    ),
    'agency_manager': _build_role_config(
        'agency_manager',
        level=3,
        permissions={
            'modules': ['real_estate_properties', 'real_estate_agents', 'real_estate_agencies', 'media', 'analytics'],
            'actions': ['create', 'read', 'update', 'delete'],
            'restrictions': [
                'agency_properties_only',
                'no_user_management',
                'no_system_settings'
            ],
            'special': ['agent_management']
        },
    ),
}

CONSULTANT_RESTRICTIONS = {
    'forbidden_roles': [
        'super_admin',
        'settings_manager',
        'panel_manager',
        'user_manager',
        'ai_manager',
        'pages_manager',
        'agency_manager',
    ],
    'forbidden_modules': [
        'admin',           # مدیریت ادمین‌ها
        'users',           # مدیریت کاربران
        'settings',        # تنظیمات عمومی
        'panel',           # تنظیمات پنل
        'ai',              # تنظیمات AI
        'pages',           # صفحات (درباره ما، قوانین)
        'real_estate_agents',   # مدیریت مشاورین
        'real_estate_agencies', # مدیریت آژانس‌ها
    ],
    'can_be_superuser': False,
}


def is_role_forbidden_for_consultant(role) -> Tuple[bool, str]:

    forbidden_roles = CONSULTANT_RESTRICTIONS['forbidden_roles']
    forbidden_modules = CONSULTANT_RESTRICTIONS['forbidden_modules']

    role_name = role.name if hasattr(role, 'name') else str(role)
    if role_name in forbidden_roles:
        display_name = getattr(role, 'display_name', role_name)
        return True, f"نقش '{display_name}' برای مشاورین املاک مجاز نیست"

    if hasattr(role, 'permissions') and role.permissions:
        role_modules = role.permissions.get('modules', [])
    elif hasattr(role, 'default_permissions') and role.default_permissions:
        role_modules = role.default_permissions.get('modules', [])
    else:
        role_modules = []
    
    # اگر دسترسی کامل دارد
    if 'all' in role_modules:
        return True, "نقش‌های با دسترسی کامل برای مشاورین املاک مجاز نیست"
    
    # بررسی ماژول‌های ممنوع
    for forbidden_module in forbidden_modules:
        if forbidden_module in role_modules:
            return True, f"نقش‌های با دسترسی به '{forbidden_module}' برای مشاورین املاک مجاز نیست"
    
    return False, ""

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
        'description': 'Manage blog posts, categories, and tags.'
    },
    'portfolio': {
        'name': 'portfolio',
        'display_name': 'Portfolio Management',
        'description': 'Manage portfolio items, categories, tags, and options.'
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
    },
    'analytics': {
        'name': 'analytics',
        'display_name': 'Analytics',
        'description': 'View website and app visit analytics and statistics.'
    },
    'real_estate': {
        'name': 'real_estate',
        'display_name': 'Real Estate (Total)',
        'description': 'Total access to properties, agents, and agencies.'
    },
    'real_estate_properties': {
        'name': 'real_estate_properties',
        'display_name': 'Real Estate: Properties',
        'description': 'Manage property listings, features, and tags.'
    },
    'real_estate_agents': {
        'name': 'real_estate_agents',
        'display_name': 'Real Estate: Agents',
        'description': 'Manage property agents and their profiles.'
    },
    'real_estate_agencies': {
        'name': 'real_estate_agencies',
        'display_name': 'Real Estate: Agencies',
        'description': 'Manage real estate agency offices.'
    },
}

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


PERMISSION_VALIDATION_RULES = {
    'allowed_modules': set(AVAILABLE_MODULES.keys()),
    'allowed_actions': set(AVAILABLE_ACTIONS.keys()),
    'system_roles': set(SYSTEM_ROLES.keys()),
    'min_level': 1,
    'max_level': 10
}


def get_all_permissions() -> Dict[str, Dict[str, Any]]:
    return PERMISSIONS.copy()


def get_permission(permission_id: str) -> Dict[str, Any] | None:
    return PERMISSIONS.get(permission_id)


def get_permissions_by_module(module: str) -> List[Tuple[str, Dict[str, Any]]]:
    return [(pid, p) for pid, p in PERMISSIONS.items() if p['module'] == module]


def get_permissions_by_action(action: str) -> List[Tuple[str, Dict[str, Any]]]:
    return [(pid, p) for pid, p in PERMISSIONS.items() if p['action'] == action]


def get_role_config(role_name: str) -> Optional[RoleConfig]:
    return SYSTEM_ROLES.get(role_name)


def get_role_display_name(role_name: str, short: bool = False) -> str:
    config = get_role_config(role_name)
    if not config:
        return role_name
    
    return config.display_name_short if short else config.display_name


def get_default_permissions(role_name: str) -> Dict[str, Any]:
    config = get_role_config(role_name)
    return config.default_permissions if config else {}


def is_super_admin_role(role_name: str) -> bool:
    return role_name == 'super_admin'


def get_system_roles() -> List[RoleConfig]:
    return sorted(SYSTEM_ROLES.values(), key=lambda x: x.level)


def get_available_roles(current_user_level: int = 10) -> List[RoleConfig]:
    return [role for role in get_system_roles() if role.level > current_user_level]


def get_user_role_display_text(user) -> str:
    if not user:
        return 'No role assigned'
    
    if getattr(user, 'is_superuser', False):
        return get_role_display_name('super_admin', short=True)
    
    roles = []
    try:
        if hasattr(user, 'admin_user_roles'):
            user_role_assignments = user.admin_user_roles.filter(is_active=True)
            roles = [ur.role.name for ur in user_role_assignments]
    except Exception:
        pass
    
    if not roles:
        return 'No role assigned'
    
    main_role = roles[0]
    return get_role_display_name(main_role, short=True)


def get_module_display_name(module_name: str) -> str:
    module_info = AVAILABLE_MODULES.get(module_name, {})
    return module_info.get('display_name', module_name)


def get_action_display_name(action_name: str) -> str:
    action_info = AVAILABLE_ACTIONS.get(action_name, {})
    return action_info.get('display_name', action_name)


def validate_role_permissions(permissions: Dict[str, Any]) -> tuple[bool, List[str]]:
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
    config = get_role_config(role_name)
    if not config:
        return {}
    
    return config.default_permissions


def get_all_role_configs() -> Dict[str, Dict[str, Any]]:
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
