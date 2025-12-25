#!/usr/bin/env python
"""
اسکریپت پر کردن مناطق شهرهای بزرگ ایران
فقط برای شهرهایی که مناطق شهری دارند (تهران، مشهد، اصفهان، ...)

🔄 منطق کار:
  - از get_or_create استفاده می‌کند تا duplicate ایجاد نشود
  - اگر موجود بود، update می‌کند (نام)
  - اگر موجود نبود، create می‌کند
  - هیچ داده‌ای پاک نمی‌شود - فقط اضافه و به‌روزرسانی می‌شود

⚠️  مهم: استان و شهرها باید قبلاً با import_iranian_locations.py import شده باشند

اجرا: python scripts/populate_city_regions.py
"""

import os
import sys

# تنظیم encoding برای Windows
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# اضافه کردن مسیر پروژه به sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# تنظیم Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.django.base')

try:
    import django
    from django.db import transaction
    django.setup()
    from src.real_estate.models.location import City, CityRegion
except ImportError as e:
    print(f"❌ خطا در import Django: {e}")
    print("مطمئن شوید که Django نصب شده و مسیر درست است")
    sys.exit(1)

# تعریف مناطق شهرها - فقط شهرهای بزرگ که مناطق شهری دارند
CITY_REGIONS = {
    'تهران': list(range(1, 23)),  # 1 تا 22
    'مشهد': list(range(1, 14)),    # 1 تا 13
    'اصفهان': list(range(1, 15)),  # 1 تا 14
    'شیراز': list(range(1, 12)),   # 1 تا 11
    'تبریز': list(range(1, 11)),   # 1 تا 10
    'کرج': list(range(1, 5)),      # 1 تا 4
    'اهواز': list(range(1, 6)),    # 1 تا 5
}


def populate_city_regions():
    """
    پر کردن مناطق شهرهای بزرگ
    """
    print("⚠️ توجه: استان و شهرها قبلاً با import_iranian_locations.py import شده‌اند")
    print("فقط مناطق شهرهای بزرگ اضافه می‌شوند...")
    print()

    try:
        created_count = 0
        updated_count = 0

        for city_name, region_codes in CITY_REGIONS.items():
            try:
                city = City.objects.filter(name=city_name, is_active=True).first()
                if not city:
                    print(f'❌ شهر {city_name} یافت نشد')
                    continue

                for code in region_codes:
                    try:
                        # Use raw SQL to avoid Django ORM issues with public_id
                        from django.db import connection

                        with connection.cursor() as cursor:
                            # Check if region exists
                            cursor.execute(
                                "SELECT id FROM real_estate_city_regions WHERE city_id = %s AND code = %s",
                                [city.id, code]
                            )
                            existing = cursor.fetchone()

                            if existing:
                                # Update existing region using Django ORM
                                try:
                                    region = CityRegion.objects.get(id=existing[0])
                                    region.name = f'منطقه {code}'
                                    region.save()
                                    updated_count += 1
                                    print(f'↻ {city_name} - منطقه {code} به‌روزرسانی شد')
                                except Exception as e:
                                    print(f'❌ خطا در به‌روزرسانی منطقه {code} برای شهر {city_name}: {str(e)}')
                            else:
                                # Create new region using Django ORM (this will handle public_id automatically)
                                try:
                                    CityRegion.objects.create(
                                        city=city,
                                        name=f'منطقه {code}',
                                        code=code,
                                        is_active=True
                                    )
                                    created_count += 1
                                    print(f'✓ {city_name} - منطقه {code} ایجاد شد')
                                except Exception as e:
                                    print(f'❌ خطا در ایجاد منطقه {code} برای شهر {city_name}: {str(e)}')

                    except Exception as e:
                        print(f'❌ خطا در ایجاد منطقه {code} برای شهر {city_name}: {str(e)}')

            except City.DoesNotExist:
                print(f'❌ شهر {city_name} یافت نشد - لطفاً ابتدا import_iranian_locations.py را اجرا کنید')
            except Exception as e:
                print(f'❌ خطا در پردازش شهر {city_name}: {str(e)}')

        print(f"\n✓ عملیات تکمیل شد:")
        print(f"   • {created_count} منطقه جدید ایجاد شد")
        if updated_count > 0:
            print(f"   • {updated_count} منطقه به‌روزرسانی شد")

        return True

    except Exception as e:
        print(f"\n❌ خطا در populate_city_regions: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """تابع اصلی"""
    print("🚀 شروع populate مناطق شهرهای بزرگ...")
    print("🔄 منطق: جلوگیری از duplicate + update موارد موجود + اضافه کردن موارد جدید")
    print("ℹ️ هیچ داده‌ای پاک نمی‌شود - فقط اضافه و به‌روزرسانی می‌شود")
    print()

    success = populate_city_regions()

    if success:
        print("\n🎉 populate مناطق شهرهای بزرگ با موفقیت انجام شد!")
        exit(0)
    else:
        print("\n💥 populate مناطق شهرهای بزرگ با خطا مواجه شد!")
        exit(1)


if __name__ == "__main__":
    main()
