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
    'chatbot': ['chatbot'],
    'ticket': ['ticket'],
    'statistics': ['statistics'],
    'forms': ['forms'],
    'admin': ['admin'],
}


# Generate classes dynamically from mapping
for module_name, related_modules in MODULE_MAPPINGS.items():
    class_name = f"{module_name.capitalize()}ManagerAccess"
    
    # ✅ FIXED: Create class that checks BOTH module AND manage action
    def make_init(modules):
        """Factory function to create __init__ with correct closure"""
        def __init__(self):
            RequireModuleAccess.__init__(self, *modules)
            # ✅ CRITICAL: Set required action to 'manage' for all ManagerAccess classes
            self.required_action = 'manage'
        return __init__
    
    # Create class dynamically
    permission_class = type(
        class_name,
        (RequireModuleAccess,),
        {
            '__init__': make_init(list(related_modules)),
            '__doc__': f'Permission class for {module_name} module - Requires {module_name}.manage permission',
            '__module__': __name__,
        }
    )
    
    # Add to module globals so it can be imported
    globals()[class_name] = permission_class


# Export all auto-generated classes
__all__ = [f"{m.capitalize()}ManagerAccess" for m in MODULE_MAPPINGS.keys()]
