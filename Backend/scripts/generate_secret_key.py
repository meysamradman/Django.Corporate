#!/usr/bin/env python
"""
🔐 Django SECRET_KEY Generator
==============================

این اسکریپت یک SECRET_KEY امن و تصادفی برای Django تولید می‌کند.

استفاده:
    python scripts/generate_secret_key.py

خروجی:
    یک کلید 50 کاراکتری کاملاً تصادفی که می‌توانید در .env استفاده کنید.
"""

import secrets
import string


def generate_secret_key(length=50):
    """
    تولید یک SECRET_KEY امن
    
    Args:
        length (int): طول کلید (پیش‌فرض 50 کاراکتر)
    
    Returns:
        str: کلید تولید شده
    """
    # کاراکترهای مجاز
    chars = string.ascii_letters + string.digits + '!@#$%^&*(-_=+)'
    
    # تولید کلید تصادفی
    key = ''.join(secrets.choice(chars) for _ in range(length))
    
    return key


def generate_django_secret_key():
    """
    تولید SECRET_KEY به سبک Django
    (همان متدی که Django استفاده می‌کند)
    """
    from django.core.management.utils import get_random_secret_key
    return get_random_secret_key()


if __name__ == '__main__':
    print("=" * 70)
    print("🔐 Django SECRET_KEY Generator")
    print("=" * 70)
    print()
    
    # روش 1: تولید دستی
    print("📌 روش 1: تولید دستی (50 کاراکتر)")
    manual_key = generate_secret_key(50)
    print(f"   {manual_key}")
    print()
    
    # روش 2: تولید با Django
    print("📌 روش 2: تولید با Django (همان متد رسمی)")
    try:
        django_key = generate_django_secret_key()
        print(f"   {django_key}")
    except ImportError:
        print("   ⚠️  Django نصب نیست. از روش 1 استفاده کنید.")
    print()
    
    print("=" * 70)
    print("✅ کلید بالا را کپی کرده و در .env قرار دهید:")
    print("   SECRET_KEY=YOUR_KEY_HERE")
    print("=" * 70)
    print()
    print("⚠️  نکات مهم:")
    print("   1. هرگز این کلید را در git commit نکنید")
    print("   2. در هر محیط (Local/Production) کلید متفاوتی استفاده کنید")
    print("   3. اگر کلید لو رفت، فوراً آن را تغییر دهید")
    print("=" * 70)
