#!/usr/bin/env python
"""
ایمپورت استان/شهر ایران (Local-only)

- تنها منبع داده: فایل محلی `scripts/location/data/iran_provinces_cities.fa_en.json`
- بدون وابستگی runtime به GitHub یا منبع خارجی
- پشتیبانی اسلاگ فارسی/انگلیسی
"""

import argparse
import json
import os
import re
import sys
from collections import defaultdict
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
    from django.db.models.deletion import ProtectedError
    django.setup()

    from src.core.models import Country, Province as UserProvince, City as UserCity
    from scripts.location.location_slug_shared import build_location_slug, ensure_unique_slug
except ImportError as e:
    print(f"❌ خطا در import Django: {e}")
    sys.exit(1)


DATA_DIR = Path(__file__).resolve().parent / 'data'
LOCAL_DATA_FILE = DATA_DIR / 'iran_provinces_cities.fa_en.json'


def _normalize_name_key(value: str) -> str:
    text = (value or '').strip()
    text = text.replace('ي', 'ی').replace('ك', 'ک').replace('‌', ' ')
    text = ' '.join(text.split())
    return text


def _strip_trailing_index(value: str) -> str:
    text = _normalize_name_key(value)
    text = re.sub(r'\s+[0-9۰-۹]+$', '', text).strip()
    return text


def _normalize_dataset_shape(raw_rows: list[dict]) -> list[dict]:
    normalized = []
    for row in raw_rows:
        province_name = (row.get('name_fa') or row.get('name') or '').strip()
        if not province_name:
            continue

        province_code = str(row.get('code') or '').strip()
        if not province_code:
            continue

        province_slug_en = build_location_slug(
            province_name,
            scope='province',
            language='en',
            preferred_en_slug=(row.get('slug_en') or row.get('slug') or '').strip(),
        )

        cities = []
        seen = set()
        for city in row.get('cities') or []:
            city_name_raw = (city.get('name_fa') or city.get('name') or '').strip()
            city_name = _strip_trailing_index(city_name_raw)
            if not city_name:
                continue
            key = _normalize_name_key(city_name)
            if key in seen:
                continue
            seen.add(key)

            city_slug_en = build_location_slug(
                city_name,
                scope='city',
                province_name=province_name,
                language='en',
                preferred_en_slug=(city.get('slug_en') or city.get('slug') or '').strip(),
            )

            cities.append({
                'name': city_name,
                'slug_en': city_slug_en,
            })

        normalized.append({
            'name': province_name,
            'code': province_code,
            'slug_en': province_slug_en,
            'cities': cities,
        })

    normalized.sort(key=lambda x: x['code'])
    return normalized


def _load_dataset_from_local_file() -> list[dict]:
    if not LOCAL_DATA_FILE.exists():
        raise FileNotFoundError(f"فایل داده محلی پیدا نشد: {LOCAL_DATA_FILE}")

    raw = json.loads(LOCAL_DATA_FILE.read_text(encoding='utf-8'))
    data = _normalize_dataset_shape(raw)
    if len(data) < 31:
        raise ValueError('داده محلی ناقص است (کمتر از 31 استان)')
    return data


def build_import_dataset() -> list[dict]:
    data = _load_dataset_from_local_file()
    print(f"ℹ️ منبع داده: Local file ({LOCAL_DATA_FILE.name}) | استان: {len(data)}")
    return data


def _next_city_code(province_code: str, used_codes: set[str]) -> str:
    seq = 1
    while True:
        candidate = f"{province_code}{seq:03d}"
        if candidate not in used_codes:
            used_codes.add(candidate)
            return candidate
        seq += 1


def _build_province_slug(name: str, slug_language: str, preferred_en_slug: str, province_id: int | None) -> str:
    base = build_location_slug(
        name,
        scope='province',
        language=slug_language,
        preferred_en_slug=preferred_en_slug,
    ) or ('province' if slug_language == 'en' else 'استان')
    qs = UserProvince.objects.all()
    if province_id is not None:
        qs = qs.exclude(id=province_id)
    return ensure_unique_slug(qs.values_list('slug', flat=True), base)


def _build_city_slug(
    name: str,
    province_name: str,
    slug_language: str,
    preferred_en_slug: str,
    province_id: int,
    city_id: int | None,
) -> str:
    base = build_location_slug(
        name,
        scope='city',
        province_name=province_name,
        language=slug_language,
        preferred_en_slug=preferred_en_slug,
    ) or ('city' if slug_language == 'en' else 'شهر')

    qs = UserCity.objects.filter(province_id=province_id)
    if city_id is not None:
        qs = qs.exclude(id=city_id)
    return ensure_unique_slug(qs.values_list('slug', flat=True), base)


