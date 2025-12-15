"""
غیرفعال کردن همه Provider ها

این اسکریپت همه Provider های موجود در دیتابیس رو غیرفعال می‌کنه.

استفاده:
    python manage.py shell < scripts/deactivate_all_providers.py
"""
import os
import sys
import django

# Setup Django
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.django.base')
django.setup()

from src.ai.models import AIProvider


def deactivate_all():
    """غیرفعال کردن همه Provider ها"""
    print("=" * 60)
    print("⚠️  غیرفعال کردن همه Provider ها")
    print("=" * 60)
    
    providers = AIProvider.objects.all()
    total = providers.count()
    
    if total == 0:
        print("\n❌ هیچ Provider ای یافت نشد!")
        return
    
    print(f"\n📊 تعداد کل Provider ها: {total}\n")
    
    # نمایش لیست
    for p in providers.order_by('sort_order'):
        status = "✅ فعال" if p.is_active else "❌ غیرفعال"
        print(f"  {status:15} | {p.slug:15} | {p.display_name}")
    
    # غیرفعال کردن
    print(f"\n🔄 در حال غیرفعال کردن...")
    updated = AIProvider.objects.filter(is_active=True).update(is_active=False)
    
    print(f"\n✅ {updated} Provider غیرفعال شد!")
    print("💡 حالا Super Admin میتونه Provider های مورد نظرش رو فعال کنه")
    print("=" * 60)


if __name__ == '__main__':
    deactivate_all()
