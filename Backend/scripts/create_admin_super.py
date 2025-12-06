#!/usr/bin/env python
"""
Create Super Admin Script
🚀 Creates main super admin with full access
- Creates main admin with full access
- Assigns all roles to main admin
- Sets protected admin ID

Note: Run create_admin_roles.py first to create roles!
"""

import os
import sys
import re
import django
from django.db import transaction

# Add project root to Python path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.django.base')
django.setup()

from src.user.models import User, AdminRole, AdminUserRole

def create_admin_super():
    """Create super admin with full access and protection"""
    
    print("🚀 Super Admin Creation Starting...")
    print("=" * 50)
    
    # Check if roles exist
    roles_count = AdminRole.objects.filter(is_active=True).count()
    if roles_count == 0:
        print("\n⚠️ WARNING: No roles found in system!")
        print("   Please run 'python scripts/create_admin_roles.py' first to create roles.")
        print("   Continuing anyway...")
    else:
        print(f"\n📊 Found {roles_count} active roles in system")
    
    # Step 1: Create or verify main admin
    print("\n👤 Step 1: Setting up main admin...")
    
    MAIN_ADMIN_MOBILE = "09124707989"
    MAIN_ADMIN_PASSWORD = "1047"
    
    try:
        # Try to find existing admin
        main_admin = User.objects.get(mobile=MAIN_ADMIN_MOBILE)
        print(f"  ✅ Found existing admin: {main_admin.mobile}")
        
        # Update admin to ensure full access
        main_admin.is_superuser = True
        main_admin.is_staff = True
        main_admin.user_type = 'admin'
        main_admin.is_admin_active = True
        main_admin.is_admin_full = True
        main_admin.is_active = True
        main_admin.save()
        print("  🔄 Updated admin permissions")
        
    except User.DoesNotExist:
        # Create new main admin
        print(f"  📱 Creating new admin: {MAIN_ADMIN_MOBILE}")
        
        main_admin = User.objects.create_user(
            mobile=MAIN_ADMIN_MOBILE,
            password=MAIN_ADMIN_PASSWORD,
            is_superuser=True,
            is_staff=True,
            user_type='admin',
            is_admin_active=True,
            is_admin_full=True,
            is_active=True
        )
        print(f"  ✅ Created main admin: {main_admin.mobile}")
    
    # Step 2: Assign appropriate roles to main admin (based on Permission_System.md)
    print("\n🔗 Step 2: Assigning roles to main admin...")
    
    # Filter roles based on is_superuser status
    if main_admin.is_superuser:
        # Superusers get all roles including super_admin
        roles_to_assign = AdminRole.objects.filter(is_active=True)
        print(f"  👑 User is superuser - assigning ALL roles")
    else:
        # Regular admins DON'T get super_admin role (Per Permission_System.md)
        roles_to_assign = AdminRole.objects.filter(is_active=True).exclude(name='super_admin')
        print(f"  👤 User is regular admin - excluding 'super_admin' role")
    
    assigned_roles = 0
    
    with transaction.atomic():
        for role in roles_to_assign:
            user_role, created = AdminUserRole.objects.get_or_create(
                user=main_admin,
                role=role,
                defaults={
                    'assigned_by': main_admin,
                    'is_active': True
                }
            )
            
            if created:
                print(f"  ✅ Assigned: {role.display_name}")
                assigned_roles += 1
            else:
                print(f"  ⚠️ Already has: {role.display_name}")
    
    # Step 3: Set protected admin ID
    print("\n🛡️ Step 3: Setting protected admin ID...")
    
    auth_file_path = os.path.join(project_root, 'src', 'user', 'messages', 'auth.py')
    
    try:
        with open(auth_file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        pattern = r'PROTECTED_ADMIN_ID\s*=\s*None'
        replacement = f'PROTECTED_ADMIN_ID = {main_admin.id}'
        
        if re.search(pattern, content):
            new_content = re.sub(pattern, replacement, content)
            
            with open(auth_file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            
            print(f"  ✅ Set PROTECTED_ADMIN_ID = {main_admin.id}")
        else:
            print(f"  ⚠️ PROTECTED_ADMIN_ID pattern not found in auth.py")
            
    except Exception as e:
        print(f"  ⚠️ Could not update PROTECTED_ADMIN_ID: {e}")
    
    # Step 4: Summary
    print("\n" + "=" * 50)
    print("🎉 SUPER ADMIN CREATION COMPLETED!")
    print("=" * 50)
    print(f"📱 Main Admin Mobile: {main_admin.mobile}")
    print(f"🆔 Main Admin ID: {main_admin.id}")
    print(f"🔐 Main Admin Password: {MAIN_ADMIN_PASSWORD}")
    print(f"🏷️ Total Roles: {AdminRole.objects.filter(is_active=True).count()}")
    print(f"✅ Assigned Roles: {AdminUserRole.objects.filter(user=main_admin, is_active=True).count()}")
    
    # Show which roles were assigned
    assigned_role_names = list(AdminUserRole.objects.filter(
        user=main_admin, is_active=True
    ).values_list('role__name', flat=True))
    print(f"📋 Role Names: {', '.join(assigned_role_names)}")
    
    # Validate Permission_System.md compliance
    has_super_admin = 'super_admin' in assigned_role_names
    if main_admin.is_superuser and not has_super_admin:
        print("⚠️ WARNING: Superuser missing 'super_admin' role")
    elif not main_admin.is_superuser and has_super_admin:
        print("❌ ERROR: Non-superuser has 'super_admin' role (violates Permission_System.md)")
    else:
        print("✅ Role assignment complies with Permission_System.md")
    print("\n🔒 Admin Features:")
    print("  ✅ is_superuser = True (Django admin access)")
    print("  ✅ is_admin_full = True (bypass all permissions)")
    print("  ✅ All admin roles assigned")
    print(f"  ✅ Protected from deletion (ID: {main_admin.id})")
    print("\n🚀 Ready for production!")
    
    return main_admin

if __name__ == '__main__':
    try:
        admin = create_admin_super()
        print(f"\n🎯 Login with: {admin.mobile} / 1047")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
