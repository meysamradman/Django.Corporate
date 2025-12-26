
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
    django.setup()
    from src.core.models import City, Province
except ImportError as e:
    print(f"❌ خطا در import Django: {e}")
    sys.exit(1)

# مختصات شهرهای بزرگ ایران (From Frontend)
CITY_COORDINATES = {
  'تهران': [35.6892, 51.3890],
  'اصفهان': [32.6546, 51.6680],
  'مشهد': [36.2605, 59.6168],
  'شیراز': [29.5918, 52.5837],
  'تبریز': [38.0806, 46.2911],
  'اهواز': [31.3183, 48.6706],
  'کرمانشاه': [34.3142, 47.0650],
  'رشت': [37.2808, 49.5832],
  'ارومیه': [37.5527, 45.0759],
  'یزد': [31.8974, 54.3569],
  'کرمان': [30.2839, 57.0834],
  'همدان': [34.7983, 48.5148],
  'اردبیل': [38.2498, 48.2967],
  'بندرعباس': [27.1833, 56.2667],
  'زاهدان': [29.4960, 60.8629],
  'گرگان': [36.8427, 54.4319],
  'ساری': [36.5633, 53.0601],
  'قزوین': [36.2797, 50.0049],
  'سنندج': [35.3144, 46.9983],
  'کرج': [35.8400, 50.9391],
  'قم': [34.6401, 50.8769],
}

# مختصات مراکز استان‌ها (From Frontend)
PROVINCE_COORDINATES = {
  'تهران': [35.6892, 51.3890],
  'اصفهان': [32.6546, 51.6680],
  'خراسان رضوی': [36.2605, 59.6168],
  'فارس': [29.5918, 52.5837],
  'آذربایجان شرقی': [38.0806, 46.2911],
  'قم': [34.6401, 50.8769],
  'خوزستان': [31.3183, 48.6706],
  'کرمانشاه': [34.3142, 47.0650],
  'گیلان': [37.2808, 49.5832],
  'آذربایجان غربی': [37.5527, 45.0759],
  'یزد': [31.8974, 54.3569],
  'کرمان': [30.2839, 57.0834],
  'همدان': [34.7983, 48.5148],
  'اردبیل': [38.2498, 48.2967],
  'هرمزگان': [27.1833, 56.2667],
  'سیستان و بلوچستان': [29.4960, 60.8629],
  'گلستان': [36.8427, 54.4319],
  'مازندران': [36.5633, 53.0601],
  'قزوین': [36.2797, 50.0049],
  'کردستان': [35.3144, 46.9983],
  'لرستان': [33.4878, 48.3558],
  'مرکزی': [34.0809, 49.7012],
  'بوشهر': [28.9234, 50.8203],
  'چهارمحال و بختیاری': [32.3266, 50.8546],
  'سمنان': [35.5728, 53.3971],
  'زنجان': [36.5010, 48.4789],
  'ایلام': [33.2958, 46.6707],
  'کهگیلویه و بویراحمد': [30.6627, 51.5950],
  'البرز': [35.8327, 50.9345],
  'خراسان شمالی': [37.4710, 57.1013],
  'خراسان جنوبی': [32.8649, 59.2262],
}

from decimal import Decimal

# ... (rest of imports)

def populate_coordinates():
    print("🚀 Updating coordinates for cities and provinces...")
    
    # Update Provinces
    updated_provinces = 0
    for name, coords in PROVINCE_COORDINATES.items():
        try:
            # Try exact match first
            province = Province.objects.filter(name=name).first()
            if province:
                province.latitude = Decimal(str(coords[0])).quantize(Decimal("0.00000001"))
                province.longitude = Decimal(str(coords[1])).quantize(Decimal("0.00000001"))
                province.save()
                updated_provinces += 1
                print(f"✅ Province updated: {name}")
            else:
                print(f"⚠️ Province not found: {name}")
        except Exception as e:
            print(f"❌ Error updating province {name}: {e}")

    # Update Cities
    updated_cities = 0
    for name, coords in CITY_COORDINATES.items():
        try:
            # There might be multiple cities with same name in different provinces, 
            # but usually major cities are unique. We update all matching names for simplicity 
            # or filtering by province would be better but we don't have province mapping in constants easily.
            cities = City.objects.filter(name=name)
            if cities.exists():
                for city in cities:
                    city.latitude = Decimal(str(coords[0])).quantize(Decimal("0.00000001"))
                    city.longitude = Decimal(str(coords[1])).quantize(Decimal("0.00000001"))
                    city.save()
                    updated_cities += 1
                print(f"✅ City updated: {name} ({cities.count()} matches)")
            else:
                print(f"⚠️ City not found: {name}")
        except Exception as e:
            print(f"❌ Error updating city {name}: {e}")

    print(f"\nSummary:")
    print(f" Provinces updated: {updated_provinces}")
    print(f" Cities updated:    {updated_cities}")

if __name__ == "__main__":
    populate_coordinates()