def _cleanup_duplicate_cities_in_province(province: UserProvince) -> tuple[int, int]:
    deleted = 0
    deactivated = 0

    groups: dict[str, list[UserCity]] = defaultdict(list)
    for city in UserCity.objects.filter(province=province).order_by('id'):
        groups[_normalize_name_key(city.name)].append(city)

    for _, items in groups.items():
        if len(items) <= 1:
            continue

        keep = items[0]
        for city in items[1:]:
            if keep.is_active is False and city.is_active:
                keep, city = city, keep

            try:
                city.delete()
                deleted += 1
            except ProtectedError:
                if city.is_active:
                    city.is_active = False
                    city.save(update_fields=['is_active', 'updated_at'])
                    deactivated += 1

    return deleted, deactivated


def _cleanup_stale_locations(dataset: list[dict]) -> dict:
    province_codes = {item['code'] for item in dataset}
    city_names_by_province_code: dict[str, set[str]] = {}

    for item in dataset:
        code = item['code']
        city_names_by_province_code[code] = {
            _normalize_name_key(city['name']) for city in item.get('cities', [])
        }

    stats = {
        'city_deleted': 0,
        'city_deactivated': 0,
        'province_deleted': 0,
        'province_deactivated': 0,
        'duplicate_city_deleted': 0,
        'duplicate_city_deactivated': 0,
    }

    for province in UserProvince.objects.select_related('country').all():
        code = province.code
        if code not in province_codes:
            try:
                province.delete()
                stats['province_deleted'] += 1
            except ProtectedError:
                changed = False
                if province.is_active:
                    province.is_active = False
                    changed = True
                if changed:
                    province.save(update_fields=['is_active', 'updated_at'])
                    stats['province_deactivated'] += 1

                city_qs = UserCity.objects.filter(province=province, is_active=True)
                city_count = city_qs.count()
                if city_count:
                    city_qs.update(is_active=False)
                    stats['city_deactivated'] += city_count
            continue

        dup_deleted, dup_deactivated = _cleanup_duplicate_cities_in_province(province)
        stats['duplicate_city_deleted'] += dup_deleted
        stats['duplicate_city_deactivated'] += dup_deactivated

        allowed = city_names_by_province_code.get(code, set())
        for city in UserCity.objects.filter(province=province):
            city_key = _normalize_name_key(city.name)
            if city_key in allowed:
                continue

            try:
                city.delete()
                stats['city_deleted'] += 1
            except ProtectedError:
                if city.is_active:
                    city.is_active = False
                    city.save(update_fields=['is_active', 'updated_at'])
                    stats['city_deactivated'] += 1

    return stats


