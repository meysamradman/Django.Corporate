"""
Test Email Sending with Mailtrap
Quick script to verify email configuration
"""

import os
import sys
import django

# Add project root to Python path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.django.base')
django.setup()

from django.core.mail import send_mail
from django.conf import settings

print("\n" + "="*60)
print("TESTING EMAIL CONFIGURATION")
print("="*60)

# Display current settings
print(f"\n[Email Settings]:")
print(f"  Backend: {settings.EMAIL_BACKEND}")
print(f"  Host: {settings.EMAIL_HOST}")
print(f"  Port: {settings.EMAIL_PORT}")
print(f"  User: {settings.EMAIL_HOST_USER}")
print(f"  From: {settings.DEFAULT_FROM_EMAIL}")
print(f"  TLS: {settings.EMAIL_USE_TLS}")

# Send test email
print(f"\n[Sending Test Email]...")
try:
    result = send_mail(
        subject='تست ایمیل از سیستم Corporate',
        message='این یک ایمیل تستی است.\n\nاگر این ایمیل را دریافت کردید، تنظیمات ایمیل شما صحیح است! ✅',
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=['test@example.com'],
        fail_silently=False,
    )
    
    print(f"  ✅ Email sent successfully!")
    print(f"  Result: {result}")
    print(f"\n[Next Step]:")
    print(f"  Check your Mailtrap inbox at: https://mailtrap.io/inboxes")
    
except Exception as e:
    print(f"  ❌ Error sending email: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "="*60)
print("TEST COMPLETED")
print("="*60 + "\n")
