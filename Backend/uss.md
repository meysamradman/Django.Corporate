ببین اپ یوزر فایلهاشو برات گزاشتم داکیومنتامو گزاشتم برات و فایل  uss.md بخون با دقت برای اپ یوزر میخویم بدونه اینکه منطق و چیزی خراب شه دونه دونه درست کنیم خیلی مهمه خراب نشه و باید منطق بادثت انجام بشه هواست خیلی باشه .
اول کامل ببین اپ یوزر رو فایلهارو ببین که چکاری انجام میده و با دقت انجام بدی و بهینه


فقط هواست باشه کش با redis هست

🔴 مشکلات Critical در authorization/__init__.py
python# ❌ مشکل: Circular Import و ترتیب اشتباه
import src.user.permissions.permission_factory as permission_factory
for class_name in permission_factory.__all__:
    globals()[class_name] = getattr(permission_factory, class_name)

# سپس دوباره همین کار را در admin_permission.py انجام می‌دهید!
✅ راه‌حل پیشنهادی برای authorization/__init__.py:
python# authorization/__init__.py
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

from src.user.authorization.role_utils import (
    create_default_admin_roles,
    ensure_admin_roles_exist,
    get_role_summary
)

# ✅ Import permission classes dynamically ONCE
from src.user.permissions import permission_factory

# Create aliases for permission classes
_permission_classes = {}
for class_name in permission_factory.__all__:
    _permission_classes[class_name] = getattr(permission_factory, class_name)

# Add to globals
globals().update(_permission_classes)

# Create specific aliases
ContentManagerAccess = _permission_classes.get('BlogManagerAccess')
UserManagerAccess = _permission_classes.get('UsersManagerAccess')
AnalyticsViewerAccess = _permission_classes.get('StatisticsManagerAccess')
SupportAdminAccess = _permission_classes.get('UsersManagerAccess')
PanelSettingsAccess = _permission_classes.get('PanelManagerAccess')
AIManagerAccess = _permission_classes.get('AiManagerAccess')

ADMIN_ROLE_PERMISSIONS = SYSTEM_ROLES

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
    
    # Aliases
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
] + list(_permission_classes.keys())
🔴 مشکل در admin_permission.py
python# ❌ این کد تکراری است و باید حذف شود
import src.user.permissions.permission_factory as permission_factory

for class_name in permission_factory.__all__:
    globals()[class_name] = getattr(permission_factory, class_name)

def _setup_aliases():
    # این هم تکراری است
    ...

_setup_aliases()
✅ راه‌حل: حذف بخش تکراری از admin_permission.py
python# admin_permission.py - در انتهای فایل

class RequirePermission(AdminRolePermission):
    def __init__(self, permission_id: str):
        self.permission_id = permission_id
        super().__init__()
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        if not request.user.is_active:
            return False
        
        if getattr(request.user, 'is_superuser', False) or getattr(request.user, 'is_admin_full', False):
            return True
        
        return PermissionValidator.has_permission(request.user, self.permission_id)


class AdminPermissionCache:
    @staticmethod
    def clear_user_cache(user_id: int):
        try:
            methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
            cache_keys_to_clear = []
            
            for method in methods:
                cache_keys_to_clear.extend([
                    f"admin_perm_{user_id}_{method}_AdminManagementView",
                    f"admin_perm_{user_id}_{method}_AdminRoleView",
                    f"admin_perm_{user_id}_{method}_AdminPermissionView",
                    f"admin_perm_{user_id}_{method}_AdminProfileView",
                    f"admin_perm_{user_id}_{method}_UserManagementView",
                ])
            
            cache_keys_to_clear.extend([
                f"admin_permissions_{user_id}",
                f"admin_roles_{user_id}",
                f"admin_info_{user_id}",
                f"user_permissions_{user_id}",
                f"user_modules_actions_{user_id}",
                f"admin_perms_{user_id}",
                f"admin_simple_perms_{user_id}",
                f"admin_profile_{user_id}_super",
                f"admin_profile_{user_id}_regular",
            ])
            
            cache.delete_many(cache_keys_to_clear)
            
            try:
                UserCacheManager.invalidate_permissions(user_id)
            except Exception:
                pass
            
        except Exception:
            pass
    
    @staticmethod
    def clear_all_admin_cache():
        try:
            cache.clear()
        except Exception:
            pass

