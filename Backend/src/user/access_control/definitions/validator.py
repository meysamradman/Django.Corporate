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

        module_perms = PermissionValidator._get_user_module_permissions(user)
        
        global_actions = module_perms.get('all', set())
        if "all" in global_actions or "manage" in global_actions or perm.action in global_actions:
            return True
            
        module_actions = module_perms.get(perm.module, set())
        if "all" in module_actions or "manage" in module_actions or perm.action in module_actions:
            return True
            
        if perm.action in ['read', 'view'] and module_actions:
            return True
            
        for user_module, actions in module_perms.items():
            if user_module == 'all': continue
            if perm.module.startswith(user_module + '.'):
                if "all" in actions or "manage" in actions or perm.action in actions:
                    return True
                if perm.action in ['read', 'view'] and actions:
                    return True
                    
        return False

    @staticmethod
    def _check_context_permission(user, permission_id: str, context: Dict) -> bool:
        context_type = context.get('type')
        context_action = context.get('action', 'create')
        
        if permission_id != 'media.upload':
            return False
        
        if not context_type or context_type == 'media_library':
            return False
        
        module_perms = PermissionValidator._get_user_module_permissions(user)
        
        for mod in ['all', context_type]:
            actions = module_perms.get(mod, set())
            if "all" in actions or "manage" in actions or context_action in actions:
                return True
                
        return False

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
            module_perms = PermissionValidator._get_user_module_permissions(user)
            
            for perm_id, perm in PermissionRegistry.get_all().items():
                if perm.requires_superadmin and not is_superadmin:
                    continue
                
                global_actions = module_perms.get('all', set())
                has_global = "all" in global_actions or "manage" in global_actions or perm.action in global_actions
                
                if has_global:
                    if perm_id not in granted:
                        granted.append(perm_id)
                    continue
                    
                module_actions = module_perms.get(perm.module, set())
                has_module_access = "all" in module_actions or "manage" in module_actions or perm.action in module_actions
                
                if has_module_access:
                    if perm_id not in granted:
                        granted.append(perm_id)
                    continue
                    
                for user_module, actions in module_perms.items():
                    if user_module == 'all': continue
                    if perm.module.startswith(user_module + '.'):
                        if "all" in actions or "manage" in actions or perm.action in actions:
                            if perm_id not in granted:
                                granted.append(perm_id)
                            break
        
        for perm_id, perm in PermissionRegistry.get_all().items():
            if perm_id in granted: continue
            if perm.requires_superadmin and not is_superadmin:
                continue
            
            if perm.action in ['read', 'view']:
                has_any_in_module = any(g.startswith(perm.module + '.') or g == perm_id for g in granted)
                if not has_any_in_module:
                    for g_id in granted:
                        g_perm = PermissionRegistry.get(g_id)
                        if g_perm and g_perm.module == perm.module:
                            has_any_in_module = True
                            break
                
                if has_any_in_module:
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
    def _get_user_module_permissions(user) -> Dict[str, Set[str]]:
        user_type = getattr(user, "user_type", None)
        is_staff = getattr(user, "is_staff", False)
        is_superadmin = getattr(user, "is_superuser", False) or getattr(user, "is_admin_full", False)
        if user_type != 'admin' and not is_staff:
            return {}
        
        cache_key_id = PermissionValidator._get_cache_key(user)
        if cache_key_id:
            redis_cache_key = UserCacheKeys.user_module_perms(cache_key_id)
            cached_result = cache.get(redis_cache_key)
            if cached_result is not None:
                return {k: set(v) for k, v in cached_result.items()}
        
        module_to_actions: Dict[str, Set[str]] = {}
        try:
            roles_qs = AdminUserRole.objects.filter(
                user=user, 
                is_active=True
            ).select_related("role").only("role__permissions", "role__name")
            
            for user_role in roles_qs:
                role = user_role.role
                role_perms: Dict = role.permissions or {}
                
                if not isinstance(role_perms, dict):
                    continue
                    
                if 'specific_permissions' in role_perms:
                    specific_perms = role_perms.get('specific_permissions', [])
                    if isinstance(specific_perms, list):
                        for perm in specific_perms:
                            if isinstance(perm, dict):
                                permission_key = perm.get('permission_key')
                                if permission_key:
                                    perm_obj = PermissionRegistry.get(permission_key)
                                    if not perm_obj:
                                        continue
                                    if perm_obj.requires_superadmin and not is_superadmin:
                                        continue
                                    perm_module = perm_obj.module
                                    perm_action = perm_obj.action
                                else:
                                    perm_module = perm.get('module')
                                    perm_action = perm.get('action')
                                if not perm_module: continue
                                
                                target_modules = {perm_module}
                                if perm_module in MODULE_MAPPINGS:
                                    target_modules.update(MODULE_MAPPINGS[perm_module])
                                    
                                normalized_actions = set()
                                if perm_action:
                                    if perm_action in ['read', 'view']:
                                        normalized_actions.update(['read', 'view'])
                                    elif perm_action == 'manage':
                                        normalized_actions.update(['read', 'view', 'create', 'update', 'delete', 'manage'])
                                    else:
                                        normalized_actions.add(perm_action)
                                
                                for mod in target_modules:
                                    if mod not in module_to_actions:
                                        module_to_actions[mod] = set()
                                    module_to_actions[mod].update(normalized_actions)
                else:
                    role_modules = role_perms.get("modules", [])
                    role_actions = role_perms.get("actions", [])
                    
                    if isinstance(role_modules, list) and isinstance(role_actions, list):
                        normalized_actions = set()
                        for action in role_actions:
                            if action in ['read', 'view']:
                                normalized_actions.update(['read', 'view'])
                            elif action == 'manage':
                                normalized_actions.update(['read', 'view', 'create', 'update', 'delete', 'manage'])
                            else:
                                normalized_actions.add(action)
                        
                        for mod in role_modules:
                            target_modules = {mod}
                            if mod in MODULE_MAPPINGS:
                                target_modules.update(MODULE_MAPPINGS[mod])
                                
                            for target_mod in target_modules:
                                if target_mod not in module_to_actions:
                                    module_to_actions[target_mod] = set()
                                module_to_actions[target_mod].update(normalized_actions)
            
            if cache_key_id:
                redis_cache_key = UserCacheKeys.user_module_perms(cache_key_id)
                cache.set(
                    redis_cache_key, 
                    {k: list(v) for k, v in module_to_actions.items()}, 
                    PermissionValidator.CACHE_TIMEOUT
                )
                    
        except Exception:
            pass
        
        return module_to_actions

    @staticmethod
    def _get_user_modules_actions(user) -> Tuple[Set[str], Set[str]]:
        
        module_perms = PermissionValidator._get_user_module_permissions(user)
        modules = set(module_perms.keys())
        actions = set()
        for action_set in module_perms.values():
            actions.update(action_set)
        return modules, actions

