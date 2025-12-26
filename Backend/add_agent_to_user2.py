import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.django.base')
django.setup()

from src.user.models import User
from src.real_estate.models import PropertyAgent

print("\n" + "="*80)
print("ADDING PROPERTY AGENT TO USER ID 2")
print("="*80)

user = User.objects.get(id=2)
print(f"\nUser: {user.mobile}, is_superuser: {user.is_superuser}")

# Create PropertyAgent for this user
agent = PropertyAgent.objects.create(
    user=user,
    first_name='علی',
    last_name='محمدی',
    phone='09111111111',
    license_number='CONSULTANT-001',
    experience_years=3,
    specialization='Residential Real Estate'
)

print(f"\n✅ PropertyAgent created!")
print(f"  Agent ID: {agent.id}")
print(f"  Name: {agent.full_name}")
print(f"  License: {agent.license_number}")

print("\n" + "="*80)
print("UPDATED USER LIST:")
print("="*80)

users = User.objects.filter(user_type='admin', is_staff=True).order_by('id')
for u in users:
    has_agent = False
    try:
        if hasattr(u, 'real_estate_agent_profile') and u.real_estate_agent_profile is not None:
            has_agent = True
    except:
        pass
    
    if u.is_superuser:
        role = "SUPERUSER (always shown as Admin)"
    elif has_agent:
        role = "CONSULTANT (shown as Consultant)"
    else:
        role = "ADMIN (shown as Admin)"
    
    print(f"\nUser ID: {u.id} - Mobile: {u.mobile}")
    print(f"  Role: {role}")

print("\n" + "="*80)