def import_user_locations(slug_language: str = 'en', cleanup_stale: bool = False) -> bool:
    dataset = build_import_dataset()

    print('\n' + '=' * 64)
    print('📍 Import استان/شهر ایران (Core Models)')
    print('=' * 64)
    print(f"🔤 حالت اسلاگ: {'English' if slug_language == 'en' else 'Persian'}")
    if cleanup_stale:
        print('🧹 پاکسازی رکوردهای قدیمی/خراب: فعال')

    try:
        with transaction.atomic():
            iran = Country.get_iran()

            if cleanup_stale:
                clean_stats = _cleanup_stale_locations(dataset)
                print('   • پاکسازی شهر حذف‌شده:', clean_stats['city_deleted'])
                print('   • پاکسازی شهر غیرفعال‌شده:', clean_stats['city_deactivated'])
                print('   • پاکسازی استان حذف‌شده:', clean_stats['province_deleted'])
                print('   • پاکسازی استان غیرفعال‌شده:', clean_stats['province_deactivated'])
                print('   • حذف شهر تکراری:', clean_stats['duplicate_city_deleted'])
                print('   • غیرفعال‌سازی شهر تکراری:', clean_stats['duplicate_city_deactivated'])

            province_created = province_updated = city_created = city_updated = 0

            for province_item in dataset:
                province_code = province_item['code']
                province_name = province_item['name']

                created = False
                province = UserProvince.objects.filter(name=province_name).first()
                if province is None:
                    province = UserProvince.objects.filter(code=province_code).first()

                if province is None:
                    province = UserProvince.objects.create(
                        code=province_code,
                        name=province_name,
                        country=iran,
                        is_active=True,
                        slug='',
                    )
                    created = True

                changed = False
                if created:
                    province_created += 1
                else:
                    province_updated += 1

                if province.name != province_name:
                    name_conflict = UserProvince.objects.filter(name=province_name).exclude(id=province.id).exists()
                    if not name_conflict:
                        province.name = province_name
                        changed = True

                if province.code != province_code:
                    code_conflict = UserProvince.objects.filter(code=province_code).exclude(id=province.id).exists()
                    if not code_conflict:
                        province.code = province_code
                        changed = True
                if province.country_id != iran.id:
                    province.country = iran
                    changed = True
                if not province.is_active:
                    province.is_active = True
                    changed = True

                new_province_slug = _build_province_slug(
                    province_name,
                    slug_language,
                    province_item.get('slug_en', ''),
                    None if created else province.id,
                )
                if province.slug != new_province_slug:
                    province.slug = new_province_slug
                    changed = True

                if changed or created:
                    province.save()

                existing_cities = list(UserCity.objects.filter(province=province))
                by_name = {}
                used_codes = set()
                for city in existing_cities:
                    by_name[_normalize_name_key(city.name)] = city
                    used_codes.add(city.code)

                for city_item in province_item['cities']:
                    city_name = city_item['name']
                    city_key = _normalize_name_key(city_name)
                    city_obj = by_name.get(city_key)

                    if city_obj is None:
                        city_code = _next_city_code(province.code, used_codes)
                        city_obj = UserCity.objects.create(
                            province=province,
                            code=city_code,
                            name=city_name,
                            slug='',
                            is_active=True,
                        )
                        by_name[city_key] = city_obj
                        city_created += 1
                        created_city = True
                    else:
                        created_city = False
                        city_changed = False
                        if city_obj.name != city_name:
                            city_obj.name = city_name
                            city_changed = True
                        if not city_obj.is_active:
                            city_obj.is_active = True
                            city_changed = True
                        if city_changed:
                            city_obj.save(update_fields=['name', 'is_active', 'updated_at'])
                        city_updated += 1

                    new_city_slug = _build_city_slug(
                        city_name,
                        province.name,
                        slug_language,
                        city_item.get('slug_en', ''),
                        province.id,
                        None if created_city else city_obj.id,
                    )
                    if city_obj.slug != new_city_slug:
                        city_obj.slug = new_city_slug
                        city_obj.save(update_fields=['slug', 'updated_at'])

            print('\n✅ عملیات import با موفقیت انجام شد')
            print(f"   • استان ایجاد شد: {province_created}")
            print(f"   • استان به‌روزرسانی شد: {province_updated}")
            print(f"   • شهر ایجاد شد: {city_created}")
            print(f"   • شهر به‌روزرسانی/همگام شد: {city_updated}")
            return True

    except Exception as exc:
        print(f"\n❌ خطا در import: {exc}")
        import traceback
        traceback.print_exc()
        return False


def import_real_estate_locations(slug_language: str = 'en', cleanup_stale: bool = False) -> bool:
    return import_user_locations(slug_language=slug_language, cleanup_stale=cleanup_stale)


def main() -> bool:
    parser = argparse.ArgumentParser(description='Import Iranian provinces/cities from local data files')
    parser.add_argument('--app', choices=['user', 'real_estate', 'both'], default='real_estate')
    parser.add_argument('--slug-language', choices=['en', 'fa'], default='en')
    parser.add_argument('--cleanup-stale', action='store_true', help='رکوردهای قدیمی/خراب را قبل از import حذف/غیرفعال می‌کند')
    parser.add_argument('--update', action='store_true', help='برای سازگاری نگه داشته شده و تاثیر مستقیمی ندارد')
    args = parser.parse_args()

    print('🚀 شروع import داده‌های لوکیشن ایران...')
    print(f"📦 app: {args.app} | source: local-data-only | slug: {args.slug_language}")

    success = True

    if args.app in ['user', 'both']:
        if not import_user_locations(slug_language=args.slug_language, cleanup_stale=args.cleanup_stale):
            success = False

    if args.app in ['real_estate', 'both']:
        if not import_real_estate_locations(slug_language=args.slug_language, cleanup_stale=args.cleanup_stale):
            success = False

    if success:
        print('\n🎯 همه importها با موفقیت انجام شد')
        print(f"📊 استان‌ها: {UserProvince.objects.count()} | شهرها: {UserCity.objects.count()}")
    else:
        print('\n💥 اجرای اسکریپت با خطا مواجه شد')

    return success


if __name__ == '__main__':
    ok = main()
    raise SystemExit(0 if ok else 1)
