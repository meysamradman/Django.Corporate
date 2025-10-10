from .user import User
from .roles import (
    # New advanced models
    AdminRole, 
    AdminUserRole,
    # Legacy models (backward compatibility)
    Role, 
    CustomPermission, 
    UserRole, 
    RolePermission
)
from .user_profile import UserProfile
from .admin_profile import AdminProfile
from .location import Province, City

__all__ = [
    # Core User Model
    'User',
    
    # Advanced Admin Permission System (Primary)
    'AdminRole', 
    'AdminUserRole',
    
    # Legacy Permission Models (Backward Compatibility)
    'Role', 
    'CustomPermission',
    'UserRole',
    'RolePermission',
    
    # Profile Models
    'UserProfile',
    'AdminProfile',
    
    # Location Models
    'Province',
    'City',
]