import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.django.base')
django.setup()

from src.user.serializers.admin.admin_register_serializer import AdminCreateRegularUserSerializer
from src.user.services.user.user_register_service import UserRegisterService
from src.user.models import User

# Create a mock admin user
class MockUser:
    def has_admin_access(self):
        return True
    is_superuser = False

admin_user = MockUser()

# Test data
data = {
    'identifier': '09123456789',
    'password': '123456',
    'first_name': 'تست',
    'last_name': 'کاربر'
}

print("Testing complete flow...")

# Step 1: Test serializer
print("\n1. Testing serializer...")
serializer = AdminCreateRegularUserSerializer(data=data, context={'admin_user': admin_user})

if serializer.is_valid():
    print("✅ Serializer is valid!")
    validated_data = serializer.validated_data
    print(f"Validated data keys: {list(validated_data.keys())}")
    
    # Step 2: Test service
    print("\n2. Testing service...")
    try:
        user = UserRegisterService.register_user_from_serializer(
            validated_data=validated_data,
            admin_user=admin_user
        )
        print("✅ User created successfully!")
        print(f"User ID: {user.id}")
        print(f"User email: {user.email}")
        print(f"User mobile: {user.mobile}")
        print(f"User type: {user.user_type}")
        
        # Check if profile was created
        if hasattr(user, 'profile'):
            print(f"Profile created: {user.profile}")
            print(f"Profile first_name: {user.profile.first_name}")
            print(f"Profile last_name: {user.profile.last_name}")
        else:
            print("❌ No profile found!")
            
    except Exception as e:
        print(f"❌ Service error: {e}")
        import traceback
        traceback.print_exc()
        
else:
    print("❌ Serializer is invalid!")
    import json
    print("Errors:")
    print(json.dumps(serializer.errors, indent=2, ensure_ascii=False))
