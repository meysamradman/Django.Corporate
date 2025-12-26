#!/usr/bin/env python
"""
Create Sample Real Estate Consultant Script
🏢 Creates a sample real estate consultant for testing
"""

import os
import sys
import django
from django.db import transaction
from datetime import date, timedelta

# Add project root to Python path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.django.base')
django.setup()

from src.user.models import User, AdminProfile
from src.core.models import Province, City
from src.real_estate.models import PropertyAgent, RealEstateAgency

def create_sample_consultant():
    """Create a sample real estate consultant"""
    
    print("🏢 Sample Consultant Creation Starting...")
    print("=" * 50)
    
    CONSULTANT_MOBILE = "09121234567"
    CONSULTANT_PASSWORD = "consultant123"
    CONSULTANT_EMAIL = "consultant@example.com"
    
    try:
        with transaction.atomic():
            # Step 1: Create or get User
            print("\n👤 Step 1: Creating consultant user...")
            
            try:
                consultant_user = User.objects.get(mobile=CONSULTANT_MOBILE)
                print(f"  ⚠️ User already exists: {consultant_user.mobile}")
                
                # Update to ensure correct settings
                consultant_user.user_type = 'admin'
                consultant_user.is_staff = True
                consultant_user.is_active = True
                consultant_user.is_admin_active = True
                consultant_user.email = CONSULTANT_EMAIL
                consultant_user.save()
                print("  🔄 Updated user settings")
                
            except User.DoesNotExist:
                consultant_user = User.objects.create_user(
                    mobile=CONSULTANT_MOBILE,
                    email=CONSULTANT_EMAIL,
                    password=CONSULTANT_PASSWORD,
                    user_type='admin',
                    is_staff=True,
                    is_active=True,
                    is_admin_active=True,
                    is_superuser=False  # Consultants are NOT superusers
                )
                print(f"  ✅ Created user: {consultant_user.mobile}")
            
            # Step 2: Create or update AdminProfile
            print("\n📋 Step 2: Creating admin profile...")
            
            admin_profile, created = AdminProfile.objects.get_or_create(
                admin_user=consultant_user,
                defaults={
                    'first_name': 'علی',
                    'last_name': 'محمدی',
                    'national_id': '1234567890',
                    'phone': '02188776655',
                    'address': 'تهران، خیابان ولیعصر، پلاک 123',
                    'bio': 'مشاور املاک با ۱۰ سال سابقه در زمینه خرید و فروش املاک مسکونی و تجاری',
                    'birth_date': date(1985, 5, 15)
                }
            )
            
            if created:
                print(f"  ✅ Created admin profile for: {admin_profile.first_name} {admin_profile.last_name}")
            else:
                print(f"  ⚠️ Admin profile already exists")
            
            # Get location (Tehran)
            tehran_province = None
            tehran_city = None
            try:
                tehran_province = Province.objects.get(name='تهران')
                tehran_city = City.objects.get(name='تهران', province=tehran_province)
                admin_profile.province = tehran_province
                admin_profile.city = tehran_city
                admin_profile.save()
                print(f"  ✅ Set location: {tehran_province.name} - {tehran_city.name}")
            except Exception as e:
                print(f"  ⚠️ Could not set location: {e}")
                print(f"  ⚠️ Will create agency without location")
            
            # Step 3: Get or create RealEstateAgency
            print("\n🏢 Step 3: Creating real estate agency...")
            
            # Skip agency creation if no city
            if not tehran_city:
                print(f"  ⚠️ Skipping agency creation (no city available)")
                agency = None
            else:
                agency, created = RealEstateAgency.objects.get_or_create(
                    license_number='AG-12345',  # Required field
                    defaults={
                        'name': 'آژانس املاک آرمان',
                        'slug': 'arman-agency',
                        'description': 'آژانس معتبر املاک با بیش از ۲۰ سال سابقه',
                        'address': 'تهران، میدان ونک، ساختمان برج سفید',
                        'phone': '02122334455',
                        'email': 'info@armanagency.com',
                        'city': tehran_city,  # Required field
                        'province': tehran_province,
                        'is_active': True
                    }
                )
                
                if created:
                    print(f"  ✅ Created agency: {agency.name}")
                else:
                    print(f"  ⚠️ Agency already exists: {agency.name}")
            
            # Step 4: Create PropertyAgent profile
            print("\n🎯 Step 4: Creating property agent profile...")
            
            try:
                agent = PropertyAgent.objects.get(user=consultant_user)
                print(f"  ⚠️ PropertyAgent already exists for this user")
                
                # Update existing agent
                agent.license_number = 'RE-12345'
                agent.license_expire_date = date.today() + timedelta(days=365)
                agent.specialization = 'املاک مسکونی و تجاری - خرید و فروش'
                agent.agency = agency
                agent.bio = 'مشاور حرفه‌ای املاک با تخصص در املاک لوکس و تجاری در منطقه تهران'
                agent.is_verified = True
                
                # SEO Fields
                agent.meta_title = 'علی محمدی - مشاور املاک حرفه‌ای'
                agent.meta_description = 'مشاور املاک با ۱۰ سال سابقه در خرید و فروش املاک مسکونی و تجاری در تهران'
                agent.og_title = 'علی محمدی - مشاور املاک'
                agent.og_description = 'بهترین مشاور املاک برای خرید و فروش ملک در تهران'
                
                agent.save()
                print(f"  🔄 Updated PropertyAgent profile")
                
            except PropertyAgent.DoesNotExist:
                agent = PropertyAgent.objects.create(
                    user=consultant_user,
                    license_number='RE-12345',
                    license_expire_date=date.today() + timedelta(days=365),
                    specialization='املاک مسکونی و تجاری - خرید و فروش',
                    agency=agency,
                    bio='مشاور حرفه‌ای املاک با تخصص در املاک لوکس و تجاری در منطقه تهران',
                    is_verified=True,
                    
                    # SEO Fields
                    meta_title='علی محمدی - مشاور املاک حرفه‌ای',
                    meta_description='مشاور املاک با ۱۰ سال سابقه در خرید و فروش املاک مسکونی و تجاری در تهران',
                    og_title='علی محمدی - مشاور املاک',
                    og_description='بهترین مشاور املاک برای خرید و فروش ملک در تهران'
                )
                print(f"  ✅ Created PropertyAgent profile")
            
            # Step 5: Summary
            print("\n" + "=" * 50)
            print("🎉 SAMPLE CONSULTANT CREATED!")
            print("=" * 50)
            print(f"📱 Mobile: {consultant_user.mobile}")
            print(f"📧 Email: {consultant_user.email}")
            print(f"🔐 Password: {CONSULTANT_PASSWORD}")
            print(f"👤 Name: {admin_profile.first_name} {admin_profile.last_name}")
            print(f"🆔 User ID: {consultant_user.id}")
            print(f"🏢 Agency: {agency.name if agency else 'N/A'}")
            print(f"📜 License: {agent.license_number}")
            print(f"📅 License Expiry: {agent.license_expire_date}")
            print(f"✅ Verified: {'Yes' if agent.is_verified else 'No'}")
            print(f"🎯 Specialization: {agent.specialization}")
            
            print("\n🔗 Access URLs:")
            print(f"  View: http://localhost:5173/admins/consultants/{consultant_user.id}/view")
            print(f"  Edit: http://localhost:5173/admins/consultants/{consultant_user.id}/edit")
            
            print("\n🚀 Ready to test!")
            
            return consultant_user, agent
            
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        raise

if __name__ == '__main__':
    try:
        user, agent = create_sample_consultant()
        print(f"\n🎯 Login with: {user.mobile} / consultant123")
    except Exception as e:
        print(f"\n❌ Failed to create consultant: {e}")