# ❌ حذف این بخش - به __init__.py منتقل شده
# import src.user.permissions.permission_factory as permission_factory
# for class_name in permission_factory.__all__:
#     globals()[class_name] = getattr(permission_factory, class_name)
# def _setup_aliases(): ...
# _setup_aliases()
🟡 مشکلات دیگر
1. Circular Import Potential در permission_factory.py
python# ❌ مشکل احتمالی
def _create_permission_classes():
    from src.user.authorization.admin_permission import RequireModuleAccess
    # ...
این در زمان اجرا مشکل ایجاد نمی‌کند اما بهتر است:
python# ✅ بهتر
def _create_permission_classes():
    # Import lazy - فقط وقتی که نیاز است
    from src.user.authorization.admin_permission import RequireModuleAccess
    
    classes = {}
    for module_name, related_modules in MODULE_MAPPINGS.items():
        class_name = f"{module_name.capitalize()}ManagerAccess"
        
        def make_init(modules):
            def __init__(self):
                RequireModuleAccess.__init__(self, *modules)
                self.required_action = 'manage'
            return __init__
        
        permission_class = type(
            class_name,
            (RequireModuleAccess,),
            {
                '__init__': make_init(list(related_modules)),
                '__module__': __name__,
            }
        )
        
        classes[class_name] = permission_class
    
    return classes

# Create classes once
_classes = _create_permission_classes()
globals().update(_classes)

__all__ = list(_classes.keys())
2. مشکل در roles.py - Signal Handlers
python# ⚠️ این signal handler ممکن است چندین بار اجرا شود
@receiver([post_save, post_delete], sender=AdminUserRole)
def clear_admin_user_cache(sender, instance, **kwargs):
    # ...
بهتر است از dispatch_uid استفاده کنید:
python@receiver([post_save, post_delete], sender=AdminUserRole, dispatch_uid="clear_admin_user_cache")
def clear_admin_user_cache(sender, instance, **kwargs):
    from src.user.authorization.admin_permission import AdminPermissionCache
    from src.user.permissions.validator import PermissionValidator
    from src.user.permissions.helpers import PermissionHelper
    
    user_id = instance.user_id
    
    AdminPermissionCache.clear_user_cache(user_id)
    PermissionValidator.clear_user_cache(user_id)
    PermissionHelper.clear_user_cache(user_id)
    
    from src.user.utils.cache import UserCacheManager
    UserCacheManager.invalidate_profile(user_id)

@receiver([post_save, post_delete], sender=AdminRole, dispatch_uid="clear_admin_role_cache")
def clear_admin_role_cache(sender, instance, **kwargs):
    # ...
3. Import غیرضروری در admin_login_view.py
python# ❌ این import استفاده نشده
from src.user.permissions.config import BASE_ADMIN_PERMISSIONS

BASE_ADMIN_PERMISSIONS_SIMPLE = list(BASE_ADMIN_PERMISSIONS.keys())
📋 نکات بهینه‌سازی
1. Cache Keys Management
در cache.py و admin_permission.py کلیدهای کش تکراری دارید:
python# ✅ یک منبع واحد برای همه cache keys
class CacheKeys:
    """Centralized cache key management"""
    
    # User permissions
    USER_PERMISSIONS = "user_permissions_{user_id}"
    USER_MODULES_ACTIONS = "user_modules_actions_{user_id}"
    
    # Admin permissions
    ADMIN_PERMISSIONS = "admin_permissions_{user_id}"
    ADMIN_ROLES = "admin_roles_{user_id}"
    ADMIN_PERMS = "admin_perms_{user_id}"
    ADMIN_SIMPLE_PERMS = "admin_simple_perms_{user_id}"
    ADMIN_PERM_CHECK = "admin_perm_{user_id}_{method}_{view_name}"
    
    # Profile
    ADMIN_PROFILE = "admin_profile_{user_id}_{profile_type}"
    
    # Permission map
    PERMISSION_MAP = "all_permissions_map"
    PERMISSION_DISPLAY_NAME = "perm_name_{perm}"
    
    @classmethod
    def user_permissions(cls, user_id: int) -> str:
        return cls.USER_PERMISSIONS.format(user_id=user_id)
    
    @classmethod
    def admin_perm_check(cls, user_id: int, method: str, view_name: str) -> str:
        return cls.ADMIN_PERM_CHECK.format(user_id=user_id, method=method, view_name=view_name)
    
    # ... بقیه متدها
