#!/usr/bin/env python
"""
پر کردن مناطق شهرها
پیش‌فرض امن: فقط تهران (22 منطقه)
در صورت نیاز: با --include-major-cities شهرهای بزرگ دیگر هم اضافه می‌شوند
"""

import argparse
import json
import os
import sys
from pathlib import Path

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(BASE_DIR)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.django.base')

try:
    import django
    from django.db import transaction
    django.setup()

    from src.core.models import City
    from src.real_estate.models.location import CityRegion
    from scripts.location.location_slug_shared import build_location_slug, ensure_unique_slug
except ImportError as e:
    print(f"❌ خطا در import Django: {e}")
    sys.exit(1)


DATA_DIR = Path(__file__).resolve().parent / 'data'
REGIONS_FILE = DATA_DIR / 'iran_city_regions.fa_en.json'


def _load_regions_config() -> dict:
    if not REGIONS_FILE.exists():
        raise FileNotFoundError(f"فایل داده مناطق پیدا نشد: {REGIONS_FILE}")
    return json.loads(REGIONS_FILE.read_text(encoding='utf-8'))


def _build_region_target(include_major_cities: bool) -> dict[str, list[int]]:
    config = _load_regions_config()
    target = dict(config.get('tehran_only') or {})
    if include_major_cities:
        target.update(config.get('major_cities') or {})
    return target


def _build_region_slug(
    *,
    city: City,
    region_name: str,
    slug_language: str,
    region_id: int | None,
) -> str:
    base = build_location_slug(
        region_name,
        scope='region',
        language=slug_language,
    ) or ('region' if slug_language == 'en' else 'منطقه')

    qs = CityRegion.objects.filter(city_id=city.id)
    if region_id is not None:
        qs = qs.exclude(id=region_id)
    existing = qs.values_list('slug', flat=True)
    return ensure_unique_slug(existing, base)


def populate_city_regions(include_major_cities: bool = False, slug_language: str = 'en') -> bool:
    target = _build_region_target(include_major_cities)

    print('⚠️ توجه: این اسکریپت فقط برای شهرهای دارای منطقه رسمی باید اجرا شود')
    print(f"📍 شهرهای هدف: {', '.join(target.keys())}")
    print(f"🔤 حالت اسلاگ: {'English' if slug_language == 'en' else 'Persian'}")

    created_count = 0
    updated_count = 0
    missing_cities = 0

    try:
        with transaction.atomic():
            for city_name, region_codes in target.items():
                city = City.objects.filter(name=city_name, is_active=True).first()
                if not city:
                    print(f"⚠️ شهر '{city_name}' یافت نشد")
                    missing_cities += 1
                    continue

                for code in region_codes:
                    region_name = f'منطقه {code}'
                    region, created = CityRegion.objects.get_or_create(
                        city=city,
                        code=code,
                        defaults={
                            'name': region_name,
                            'slug': '',
                            'is_active': True,
                        }
                    )

                    changed = False
                    if region.name != region_name:
                        region.name = region_name
                        changed = True
                    if not region.is_active:
                        region.is_active = True
                        changed = True

                    new_slug = _build_region_slug(
                        city=city,
                        region_name=region_name,
                        slug_language=slug_language,
                        region_id=None if created else region.id,
                    )
                    if region.slug != new_slug:
                        region.slug = new_slug
                        changed = True

                    if created or changed:
                        region.save()

                    if created:
                        created_count += 1
                    else:
                        updated_count += 1

        print('\n✅ عملیات مناطق کامل شد')
        print(f"   • ایجاد شده: {created_count}")
        print(f"   • به‌روزرسانی شده: {updated_count}")
        print(f"   • شهرهای پیدا نشده: {missing_cities}")
        return True

    except Exception as exc:
        print(f"\n❌ خطا در populate_city_regions: {exc}")
        import traceback
        traceback.print_exc()
        return False


def main() -> int:
    parser = argparse.ArgumentParser(description='Populate city regions for Iranian cities')
    parser.add_argument('--include-major-cities', action='store_true', help='علاوه بر تهران، شهرهای بزرگ دیگر هم منطقه‌گذاری شوند')
    parser.add_argument('--slug-language', choices=['en', 'fa'], default='en')
    args = parser.parse_args()

    print('🚀 شروع populate مناطق...')
    success = populate_city_regions(
        include_major_cities=args.include_major_cities,
        slug_language=args.slug_language,
    )

    if success:
        print('🎉 انجام شد')
        return 0
    print('💥 خطا در اجرا')
    return 1


if __name__ == '__main__':
    raise SystemExit(main())
