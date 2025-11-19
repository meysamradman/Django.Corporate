#!/usr/bin/env python
"""
Production Setup Script
🚀 Complete setup for admin system in production
- Creates all admin roles
- Creates main admin with full access
- Assigns all roles to main admin
"""

import os
import sys
import django
from django.db import transaction

# Add project root to Python path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.django.base')
django.setup()

from src.user.models import User, AdminRole, AdminUserRole
from src.user.permissions.config import SYSTEM_ROLES as ADMIN_ROLE_PERMISSIONS

def setup_production_admin():
    """Complete admin setup for production"""
    
    print("🚀 Production Admin Setup Starting...")
    print("=" * 50)
    
    # Step 1: Create admin roles
    print("\n📝 Step 1: Creating admin roles...")
    created_roles = 0
    
    with transaction.atomic():
        for role_name, config in ADMIN_ROLE_PERMISSIONS.items():
            role, created = AdminRole.objects.get_or_create(
                name=role_name,
                defaults={
                    'display_name': config['display_name'],
                    'description': config['description'],
                    'level': config['level'],
                    'permissions': config['permissions'],
                    'is_system_role': True,
                    'is_active': True
                }
            )
            
            if created:
                print(f"  ✅ Created: {role.display_name}")
                created_roles += 1
            else:
                print(f"  ⚠️ Exists: {role.display_name}")
    
    print(f"📊 Total roles in system: {AdminRole.objects.count()}")
    
    # Step 2: Create or verify main admin
    print("\n👤 Step 2: Setting up main admin...")
    
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
    
    # Step 3: Assign appropriate roles to main admin (based on Permission_System.md)
    print("\n🔗 Step 3: Assigning appropriate roles to main admin...")
    
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
    
    # Step 4: Summary
    print("\n" + "=" * 50)
    print("🎉 PRODUCTION SETUP COMPLETED!")
    print("=" * 50)
    print(f"📱 Main Admin Mobile: {main_admin.mobile}")
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
    print("  ✅ Protected from deletion")
    print("\n🚀 Ready for production!")
    
    return main_admin

if __name__ == '__main__':
    try:
        admin = setup_production_admin()
        print(f"\n🎯 Login with: {admin.mobile} / 1047")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
