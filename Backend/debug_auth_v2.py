import os
import django
import sys
from django.conf import settings

# Setup Django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.django.base')
django.setup()

from src.user.models import User, AdminRole, AdminUserRole
from src.user.access_control.definitions.config import SYSTEM_ROLES
from src.user.access_control.definitions.validator import PermissionValidator
from src.user.access_control.classes.admin_permission import RequireModuleAccess
from src.user.access_control import real_estate_permission 

# Mock Request/View for RequireModuleAccess
class MockView:
    def __init__(self, action='list'):
        self.action = action
        self.__class__.__name__ = 'PropertyAdminViewSet'

class MockRequest:
    def __init__(self, user, method='GET'):
        self.user = user
        self.method = method
        self.query_params = {}

def run_debug():
    print("--- Debugging Permissions V2 ---")
    
    # 1. Setup User & Roles
    try:
        # Try to find the specific user mentioned by the user
        agent_user = User.objects.get(mobile='09121157259')
        print(f"\nUser Found: {agent_user.mobile} (ID: {agent_user.id})")
        
        # Check their role
        roles = AdminUserRole.objects.filter(user=agent_user, is_active=True)
        for r in roles:
            print(f"Assigned Role: {r.role.name}")
            print(f"Role Permissions: {r.role.permissions}")
            agent_role = r.role # Use this role for context
            
    except User.DoesNotExist:
        print("\nUser 09121157259 not found, falling back to clean test user.")
        try:
            agent_role = AdminRole.objects.get(name='property_agent')
        except AdminRole.DoesNotExist:
            agent_role = AdminRole.objects.create(name='property_agent', permissions=SYSTEM_ROLES['property_agent'].default_permissions)

        agent_user, _ = User.objects.get_or_create(email='agent_v2@test.com', defaults={'mobile': '09120000004', 'user_type': 'admin', 'is_staff': True, 'is_admin_active': True})
        AdminUserRole.objects.update_or_create(user=agent_user, role=agent_role, defaults={'is_active': True})
    
    PermissionValidator.clear_user_cache(agent_user.id)
    
    # 2. Test PermissionValidator (Mixin Logic)
    print("\n[Layer 1] Testing PermissionValidator (Mixin Logic)")
    modules, actions = PermissionValidator._get_user_modules_actions(agent_user)
    print(f"Expanded Modules: {modules}")
    print(f"Actions: {actions}")
    
    perm_id = 'real_estate.property.read'
    has_perm_validator = PermissionValidator.has_permission(agent_user, perm_id)
    print(f"PermissionValidator.has_permission('{perm_id}'): {has_perm_validator} (Expected: True)")
    
    # 3. Test RequireModuleAccess (real_estate_permission Logic)
    print("\n[Layer 2] Testing real_estate_permission (RequireModuleAccess)")
    view = MockView(action='list')
    request = MockRequest(agent_user)
    
    # Instantiate the permission class
    perm_instance = real_estate_permission()
    
    # Check what required modules real_estate_permission has (instance attribute)
    print(f"Required Modules: {perm_instance.required_modules}")
    
    has_perm_class = perm_instance.has_permission(request, view)
    print(f"real_estate_permission.has_permission: {has_perm_class} (Expected: True)")
    
    if not has_perm_class:
        print("\n--- DEBUGGING FAILURE ---")
        # Dive into _check_admin_role_permissions logic
        print("Debugging why RequireModuleAccess failed...")
        # Check matching logic manually
        for mod in perm_instance.required_modules:
            print(f"Required Module: {mod}")
            normalized_req = perm_instance._normalize_module_name(mod)
            print(f"Normalized Required: {normalized_req}")
            
            user_modules = modules # From Validator check above
            print(f"User Modules: {user_modules}")
            
            # Simulate _module_matches
            matches = any(
                perm_instance._module_matches(allowed_mod, mod) for allowed_mod in user_modules
            )
            print(f"Matches for {mod}: {matches} (checking if any user module matches this required module)")

if __name__ == "__main__":
    run_debug()
