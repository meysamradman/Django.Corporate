
import os
import sys
import django

# Add the project root to sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(BASE_DIR)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.django.base')
django.setup()

from django.contrib.auth import get_user_model
from src.user.models import AdminUserRole, AdminRole
from src.user.access_control.definitions import PermissionValidator
from src.user.access_control.definitions.config import SYSTEM_ROLES

User = get_user_model()

def test_permissions():
    print("--- Testing Permissions ---")
    
    # Create or get dummy users for testing
    agent_user, _ = User.objects.get_or_create(email='agent@test.com', defaults={'mobile': '09120000001', 'user_type': 'admin', 'is_staff': True, 'is_admin_active': True})
    manager_user, _ = User.objects.get_or_create(email='manager@test.com', defaults={'mobile': '09120000002', 'user_type': 'admin', 'is_staff': True, 'is_admin_active': True})
    
    # Inspect existing roles
    try:
        agent_role = AdminRole.objects.get(name='property_agent')
        print(f"\n[DB] property_agent permissions: {agent_role.permissions}")
    except AdminRole.DoesNotExist:
        print("\n[DB] property_agent role not found! Creating...")
        agent_role = AdminRole.objects.create(name='property_agent', permissions=SYSTEM_ROLES['property_agent'].default_permissions)

    try:
        manager_role = AdminRole.objects.get(name='real_estate_manager')
        print(f"\n[DB] real_estate_manager permissions: {manager_role.permissions}")
    except AdminRole.DoesNotExist:
        print("\n[DB] real_estate_manager role not found! Creating...")
        manager_role = AdminRole.objects.create(name='real_estate_manager', permissions=SYSTEM_ROLES['real_estate_manager'].default_permissions)

    # NEW: Test Role with Parent Module Only
    parent_only_role, _ = AdminRole.objects.get_or_create(
        name='real_estate_parent_only', 
        defaults={
            'permissions': {
                'modules': ['real_estate'], # Only parent module
                'actions': ['read']
            },
            'display_name': 'Real Estate Parent Only'
        }
    )
    parent_user, _ = User.objects.get_or_create(email='parent@test.com', defaults={'mobile': '09120000003', 'user_type': 'admin', 'is_staff': True, 'is_admin_active': True})
    AdminUserRole.objects.update_or_create(user=parent_user, role=parent_only_role, defaults={'is_active': True})
    PermissionValidator.clear_user_cache(parent_user.id)

    AdminUserRole.objects.update_or_create(user=agent_user, role=agent_role, defaults={'is_active': True})
    AdminUserRole.objects.update_or_create(user=manager_user, role=manager_role, defaults={'is_active': True})
    
    # Clear cache
    PermissionValidator.clear_user_cache(agent_user.id)
    PermissionValidator.clear_user_cache(manager_user.id)

    print(f"\nUser: {parent_user.email} (Role: real_estate_parent_only)")
    modules, actions = PermissionValidator._get_user_modules_actions(parent_user)
    print(f"Modules: {modules}")
    has_perm = PermissionValidator.has_permission(parent_user, 'real_estate.property.read')
    print(f"Has permission 'real_estate.property.read' (requires real_estate_properties): {has_perm}")
    
    # Test Permission: real_estate.property.read
    perm_id = 'real_estate.property.read'
    
    print(f"\nUser: {agent_user.email} (Role: property_agent)")
    modules, actions = PermissionValidator._get_user_modules_actions(agent_user)
    print(f"Modules: {modules}")
    print(f"Actions: {actions}")
    has_perm = PermissionValidator.has_permission(agent_user, perm_id)
    print(f"Has permission '{perm_id}': {has_perm}")
    
    print(f"\nUser: {manager_user.email} (Role: real_estate_manager)")
    modules, actions = PermissionValidator._get_user_modules_actions(manager_user)
    print(f"Modules: {modules}")
    print(f"Actions: {actions}")
    has_perm = PermissionValidator.has_permission(manager_user, perm_id)
    print(f"Has permission '{perm_id}': {has_perm}")

if __name__ == '__main__':
    test_permissions()
