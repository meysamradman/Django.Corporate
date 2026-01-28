from dataclasses import dataclass
from typing import Dict, List, Set, Optional, Any
from .config import PERMISSIONS

@dataclass(frozen=True)
class Permission:
    id: str
    module: str
    action: str
    display_name: str
    description: str
    requires_superadmin: bool = False
    is_standalone: bool = False
    permission_category: Optional[str] = None

class PermissionRegistry:
    _permissions: Dict[str, Permission] = {}

    @classmethod
    def register(cls, permission: Permission) -> None:
        cls._permissions[permission.id] = permission

    @classmethod
    def get(cls, permission_id: str) -> Optional[Permission]:
        return cls._permissions.get(permission_id)

    @classmethod
    def get_by_module(cls, module: str) -> List[Permission]:
        return [p for p in cls._permissions.values() if p.module == module]

    @classmethod
    def get_all(cls) -> Dict[str, Permission]:
        return dict(cls._permissions)

    @classmethod
    def exists(cls, permission_id: str) -> bool:
        return permission_id in cls._permissions

    @classmethod
    def get_modules(cls) -> Set[str]:
        return {p.module for p in cls._permissions.values()}

    @classmethod
    def export_for_frontend(cls) -> Dict:
        return {
            "permissions": {
                perm_id: {
                    "id": perm.id,
                    "module": perm.module,
                    "action": perm.action,
                    "display_name": perm.display_name,
                    "description": perm.description,
                    "requires_superadmin": perm.requires_superadmin,
                    "is_standalone": perm.is_standalone,
                    "permission_category": perm.permission_category,
                }
                for perm_id, perm in cls._permissions.items()
            },
            "modules": list(cls.get_modules()),
        }

for perm_id, perm_data in PERMISSIONS.items():
    PermissionRegistry.register(Permission(
        id=perm_id,
        module=perm_data['module'],
        action=perm_data['action'],
        display_name=perm_data['display_name'],
        description=perm_data['description'],
        requires_superadmin=perm_data.get('requires_superadmin', False),
        is_standalone=perm_data.get('is_standalone', False),
        permission_category=perm_data.get('permission_category'),
    ))
