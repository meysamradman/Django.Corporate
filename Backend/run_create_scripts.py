"""
اجرای اسکریپت‌های ساخت نمونه داده از طریق Django shell
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.django.base')
django.setup()

print("=" * 60)
print("🚀 شروع ساخت داده‌های نمونه...")
print("=" * 60)

# Import اسکریپت‌ها
try:
    print("\n📝 در حال ساخت نمونه Blog...")
    from scripts import create_blog
    create_blog_result = create_blog.main() if hasattr(create_blog, 'main') else None
    print("✅ Blog ساخته شد")
except Exception as e:
    print(f"❌ خطا در ساخت Blog: {e}")

try:
    print("\n📁 در حال ساخت نمونه Portfolio...")
    from scripts import create_portfolio
    create_portfolio_result = create_portfolio.main() if hasattr(create_portfolio, 'main') else None
    print("✅ Portfolio ساخته شد")
except Exception as e:
    print(f"❌ خطا در ساخت Portfolio: {e}")

try:
    print("\n🏠 در حال ساخت نمونه Property...")
    from scripts import create_property
    create_property_result = create_property.main() if hasattr(create_property, 'main') else None
    print("✅ Property ساخته شد")
except Exception as e:
    print(f"❌ خطا در ساخت Property: {e}")

print("\n" + "=" * 60)
print("🎉 پایان ساخت داده‌های نمونه")
print("=" * 60)


