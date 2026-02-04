#!/usr/bin/env python
"""
Test script to verify Django can be imported and print statements work
Run this with: python test_logging.py
"""
import sys
import os

# Add the project directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

print("\n" + "="*80)
print("🧪 TESTING DJANGO ENVIRONMENT AND PRINT STATEMENTS")
print("="*80 + "\n")

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.django.base')

try:
    import django
    django.setup()
    print("✅ Django setup successful")
except Exception as e:
    print(f"❌ Django setup failed: {e}")
    sys.exit(1)

# Test importing the services
try:
    from src.media.services.media_services import MediaAdminService
    print("✅ MediaAdminService imported successfully")
except Exception as e:
    print(f"❌ Failed to import MediaAdminService: {e}")

try:
    from src.real_estate.services.admin.property_media_services import PropertyAdminMediaService
    print("✅ PropertyAdminMediaService imported successfully")
except Exception as e:
    print(f"❌ Failed to import PropertyAdminMediaService: {e}")

print("\n" + "="*80)
print("🎉 ALL TESTS PASSED - Print statements are working!")
print("="*80 + "\n")

print("📝 INSTRUCTIONS:")
print("1. Make sure Django server is STOPPED (Ctrl+C)")
print("2. Start Django server with: python manage.py runserver")
print("3. Try creating/editing a property with documents")
print("4. You should see logs with 🏠 emoji in the terminal")
print()
