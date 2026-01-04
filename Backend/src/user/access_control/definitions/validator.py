from functools import lru_cache
from typing import Dict, List, Set, Tuple, Optional
from django.core.cache import cache
from .registry import PermissionRegistry, Permission
from .config import BASE_ADMIN_PERMISSIONS
from .module_mappings import MODULE_MAPPINGS
from src.user.utils.cache import UserCacheKeys, UserCacheManager
from src.user.models import AdminUserRole


class PermissionValidator:
    CACHE_TIMEOUT = 300
    
    @staticmethod
    def _get_cache_key(user) -> Optional[int]:
        if not hasattr(user, 'id') or not user.id:
            return None
        return user.id
    
    @staticmethod
    def clear_user_cache(user_id: Optional[int] = None):
        UserCacheManager.invalidate_permissions(user_id)
    
    @staticmethod
    def has_permission(user, permission_id: str, context: Optional[Dict] = None) -> bool:
        if getattr(user, "is_superuser", False) or getattr(user, "is_admin_full", False):
            return True
        
        user_type = getattr(user, "user_type", None)
        is_staff = getattr(user, "is_staff", False)
        if user_type != 'admin' and not is_staff:
            return False
        
        perm = PermissionRegistry.get(permission_id)
        if not perm:
            return False

        if perm.requires_superadmin:
            return False

        if context:
            if PermissionValidator._check_context_permission(user, permission_id, context):
                return True

        user_modules, user_actions = PermissionValidator._get_user_modules_actions(user)
        
        # Check if user has module access
        has_module = False
        if "all" in user_modules:
            has_module = True
        elif perm.module in user_modules:
            has_module = True
        else:
            # Check if any user_module starts with perm.module (for nested modules)
            # e.g., 'real_estate.property' starts with 'real_estate.'
            for user_module in user_modules:
                if user_module.startswith(perm.module + '.'):
                    has_module = True
                    break
        
        has_action = "all" in user_actions or perm.action in user_actions
        return has_module and has_action

    @staticmethod
    def _check_context_permission(user, permission_id: str, context: Dict) -> bool:
        context_type = context.get('type')
        context_action = context.get('action', 'create')
        
        if permission_id != 'media.upload':
            return False
        
        if not context_type or context_type == 'media_library':
            return False
        
        # Generic context-based permission check
        # Checks if user has module access for the context type
        required_perm = f'{context_type}.{context_action}'
        user_modules, user_actions = PermissionValidator._get_user_modules_actions(user)
        has_context_module = "all" in user_modules or context_type in user_modules
        has_context_action = "all" in user_actions or context_action in user_actions
        return has_context_module and has_context_action

    @staticmethod
    def has_any_permission(user, permission_ids: List[str], context: Optional[Dict] = None) -> bool:
        return any(PermissionValidator.has_permission(user, pid, context) for pid in permission_ids)

    @staticmethod
    def has_all_permissions(user, permission_ids: List[str], context: Optional[Dict] = None) -> bool:
        return all(PermissionValidator.has_permission(user, pid, context) for pid in permission_ids)

    @staticmethod
    def get_user_permissions(user) -> List[str]:
        if not hasattr(user, 'id') or not user.id:
            return []
        
        user_type = getattr(user, "user_type", None)
        is_staff = getattr(user, "is_staff", False)
        if user_type != 'admin' and not is_staff:
            return []
        
        is_superadmin = getattr(user, "is_superuser", False) or getattr(user, "is_admin_full", False)
        
        cache_key = UserCacheKeys.user_permissions(user.id)
        cached_perms = cache.get(cache_key)
        if cached_perms is not None:
            return cached_perms
        
        granted = []
        
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
            
            if isinstance(role_perms, dict) and 'specific_permissions' in role_perms:
                has_specific_permissions_format = True
                specific_perms = role_perms.get('specific_permissions', [])
                if isinstance(specific_perms, list):
                    for perm in specific_perms:
                        if isinstance(perm, dict):
                            if 'permission_key' in perm and perm.get('permission_key'):
                                perm_string = perm['permission_key']
                                if PermissionRegistry.exists(perm_string):
                                    perm_obj = PermissionRegistry.get(perm_string)
                                    if perm_obj:
                                        if perm_obj.requires_superadmin and not is_superadmin:
                                            continue
                                        if perm_string not in granted:
                                            granted.append(perm_string)
                                continue
                            
                            perm_module = perm.get('module')
                            perm_action = perm.get('action')
                            
                            if perm_module == 'all' or perm_action == 'all':
                                if is_superadmin:
                                    all_perms = list(PermissionRegistry.get_all().keys())
                                    granted.extend(all_perms)
                                continue
                            
                            perm_string = f"{perm_module}.{perm_action}"
                            
                            if PermissionRegistry.exists(perm_string):
                                perm_obj = PermissionRegistry.get(perm_string)
                                if perm_obj:
                                    if perm_obj.requires_superadmin and not is_superadmin:
                                        continue
                                    if perm_string not in granted:
                                        granted.append(perm_string)
        
        if not has_specific_permissions_format and has_any_role:
            modules, actions = PermissionValidator._get_user_modules_actions(user)
            
            for perm_id, perm in PermissionRegistry.get_all().items():
                if perm.requires_superadmin and not is_superadmin:
                    continue
                
                has_module = "all" in modules or perm.module in modules
                has_action = "all" in actions or perm.action in actions
                
                if has_module and has_action:
                    if perm_id not in granted:
                        granted.append(perm_id)
        
        if not has_any_role:
            if is_superadmin:
                all_perms = list(PermissionRegistry.get_all().keys())
                cache.set(cache_key, all_perms, 300)
                return all_perms
            else:
                base_perms = list(BASE_ADMIN_PERMISSIONS.keys())
                cache.set(cache_key, base_perms, 300)
                return base_perms
        
        base_perms = list(BASE_ADMIN_PERMISSIONS.keys())
        for base_perm in base_perms:
            if base_perm not in granted:
                granted.append(base_perm)
        
        cache.set(cache_key, granted, 300)
        return granted

    @staticmethod
    def _get_user_modules_actions(user) -> Tuple[Set[str], Set[str]]:
        user_type = getattr(user, "user_type", None)
        is_staff = getattr(user, "is_staff", False)
        if user_type != 'admin' and not is_staff:
            return set(), set()
        
        cache_key_id = PermissionValidator._get_cache_key(user)
        if cache_key_id:
            redis_cache_key = UserCacheKeys.user_modules_actions(cache_key_id)
            cached_result = cache.get(redis_cache_key)
            if cached_result is not None:
                modules_list, actions_list = cached_result
                return set(modules_list), set(actions_list)
        
        modules: Set[str] = set()
        actions: Set[str] = set()
        try:
            roles_qs = AdminUserRole.objects.filter(
                user=user, 
                is_active=True
            ).select_related("role").only("role__permissions", "role__name")
            
            for user_role in roles_qs:
                role = user_role.role
                role_perms: Dict = role.permissions or {}
                
                if isinstance(role_perms, dict):
                    if 'specific_permissions' in role_perms:
                        specific_perms = role_perms.get('specific_permissions', [])
                        if isinstance(specific_perms, list):
                            for perm in specific_perms:
                                if isinstance(perm, dict):
                                    perm_module = perm.get('module')
                                    perm_action = perm.get('action')
                                    if perm_module:
                                        modules.add(perm_module)
                                        # Expand mappings
                                        if perm_module in MODULE_MAPPINGS:
                                            modules.update(MODULE_MAPPINGS[perm_module])
                                            
                                    if perm_action:
                                        if perm_action == 'read':
                                            actions.add('view')
                                            actions.add('read')
                                        elif perm_action == 'view':
                                            actions.add('view')
                                            actions.add('read')
                                        elif perm_action == 'manage':
                                            actions.update(['view', 'read', 'create', 'update', 'delete', 'manage'])
                                        else:
                                            actions.add(perm_action)
                    else:
                        role_modules = role_perms.get("modules", [])
                        role_actions = role_perms.get("actions", [])
                        
                        if isinstance(role_modules, list):
                            for mod in role_modules:
                                modules.add(mod)
                                # Expand mappings
                                if mod in MODULE_MAPPINGS:
                                    modules.update(MODULE_MAPPINGS[mod])
                                    
                        if isinstance(role_actions, list):
                            for action in role_actions:
                                if action == 'read':
                                    actions.add('view')
                                    actions.add('read')
                                elif action == 'view':
                                    actions.add('view')
                                    actions.add('read')
                                elif action == 'manage':
                                    actions.update(['view', 'read', 'create', 'update', 'delete', 'manage'])
                                else:
                                    actions.add(action)
                else:
                    pass
            
            if cache_key_id:
                redis_cache_key = UserCacheKeys.user_modules_actions(cache_key_id)
                cache.set(
                    redis_cache_key, 
                    (list(modules), list(actions)), 
                    PermissionValidator.CACHE_TIMEOUT
                )
                    
        except Exception:
            pass
        
        return modules, actions