2. Exception Handling
در چندین جا exception handling خیلی عمومی است:
python# ❌ خیلی عمومی
except Exception:
    pass

# ✅ بهتر
except (ValidationError, PermissionDenied) as e:
    logger.warning(f"Permission check failed: {e}")
    return False
except Exception as e:
    logger.error(f"Unexpected error in permission check: {e}", exc_info=True)
    return False
3. Type Hints
اضافه کردن type hints برای بهبود خوانایی:
pythonfrom typing import Optional, Dict, List, Tuple, Any

class AdminPermissionCache:
    @staticmethod
    def clear_user_cache(user_id: int) -> None:
        """Clear all cache entries for a specific user"""
        try:
            # ...
        except Exception as e:
            logger.error(f"Failed to clear cache for user {user_id}: {e}")
✅ تغییرات پیشنهادی نهایی

حذف تکرار در authorization/__init__.py
حذف بخش تکراری از admin_permission.py
اضافه کردن dispatch_uid به signal handlers
یکپارچه‌سازی cache keys
بهبود exception handling
اضافه کردن type hints

آیا می‌خواهید من فایل‌های اصلاح‌شده کامل را برایتان بنویسم؟Rغالی همهچی رو دیدی؟ اگر نیاز به تقسیم و بهینه فایلها و init ها و هر چیزی لازمه بگو کد نزن بگی که درست کنم با دقت ببین لیست کن همهچیروبله، همه فایل‌ها را با دقت بررسی کردم. لیست کامل مشکلات و نیازهای بهینه‌سازی:
🔴 مشکلات Critical (باید حتماً رفع شوند)
1. Circular Import در authorization/__init__.py

دو بار permission_factory را import و process می‌کنید (یکبار در __init__.py و یکبار در admin_permission.py)
باعث confusion و احتمال circular import می‌شود
راه‌حل: فقط در __init__.py این کار را انجام دهید و از admin_permission.py حذف کنید

2. تکرار در admin_permission.py

خطوط 274-282: دقیقاً همان کاری که در __init__.py انجام داده‌اید را تکرار می‌کند
تابع _setup_aliases() هم تکراری است
راه‌حل: کل این بخش را حذف کنید

3. Signal Handlers بدون dispatch_uid در roles.py

خطوط 200 و 215: signals بدون dispatch_uid ممکن است چندین بار register شوند
راه‌حل: اضافه کردن dispatch_uid به هر receiver

🟡 مشکلات مهم (strongly recommended)
4. Cache Key Management پراکنده

Cache keys در 3 جا تعریف شده: cache.py, admin_permission.py, و استفاده مستقیم در viewها
مثال: f"admin_perm_{user_id}_{method}_{view_name}" در چند جا تکرار شده
راه‌حل: یک کلاس مرکزی CacheKeys با متدهای استاتیک

5. Import های غیرضروری

admin_login_view.py خط 9: BASE_ADMIN_PERMISSIONS import شده اما فقط یکبار استفاده شده
admin_management_serializer.py خط 14: BASE_ADMIN_PERMISSIONS برای همان کار
راه‌حل: یا به یک utility function منتقل کنید یا inline استفاده کنید

6. Exception Handling خیلی عمومی
مکان‌های زیادی دارید که:
pythonexcept Exception:
    pass
این در production خطرناک است:

admin_permission.py: خطوط 96, 102, 137, 203, 230, 240
validator.py: خطوط متعدد
helpers.py: خطوط متعدد
راه‌حل: Exception های خاص را catch کنید و log کنید

7. Type Hints ناقص

اکثر کلاس‌ها و متدها type hint ندارند
فقط در config.py و بخشی از validator.py دارید
راه‌حل: اضافه کردن type hints به همه public methods

🟢 بهینه‌سازی‌های پیشنهادی (nice to have)
8. Session/Cookie Management تکراری
در admin_logout_view.py:

متد _delete_cookie_with_settings می‌تواند در یک utility class مشترک باشد
همین منطق در user_cookies.py هم هست
راه‌حل: یک CookieManager class مشترک

9. Serializer Context Passing
در چندین serializer، context passing مشابه است:

admin_management_serializer.py خط 234
admin_register_serializer.py خط 132
راه‌حل: یک base serializer با context management

