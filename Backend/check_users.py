import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.django.base')
django.setup()

from src.user.models import User
from src.real_estate.models import PropertyAgent

print("\n" + "="*80)
print("CHECKING USERS AND PROPERTY AGENTS")
print("="*80)

# Get all admin users
users = User.objects.filter(user_type='admin', is_staff=True)
print(f"\n=== Total Admin Users: {users.count()} ===\n")

for u in users:
    has_agent = False
    agent_id = None
    try:
        if hasattr(u, 'real_estate_agent_profile') and u.real_estate_agent_profile is not None:
            has_agent = True
            agent_id = u.real_estate_agent_profile.id
    except:
        pass
    
    print(f"User ID: {u.id}")
    print(f"  Mobile: {u.mobile}")
    print(f"  Email: {u.email}")
    print(f"  is_superuser: {u.is_superuser}")
    print(f"  has PropertyAgent: {has_agent}")
    if has_agent:
        print(f"  PropertyAgent ID: {agent_id}")
    print()

# Get all property agents
agents = PropertyAgent.objects.all()
print(f"=== Total PropertyAgent Records: {agents.count()} ===\n")

for a in agents:
    print(f"Agent ID: {a.id}")
    print(f"  User ID: {a.user_id}")
    print(f"  Name: {a.first_name} {a.last_name}")
    print(f"  License: {a.license_number}")
    print()

print("="*80)
