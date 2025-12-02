from typing import Dict, List
from src.user.authorization.admin_permission import RequireModuleAccess
from .config import PERMISSIONS


MODULE_MAPPINGS = {
    'blog': ['blog', 'blog_categories', 'blog_tags', 'media'],
    'portfolio': ['portfolio', 'portfolio_categories', 'portfolio_tags', 'portfolio_options', 'portfolio_option_values', 'media'],
    'users': ['users'],
    'media': ['media'],
    'panel': ['panel'],
    'pages': ['pages'],
    'settings': ['settings'],
    'email': ['email'],
    'ai': ['ai'],
    'chatbot': ['chatbot'],
    'ticket': ['ticket'],
    'statistics': ['statistics'],
    'forms': ['forms'],
    'admin': ['admin'],
}


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


__all__ = [f"{m.capitalize()}ManagerAccess" for m in MODULE_MAPPINGS.keys()]