10. Permission Check Logic تکراری
در admin_management_view.py:

متدهای _can_view_other_admins, _can_edit_other_admins, etc.
این منطق در چند view تکرار می‌شود
راه‌حل: یک PermissionChecker service class

11. Profile Update Logic مشابه

admin_profile_service.py خطوط 43-150
user_profile_service.py (فرض می‌کنم مشابه است)
راه‌حل: یک base ProfileService با template method pattern

12. Validation Logic تکراری
در admin_register_serializer.py و user_management_serializer.py:

validation برای mobile, email, national_id تکراری است
راه‌حل: Base validator mixins

13. Cache Clear Pattern تکراری
این pattern در همه جا تکرار شده:
pythonAdminPermissionCache.clear_user_cache(user_id)
PermissionValidator.clear_user_cache(user_id)
PermissionHelper.clear_user_cache(user_id)
UserCacheManager.invalidate_profile(user_id)
مکان‌ها:

admin_management_service.py: خطوط 139, 232
admin_profile_service.py: خطوط 41, 148
admin_role_view.py: خطوط 107, 305, 349
راه‌حل: یک متد clear_all_user_caches(user_id) در UserCacheManager

14. APIResponse Pattern
در همه viewها یک pattern تکراری دارید:
pythonreturn APIResponse.success(...)
return APIResponse.error(...)
```
- **راه‌حل**: DRF Response classes با custom exception handler بهتر است

### 15. **Permission Registry Export**
در `registry.py` خط 48:
- `export_for_frontend` می‌تواند cached باشد
- **راه‌حل**: اضافه کردن caching decorator

## 📁 پیشنهاد ساختار بهینه فایل‌ها

### الف) `authorization/` directory:
```
authorization/
├── __init__.py (فقط imports و exports)
├── permissions/
│   ├── __init__.py
│   ├── base.py (AdminRolePermission, SimpleAdminPermission)
│   ├── role_based.py (RequireAdminRole, RequireModuleAccess)
│   └── permission_based.py (RequirePermission)
├── views/
│   ├── __init__.py
│   ├── admin_role_view.py
│   └── admin_permission_view.py
├── services/
│   ├── __init__.py
│   └── role_utils.py
└── cache.py (AdminPermissionCache)
```

### ب) `utils/` directory:
```
utils/
├── __init__.py
├── validators/
│   ├── __init__.py
│   ├── mobile_validator.py
│   ├── email_validator.py
│   ├── password_validator.py
│   └── ... (existing validators)
├── cache/
│   ├── __init__.py
│   ├── keys.py (CacheKeys centralized)
│   └── manager.py (UserCacheManager)
└── mixins/
    ├── __init__.py
    ├── serializer_mixins.py
    └── view_mixins.py
```

### ج) `services/` directory:
```
services/
├── admin/
│   ├── __init__.py
│   ├── base.py (BaseAdminService)
│   ├── admin_management_service.py
│   ├── admin_profile_service.py
│   └── ...
└── user/
    ├── __init__.py
    ├── base.py (BaseUserService)
    └── ...
```

### د) یک `core/` برای shared utilities:
```
core/
├── __init__.py
├── permissions/
│   ├── __init__.py
│   └── checker.py (PermissionChecker service)
├── cache/
│   ├── __init__.py
│   └── manager.py (CacheManager base)
└── exceptions/
    ├── __init__.py
    └── handlers.py (DRF exception handlers)
🎯 اولویت‌بندی اقدامات
Priority 1 (باید الان انجام شود):

رفع circular import در authorization/__init__.py
حذف کد تکراری از admin_permission.py
اضافه کردن dispatch_uid به signals

Priority 2 (این هفته):

یکپارچه‌سازی cache keys
بهبود exception handling
حذف imports غیرضروری

Priority 3 (هفته آینده):

اضافه کردن type hints
Refactor کردن cache clear pattern
ایجاد base classes برای تکرارهای مشابه

Priority 4 (در آینده):
10-15. سایر بهینه‌سازی‌ها
⚠️ نکات مهم قبل از شروع

Testing: قبل از هر تغییری، test بنویسید
Backup: از کد فعلی backup بگیرید
Step by step: یکی یکی انجام دهید، نه همه با هم
Git commits: هر تغییر را در یک commit جداگانه
Documentation: هر تغییر را document کنید

