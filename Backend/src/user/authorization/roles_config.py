"""
مدیریت مرکزی نقش‌ها و دسترسی‌ها - Centralized Role Management Configuration
این فایل مرکزی برای مدیریت:
1. نقش‌های سیستم و تعریف آن‌ها
2. ترجمه و نمایش نقش‌ها
3. سطح‌بندی و سلسله مراتب نقش‌ها
4. دسترسی‌های پیش‌فرض هر نقش
5. ماژول‌ها و عملیات قابل دسترسی
6. اعتبارسنجی دسترسی‌ها

Compatible with Django 5.2.6 and Permission_System.md specifications
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass


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


# =============================================================================
# SYSTEM ROLES CONFIGURATION
# =============================================================================

SYSTEM_ROLES: Dict[str, RoleConfig] = {
    'super_admin': RoleConfig(
        name='super_admin',
        display_name='سوپر ادمین',
        display_name_short='سوپر ادمین',
        description='دسترسی کامل به تمام بخش‌های سیستم',
        level=1,
        is_system_role=True,
        default_permissions={
            'modules': ['all'],
            'actions': ['all'],
            'special': ['user_management', 'system_settings', 'role_management']
        }
    ),
    'content_manager': RoleConfig(
        name='content_manager',
        display_name='مدیر محتوا',
        display_name_short='مدیر محتوا',
        description='مدیریت محتوا، پرتفولیو، بلاگ و رسانه',
        level=2,
        is_system_role=True,
        default_permissions={
            'modules': ['portfolio', 'blog', 'categories', 'media'],
            'actions': ['create', 'read', 'update', 'delete'],
            'restrictions': ['no_user_management', 'no_system_settings']
        }
    ),
    'user_manager': RoleConfig(
        name='user_manager',
        display_name='مدیر کاربران',
        display_name_short='مدیر کاربران',
        description='مدیریت کاربران عادی و مشاهده آمار',
        level=3,
        is_system_role=True,
        default_permissions={
            'modules': ['users', 'analytics'],
            'actions': ['read', 'update'],
            'restrictions': ['no_admin_users', 'no_delete', 'no_system_settings']
        }
    ),
    'media_manager': RoleConfig(
        name='media_manager',
        display_name='مدیر رسانه',
        display_name_short='مدیر رسانه',
        description='مدیریت فایل‌ها و رسانه‌های سیستم',
        level=4,
        is_system_role=True,
        default_permissions={
            'modules': ['media'],
            'actions': ['create', 'read', 'update', 'delete'],
            'restrictions': ['file_size_limit', 'no_user_management']
        }
    ),
    'analytics_viewer': RoleConfig(
        name='analytics_viewer',
        display_name='مشاهده‌گر آمار',
        display_name_short='بازدید آمار',
        description='مشاهده آمار و گزارشات سیستم',
        level=5,
        is_system_role=True,
        default_permissions={
            'modules': ['analytics', 'users', 'portfolio', 'blog'],
            'actions': ['read'],
            'restrictions': ['read_only', 'no_user_management']
        }
    ),
    'support_admin': RoleConfig(
        name='support_admin',
        display_name='ادمین پشتیبانی',
        display_name_short='پشتیبان',
        description='پشتیبانی محدود از کاربران',
        level=6,
        is_system_role=True,
        default_permissions={
            'modules': ['users'],
            'actions': ['read', 'update'],
            'restrictions': ['limited_fields', 'no_sensitive_data', 'no_admin_users']
        }
    )
}

# =============================================================================
# AVAILABLE MODULES & ACTIONS
# =============================================================================

# ماژول‌های قابل دسترسی در سیستم
AVAILABLE_MODULES = {
    'all': {
        'name': 'all',
        'display_name': 'همه ماژول‌ها',
        'description': 'دسترسی به تمام ماژول‌های سیستم'
    },
    'users': {
        'name': 'users',
        'display_name': 'مدیریت کاربران',
        'description': 'مدیریت کاربران وب‌سایت و پروفایل‌ها'
    },
    'admin': {
        'name': 'admin',
        'display_name': 'مدیریت ادمین‌ها',
        'description': 'مدیریت ادمین‌های پنل و نقش‌ها'
    },
    'portfolio': {
        'name': 'portfolio',
        'display_name': 'مدیریت نمونه کارها',
        'description': 'مدیریت نمونه کارها و پروژه‌ها'
    },
    'blog': {
        'name': 'blog',
        'display_name': 'مدیریت بلاگ',
        'description': 'مدیریت مقالات و پست‌های بلاگ'
    },
    'media': {
        'name': 'media',
        'display_name': 'مدیریت رسانه',
        'description': 'مدیریت فایل‌ها، تصاویر و کتابخانه رسانه'
    },
    'categories': {
        'name': 'categories',
        'display_name': 'مدیریت دسته‌بندی‌ها',
        'description': 'مدیریت دسته‌بندی‌ها و طبقه‌بندی‌ها'
    },
    'analytics': {
        'name': 'analytics',
        'display_name': 'آمار و گزارشات',
        'description': 'مشاهده آمار و تولید گزارش‌ها'
    },
    'settings': {
        'name': 'settings',
        'display_name': 'تنظیمات سیستم',
        'description': 'تنظیمات کلی سیستم و پیکربندی'
    }
}

# عملیات قابل انجام در سیستم
AVAILABLE_ACTIONS = {
    'all': {
        'name': 'all',
        'display_name': 'همه عملیات',
        'description': 'تمام عملیات قابل انجام'
    },
    'create': {
        'name': 'create',
        'display_name': 'ایجاد',
        'description': 'ایجاد رکوردهای جدید'
    },
    'read': {
        'name': 'read',
        'display_name': 'مشاهده',
        'description': 'مشاهده و خواندن رکوردها'
    },
    'update': {
        'name': 'update',
        'display_name': 'ویرایش',
        'description': 'ویرایش و به‌روزرسانی رکوردها'
    },
    'delete': {
        'name': 'delete',
        'display_name': 'حذف',
        'description': 'حذف رکوردها'
    },
    'export': {
        'name': 'export',
        'display_name': 'خروجی گیری',
        'description': 'خروجی گیری از داده‌ها و تولید گزارش'
    },
    'import': {
        'name': 'import',
        'display_name': 'وارد کردن',
        'description': 'وارد کردن داده‌ها از فایل‌های خارجی'
    }
}

# =============================================================================
# VALIDATION RULES
# =============================================================================

PERMISSION_VALIDATION_RULES = {
    'allowed_modules': set(AVAILABLE_MODULES.keys()),
    'allowed_actions': set(AVAILABLE_ACTIONS.keys()),
    'system_roles': set(SYSTEM_ROLES.keys()),
    'min_level': 1,
    'max_level': 10
}

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def get_role_config(role_name: str) -> Optional[RoleConfig]:
    """دریافت تنظیمات نقش بر اساس نام"""
    return SYSTEM_ROLES.get(role_name)


def get_role_display_name(role_name: str, short: bool = False) -> str:
    """دریافت نام نمایشی نقش"""
    config = get_role_config(role_name)
    if not config:
        return role_name
    
    return config.display_name_short if short else config.display_name


def get_default_permissions(role_name: str) -> Dict[str, Any]:
    """دریافت دسترسی‌های پیش‌فرض برای نقش"""
    config = get_role_config(role_name)
    return config.default_permissions if config else {}


def is_super_admin_role(role_name: str) -> bool:
    """بررسی اینکه آیا نقش سوپر ادمین است"""
    return role_name == 'super_admin'


def get_system_roles() -> List[RoleConfig]:
    """دریافت تمام نقش‌های سیستم به ترتیب سطح"""
    return sorted(SYSTEM_ROLES.values(), key=lambda x: x.level)


def get_available_roles(current_user_level: int = 10) -> List[RoleConfig]:
    """دریافت نقش‌های قابل انتخاب برای کاربر بر اساس سطح دسترسی فعلی"""
    return [role for role in get_system_roles() if role.level > current_user_level]


def get_user_role_display_text(user) -> str:
    """دریافت متن نمایشی برای نقش‌های کاربر"""
    if not user:
        return 'بدون نقش'
    
    # بررسی سوپر ادمین
    if getattr(user, 'is_superuser', False):
        return get_role_display_name('super_admin', short=True)
    
    # دریافت نقش‌های کاربر
    roles = []
    try:
        if hasattr(user, 'adminuserrole_set'):
            user_role_assignments = user.adminuserrole_set.filter(is_active=True)
            roles = [ur.role.name for ur in user_role_assignments]
    except Exception:
        pass
    
    if not roles:
        return 'بدون نقش'
    
    # نمایش نقش اصلی
    main_role = roles[0]
    return get_role_display_name(main_role, short=True)


def get_module_display_name(module_name: str) -> str:
    """دریافت نام نمایشی ماژول"""
    module_info = AVAILABLE_MODULES.get(module_name, {})
    return module_info.get('display_name', module_name)


def get_action_display_name(action_name: str) -> str:
    """دریافت نام نمایشی عملیات"""
    action_info = AVAILABLE_ACTIONS.get(action_name, {})
    return action_info.get('display_name', action_name)


def validate_role_permissions(permissions: Dict[str, Any]) -> tuple[bool, List[str]]:
    """اعتبارسنجی ساختار دسترسی‌های نقش"""
    errors = []
    
    if not isinstance(permissions, dict):
        return False, ["Permissions must be a dictionary"]
    
    # بررسی ماژول‌ها
    if 'modules' in permissions:
        modules = permissions['modules']
        if not isinstance(modules, list):
            errors.append("modules must be a list")
        else:
            invalid_modules = set(modules) - PERMISSION_VALIDATION_RULES['allowed_modules']
            if invalid_modules and 'all' not in modules:
                errors.append(f"Invalid modules: {', '.join(invalid_modules)}")
    
    # بررسی عملیات
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
    دریافت دسترسی‌های آماده برای ایجاد نقش در دیتابیس
    برای استفاده در create_admin_roles.py
    """
    config = get_role_config(role_name)
    if not config:
        return {}
    
    return config.default_permissions


def get_all_role_configs() -> Dict[str, Dict[str, Any]]:
    """
    دریافت تمام تنظیمات نقش‌ها به فرمت مناسب برای ایجاد در دیتابیس
    برای استفاده در create_admin_roles.py
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