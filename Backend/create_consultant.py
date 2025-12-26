import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.django.base')
django.setup()

from src.user.models import User, AdminProfile
from src.real_estate.models import PropertyAgent

print("\n" + "="*80)
print("CREATING TEST CONSULTANT USER")
print("="*80)

# Create a consultant user (admin with PropertyAgent, but NOT superuser)
consultant_user = User.objects.create_user(
    mobile='09111111111',
    password='test123',
    user_type='admin',
    is_staff=True,
    is_admin_active=True,
    is_superuser=False  # NOT superuser!
)

# Create admin profile
admin_profile = AdminProfile.objects.create(
    admin_user=consultant_user,
    first_name='علی',
    last_name='محمدی'
)

# Create PropertyAgent profile
property_agent = PropertyAgent.objects.create(
    user=consultant_user,
    first_name='علی',
    last_name='محمدی',
    phone='09111111111',
    license_number='AGENT-001',
    experience_years=5
)

print(f"\n✅ Created consultant user:")
print(f"  User ID: {consultant_user.id}")
print(f"  Mobile: {consultant_user.mobile}")
print(f"  is_superuser: {consultant_user.is_superuser}")
print(f"  PropertyAgent ID: {property_agent.id}")
print(f"  Agent Name: {property_agent.full_name}")

print("\n" + "="*80)
print("FINAL USER LIST:")
print("="*80)

users = User.objects.filter(user_type='admin', is_staff=True)
for u in users:
    has_agent = False
    try:
        if hasattr(u, 'real_estate_agent_profile') and u.real_estate_agent_profile is not None:
            has_agent = True
    except:
        pass
    
    role = "SUPERUSER" if u.is_superuser else ("CONSULTANT" if has_agent else "ADMIN")
    print(f"\nUser ID: {u.id} - Mobile: {u.mobile}")
    print(f"  Role: {role}")
    print(f"  is_superuser: {u.is_superuser}, has_agent: {has_agent}")

print("\n" + "="*80)
