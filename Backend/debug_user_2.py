import os
import django
import sys

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'src.config.settings')
django.setup()

from src.user.models import User
from src.real_estate.models.agent import PropertyAgent

def check_user_2():
    try:
        user = User.objects.get(id=2)
        print(f"✅ User found: {user.id}")
        print(f"   user_type: '{user.user_type}'")
        print(f"   is_staff: {user.is_staff}")
        print(f"   is_admin_active: {user.is_admin_active}")
        print(f"   is_active: {user.is_active}")
        
        # Check Agent profile
        try:
            agent = PropertyAgent.objects.get(user=user)
            print(f"✅ Agent profile found: {agent.id}")
        except PropertyAgent.DoesNotExist:
            print("❌ No Agent profile found via query")
            
        try:
            print(f"   user.real_estate_agent_profile: {user.real_estate_agent_profile}")
        except Exception as e:
            print(f"   Accessing user.real_estate_agent_profile raised: {e}")

        # Check filter used in get_admin_detail
        qs = User.objects.filter(id=2, user_type='admin', is_staff=True, is_admin_active=True)
        if qs.exists():
            print("✅ check_admin_detail query WOULD SUCCEED matching this user")
        else:
            print("❌ check_admin_detail query WOULD FAIL matching this user")
            # Analyze why
            if user.user_type != 'admin': print("   -> Fails on user_type='admin'")
            if not user.is_staff: print("   -> Fails on is_staff=True")
            if not user.is_admin_active: print("   -> Fails on is_admin_active=True")

    except User.DoesNotExist:
        print("❌ User 2 does NOT exist")
    except Exception as e:
        print(f"❌ Error checking user: {e}")

if __name__ == "__main__":
    check_user_2()
