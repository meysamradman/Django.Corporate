#!/usr/bin/env python

import json
import os
import sys
from decimal import Decimal
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
    django.setup()
    from src.core.models import City, Province
except ImportError as e:
    print(f"❌ خطا در import Django: {e}")
    sys.exit(1)


DATA_FILE = Path(__file__).resolve().parent / 'data' / 'iran_location_coordinates.fa_en.json'


def _load_coordinates() -> tuple[dict, dict]:
    if not DATA_FILE.exists():
        raise FileNotFoundError(f"فایل مختصات پیدا نشد: {DATA_FILE}")

    data = json.loads(DATA_FILE.read_text(encoding='utf-8'))
    return data.get('provinces') or {}, data.get('cities') or {}


def _to_decimal(value: float) -> Decimal:
    return Decimal(str(value)).quantize(Decimal('0.00000001'))


def _normalize_name_key(value: str) -> str:
    text = (value or '').strip()
    text = text.replace('ي', 'ی').replace('ك', 'ک').replace('‌', ' ')
    text = ''.join(text.split())
    return text


def populate_coordinates():
    print("🚀 Updating coordinates for cities and provinces (data-file only)...")

    province_coordinates, city_coordinates = _load_coordinates()

    province_by_key = {
        _normalize_name_key(province.name): province
        for province in Province.objects.all()
    }

    cities_by_key: dict[str, list[City]] = {}
    for city in City.objects.all():
        key = _normalize_name_key(city.name)
        cities_by_key.setdefault(key, []).append(city)

    updated_provinces = 0
    for name, coords in province_coordinates.items():
        try:
            province = province_by_key.get(_normalize_name_key(name))
            if province:
                province.latitude = _to_decimal(coords[0])
                province.longitude = _to_decimal(coords[1])
                province.save()
                updated_provinces += 1
                print(f"✅ Province updated: {name}")
            else:
                print(f"⚠️ Province not found: {name}")
        except Exception as e:
            print(f"❌ Error updating province {name}: {e}")

    updated_cities = 0
    for name, coords in city_coordinates.items():
        try:
            cities = cities_by_key.get(_normalize_name_key(name), [])
            if cities:
                for city in cities:
                    city.latitude = _to_decimal(coords[0])
                    city.longitude = _to_decimal(coords[1])
                    city.save()
                    updated_cities += 1
                print(f"✅ City updated: {name} ({len(cities)} matches)")
            else:
                print(f"⚠️ City not found: {name}")
        except Exception as e:
            print(f"❌ Error updating city {name}: {e}")

    print("\nSummary:")
    print(f" Provinces updated: {updated_provinces}")
    print(f" Cities updated:    {updated_cities}")


if __name__ == "__main__":
    populate_coordinates()
