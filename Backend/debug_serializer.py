import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.django.base')
django.setup()

from src.user.serializers.admin.admin_register_serializer import AdminCreateRegularUserSerializer
from src.user.models import User

# Create a mock admin user
class MockUser:
    def has_admin_access(self):
        return True
    is_superuser = False

admin_user = MockUser()

# Test data - similar to what frontend might send
test_cases = [
    {
        'name': 'Empty data',
        'data': {}
    },
    {
        'name': 'Only identifier and password',
        'data': {
            'identifier': '09123456789',
            'password': '123456'
        }
    },
    {
        'name': 'With profile data',
        'data': {
            'identifier': '09123456789',
            'password': '123456',
            'first_name': 'تست',
            'last_name': 'کاربر',
            'profile': {
                'first_name': 'تست',
                'last_name': 'کاربر'
            }
        }
    },
    {
        'name': 'With empty profile',
        'data': {
            'identifier': '09123456789',
            'password': '123456',
            'profile': {}
        }
    }
]

for test_case in test_cases:
    print(f"\n=== {test_case['name']} ===")
    print(f"Data: {test_case['data']}")
    
    serializer = AdminCreateRegularUserSerializer(data=test_case['data'], context={'admin_user': admin_user})
    
    if serializer.is_valid():
        print("✅ Valid!")
        print(f"Validated data keys: {list(serializer.validated_data.keys())}")
    else:
        print("❌ Invalid!")
        import json
        print("Errors:")
        print(json.dumps(serializer.errors, indent=2, ensure_ascii=False))
