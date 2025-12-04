from typing import Dict, List
from .config import PERMISSIONS
from .module_mappings import MODULE_MAPPINGS



def _create_permission_classes():
    from src.user.authorization.admin_permission import RequireModuleAccess
    
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
        
        globals()[class_name] = permission_class

_create_permission_classes()


__all__ = [f"{m.capitalize()}ManagerAccess" for m in MODULE_MAPPINGS.keys()]
