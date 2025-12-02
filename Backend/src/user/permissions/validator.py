from functools import lru_cache
from typing import Dict, List, Set, Tuple, Optional
from django.core.cache import cache
from .registry import PermissionRegistry, Permission
from .config import BASE_ADMIN_PERMISSIONS
from src.user.utils.cache import UserCacheKeys, UserCacheManager


class PermissionValidator:
    """
    ✅ Redis-only caching: تمام cache ها فقط در Redis ذخیره می‌شوند
    هیچ in-memory cache استفاده نمی‌شود برای consistency و scalability
    """
    CACHE_TIMEOUT = 300  # 5 minutes
    
    @staticmethod
    def _get_cache_key(user) -> Optional[int]:
        """گرفتن کلید cache برای کاربر"""
        if not hasattr(user, 'id') or not user.id:
            return None
        return user.id
    
    @staticmethod
    def clear_user_cache(user_id: Optional[int] = None):
        """
        ✅ پاک کردن تمام cache های مربوط به کاربر از Redis
        برای وقتی که roles یا permissions تغییر می‌کنند
        """
        # ✅ Use Cache Manager for standardized cache invalidation
        UserCacheManager.invalidate_permissions(user_id)
    
    @staticmethod
    def has_permission(user, permission_id: str, context: Optional[Dict] = None) -> bool:
        """
        چک کردن دسترسی با احتساب Context
        
        Args:
            user: کاربر
            permission_id: شناسه permission (مثل 'media.upload')
            context: اطلاعات context (اختیاری)
                {
                    'type': 'portfolio' | 'blog' | 'media_library',
                    'action': 'create' | 'update',  # برای فرم‌های ویرایش/ایجاد
                }
        
        Returns:
            bool: آیا کاربر دسترسی دارد؟
        """
        # 🔥 بهینه‌سازی 1: Superadmin ها فوراً True برمی‌گردونن (بدون هیچ چک اضافی)
        if getattr(user, "is_superuser", False) or getattr(user, "is_admin_full", False):
            return True
        
        # 🔥 بهینه‌سازی 2: کاربران معمولی فوراً False برمی‌گردونن (بدون query)
        user_type = getattr(user, "user_type", None)
        is_staff = getattr(user, "is_staff", False)
        if user_type != 'admin' and not is_staff:
            # کاربران معمولی هیچ پرمیشنی ندارن
            return False
        
        # فقط برای ادمین‌های معمولی (نه superadmin) ادامه می‌دیم
        perm = PermissionRegistry.get(permission_id)
        if not perm:
            return False

        if perm.requires_superadmin:
            return False

        # 🔥 اگر context داریم، چک کردن Context-Aware
        if context:
            if PermissionValidator._check_context_permission(user, permission_id, context):
                return True

        # چک معمولی (modules/actions)
        user_modules, user_actions = PermissionValidator._get_user_modules_actions(user)
        has_module = "all" in user_modules or perm.module in user_modules
        has_action = "all" in user_actions or perm.action in user_actions
        return has_module and has_action

    @staticmethod
    def _check_context_permission(user, permission_id: str, context: Dict) -> bool:
        """
        چک کردن دسترسی بر اساس Context
        
        مثال: اگر portfolio.create دارد → media.upload در فرم portfolio مجاز است
        """
        context_type = context.get('type')
        context_action = context.get('action', 'create')
        
        # فقط برای media.upload در context خاص
        if permission_id != 'media.upload':
            return False
        
        if not context_type or context_type == 'media_library':
            return False
        
        # Portfolio context
        if context_type == 'portfolio':
            required_perm = f'portfolio.{context_action}'
            user_modules, user_actions = PermissionValidator._get_user_modules_actions(user)
            has_portfolio_module = "all" in user_modules or "portfolio" in user_modules
            has_context_action = "all" in user_actions or context_action in user_actions
            return has_portfolio_module and has_context_action
        
        # Blog context
        if context_type == 'blog':
            required_perm = f'blog.{context_action}'
            user_modules, user_actions = PermissionValidator._get_user_modules_actions(user)
            has_blog_module = "all" in user_modules or "blog" in user_modules
            has_context_action = "all" in user_actions or context_action in user_actions
            return has_blog_module and has_context_action
        
        return False

    @staticmethod
    def has_any_permission(user, permission_ids: List[str], context: Optional[Dict] = None) -> bool:
        return any(PermissionValidator.has_permission(user, pid, context) for pid in permission_ids)

    @staticmethod
    def has_all_permissions(user, permission_ids: List[str], context: Optional[Dict] = None) -> bool:
        return all(PermissionValidator.has_permission(user, pid, context) for pid in permission_ids)

    @staticmethod
    def get_user_permissions(user) -> List[str]:
        """
        گرفتن لیست permissions کاربر با Redis cache
        فقط برای ادمین‌ها کار می‌کنه (کاربران معمولی لیست خالی برمی‌گردونن)
        همه ادمین‌ها BASE_ADMIN_PERMISSIONS + role permissions دارند
        """
        if not hasattr(user, 'id') or not user.id:
            return []
        
        # 🔥 بهینه‌سازی: فقط برای ادمین‌ها
        user_type = getattr(user, "user_type", None)
        is_staff = getattr(user, "is_staff", False)
        if user_type != 'admin' and not is_staff:
            return []
        
        is_superadmin = getattr(user, "is_superuser", False) or getattr(user, "is_admin_full", False)
        
        # 🔥 Redis cache برای get_user_permissions (5 دقیقه)
        # ✅ Use standardized cache key from UserCacheKeys
        cache_key = UserCacheKeys.user_permissions(user.id)
        cached_perms = cache.get(cache_key)
        if cached_perms is not None:
            return cached_perms
        
        # 🔥 همه ادمین‌ها (حتی superadmin) permissions خودشون رو از roles می‌گیرن
        granted = []
        
        # ✅ FIX: Get permissions directly from roles (support both specific_permissions and old format)
        from src.user.models import AdminUserRole
        roles_qs = AdminUserRole.objects.filter(
            user=user, 
            is_active=True
        ).select_related("role").only("role__permissions", "role__name")
        
        has_any_role = False
        has_specific_permissions_format = False
        
        for user_role in roles_qs:
            role = user_role.role
            role_perms: Dict = role.permissions or {}
            has_any_role = True
            
            # ✅ NEW FORMAT: specific_permissions (precise - direct conversion)
            if isinstance(role_perms, dict) and 'specific_permissions' in role_perms:
                has_specific_permissions_format = True
                specific_perms = role_perms.get('specific_permissions', [])
                if isinstance(specific_perms, list):
                    for perm in specific_perms:
                        if isinstance(perm, dict):
                            # ✅ FIX: Support permission_key for statistics permissions (all have module='statistics', action='read')
                            # If permission_key is provided, use it directly (for statistics.users.read, statistics.admins.read, etc.)
                            if 'permission_key' in perm and perm.get('permission_key'):
                                perm_string = perm['permission_key']
                                # Check if permission exists in registry
                                if PermissionRegistry.exists(perm_string):
                                    perm_obj = PermissionRegistry.get(perm_string)
                                    if perm_obj:
                                        # Check requires_superadmin
                                        if perm_obj.requires_superadmin and not is_superadmin:
                                            continue
                                        if perm_string not in granted:
                                            granted.append(perm_string)
                                continue
                            
                            perm_module = perm.get('module')
                            perm_action = perm.get('action')
                            
                            # Handle 'all' cases
                            if perm_module == 'all' or perm_action == 'all':
                                if is_superadmin:
                                    all_perms = list(PermissionRegistry.get_all().keys())
                                    granted.extend(all_perms)
                                continue
                            
                            # Convert to permission string format (module.action)
                            perm_string = f"{perm_module}.{perm_action}"
                            
                            # Check if permission exists in registry
                            if PermissionRegistry.exists(perm_string):
                                perm_obj = PermissionRegistry.get(perm_string)
                                if perm_obj:
                                    # Check requires_superadmin
                                    if perm_obj.requires_superadmin and not is_superadmin:
                                        continue
                                    if perm_string not in granted:
                                        granted.append(perm_string)
        
        # ✅ OLD FORMAT: modules/actions (cartesian product - backward compatibility)
        # Only use old format if no role has specific_permissions format
        if not has_specific_permissions_format and has_any_role:
            modules, actions = PermissionValidator._get_user_modules_actions(user)
            
            # بررسی permissions از roles (old format)
            for perm_id, perm in PermissionRegistry.get_all().items():
                if perm.requires_superadmin and not is_superadmin:
                    continue
                
                has_module = "all" in modules or perm.module in modules
                has_action = "all" in actions or perm.action in actions
                
                if has_module and has_action:
                    if perm_id not in granted:
                        granted.append(perm_id)
        
        # اگر هیچ role نداشت
        if not has_any_role:
            if is_superadmin:
                all_perms = list(PermissionRegistry.get_all().keys())
                cache.set(cache_key, all_perms, 300)
                return all_perms
            else:
                base_perms = list(BASE_ADMIN_PERMISSIONS.keys())
                cache.set(cache_key, base_perms, 300)
                return base_perms
        
        # اضافه کردن BASE_ADMIN_PERMISSIONS به همه ادمین‌ها
        base_perms = list(BASE_ADMIN_PERMISSIONS.keys())
        for base_perm in base_perms:
            if base_perm not in granted:
                granted.append(base_perm)
        
        # ذخیره در Redis cache
        cache.set(cache_key, granted, 300)
        return granted

    @staticmethod
    def _get_user_modules_actions(user) -> Tuple[Set[str], Set[str]]:
        """
        ✅ گرفتن modules و actions کاربر با Redis caching
        فقط برای ادمین‌ها کار می‌کنه - تمام cache ها در Redis ذخیره می‌شوند
        """
        # 🔥 بهینه‌سازی: فقط برای ادمین‌ها query می‌زنیم
        user_type = getattr(user, "user_type", None)
        is_staff = getattr(user, "is_staff", False)
        if user_type != 'admin' and not is_staff:
            # کاربران معمولی هیچ modules/actions ندارن
            return set(), set()
        
        # ✅ Redis cache check
        cache_key_id = PermissionValidator._get_cache_key(user)
        if cache_key_id:
            # ✅ Use standardized cache key from UserCacheKeys
            redis_cache_key = UserCacheKeys.user_modules_actions(cache_key_id)
            cached_result = cache.get(redis_cache_key)
            if cached_result is not None:
                # cached_result is a tuple of (modules_set, actions_set)
                # Convert back from lists to sets
                modules_list, actions_list = cached_result
                return set(modules_list), set(actions_list)
        
        modules: Set[str] = set()
        actions: Set[str] = set()
        try:
            import logging
            logger = logging.getLogger(__name__)
            from src.user.models import AdminUserRole  # local import to avoid cycles

            # استفاده از select_related برای جلوگیری از N+1 queries
            roles_qs = AdminUserRole.objects.filter(
                user=user, 
                is_active=True
            ).select_related("role").only("role__permissions", "role__name")
            
            for user_role in roles_qs:
                role = user_role.role
                role_perms: Dict = role.permissions or {}
                
                # Handle both new format (specific_permissions) and old format (modules/actions)
                if isinstance(role_perms, dict):
                    # ✅ NEW FORMAT: specific_permissions (precise)
                    if 'specific_permissions' in role_perms:
                        specific_perms = role_perms.get('specific_permissions', [])
                        if isinstance(specific_perms, list):
                            for perm in specific_perms:
                                if isinstance(perm, dict):
                                    perm_module = perm.get('module')
                                    perm_action = perm.get('action')
                                    if perm_module:
                                        modules.add(perm_module)
                                    if perm_action:
                                        # Map read to view
                                        if perm_action == 'read':
                                            actions.add('view')
                                            actions.add('read')  # Keep both
                                        elif perm_action == 'view':
                                            actions.add('view')
                                            actions.add('read')  # Keep both
                                        else:
                                            actions.add(perm_action)
                    # OLD FORMAT: modules/actions (cartesian product)
                    else:
                        role_modules = role_perms.get("modules", [])
                        role_actions = role_perms.get("actions", [])
                        
                        if isinstance(role_modules, list):
                            modules.update(role_modules)
                        if isinstance(role_actions, list):
                            # Map read to view for old format too
                            for action in role_actions:
                                if action == 'read':
                                    actions.add('view')
                                    actions.add('read')
                                elif action == 'view':
                                    actions.add('view')
                                    actions.add('read')
                                else:
                                    actions.add(action)
                else:
                    logger.warning(f"Role {role.name} permissions is not a dict: {type(role_perms)}")
            
            # ✅ ذخیره در Redis cache (convert sets to lists for JSON serialization)
            # ✅ Use standardized cache key from UserCacheKeys
            if cache_key_id:
                redis_cache_key = UserCacheKeys.user_modules_actions(cache_key_id)
                cache.set(
                    redis_cache_key, 
                    (list(modules), list(actions)), 
                    PermissionValidator.CACHE_TIMEOUT
                )
                    
        except Exception as e:
            # Log error for debugging but don't crash
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error getting user modules/actions for user {user.id}: {e}", exc_info=True)
        
        return modules, actions

