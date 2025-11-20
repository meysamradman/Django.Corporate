"""
Permission Class Factory - Auto-generate permission classes from registry
Automatically creates permission classes from permission registry
"""
from typing import Dict, List
from src.user.authorization.admin_permission import RequireModuleAccess
from .config import PERMISSIONS


# Manual mapping for modules that need specific sub-modules
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
    'statistics': ['statistics'],
    'forms': ['forms'],
    'admin': ['admin'],
}


# Generate classes dynamically from mapping
for module_name, related_modules in MODULE_MAPPINGS.items():
    class_name = f"{module_name.capitalize()}ManagerAccess"
    
    # Create class dynamically
    permission_class = type(
        class_name,
        (RequireModuleAccess,),
        {
            '__init__': lambda self, modules=list(related_modules): RequireModuleAccess.__init__(self, *modules),
            '__doc__': f'Permission class for {module_name} module - Auto-generated from registry',
            '__module__': __name__,
        }
    )
    
    # Add to module globals so it can be imported
    globals()[class_name] = permission_class


# Export all auto-generated classes
__all__ = [f"{m.capitalize()}ManagerAccess" for m in MODULE_MAPPINGS.keys()]
