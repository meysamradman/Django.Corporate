#!/usr/bin/env python
"""
Normalize all location slugs to deterministic English alpha-only format.

Rules:
- Slug contains only english letters and hyphen
- No digits in slug
- If duplicate base exists, use alphabetic fallback from code
"""

import os
import re
import sys

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.django.base')

import django
from django.db import transaction
from scripts.location_slug_shared import canonical_location_slug, ensure_unique_slug

django.setup()

from src.core.models import Province, City
from src.real_estate.models.location import CityRegion


PERSIAN_CHAR_MAP = {
    'آ': 'a', 'ا': 'a', 'أ': 'a', 'إ': 'e', 'ء': '', 'ئ': 'y', 'ؤ': 'o',
    'ب': 'b', 'پ': 'p', 'ت': 't', 'ث': 's', 'ج': 'j', 'چ': 'ch', 'ح': 'h',
    'خ': 'kh', 'د': 'd', 'ذ': 'z', 'ر': 'r', 'ز': 'z', 'ژ': 'zh', 'س': 's',
    'ش': 'sh', 'ص': 's', 'ض': 'z', 'ط': 't', 'ظ': 'z', 'ع': 'a', 'غ': 'gh',
    'ف': 'f', 'ق': 'gh', 'ک': 'k', 'ك': 'k', 'گ': 'g', 'ل': 'l', 'م': 'm',
    'ن': 'n', 'و': 'v', 'ه': 'h', 'ة': 'h', 'ی': 'y', 'ي': 'y',
    '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
    '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
}

DIGIT_WORD_MAP = {
    '0': 'zero', '1': 'one', '2': 'two', '3': 'three', '4': 'four',
    '5': 'five', '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine',
}

ALPHA_DIGIT_TOKEN_MAP = {
    '0': 'a', '1': 'b', '2': 'c', '3': 'd', '4': 'e',
    '5': 'f', '6': 'g', '7': 'h', '8': 'i', '9': 'j',
}


def _slugify_fa(text: str) -> str:
    text = (text or '').strip().lower()
    if not text:
        return ''

    out = []
    for ch in text:
        if ch in PERSIAN_CHAR_MAP:
            out.append(PERSIAN_CHAR_MAP[ch])
        elif 'a' <= ch <= 'z' or '0' <= ch <= '9':
            out.append(ch)
        elif ch in {' ', '-', '_', '/', '\\', '،', ',', 'ـ', '‌'}:
            out.append('-')

    slug = ''.join(out)
    slug = re.sub(r'[^a-z0-9-]+', '-', slug)
    slug = re.sub(r'-{2,}', '-', slug).strip('-')
    return slug


def _replace_digits_with_words(value: str) -> str:
    result = []
    for ch in str(value or ''):
        if ch.isdigit():
            result.append(f"-{DIGIT_WORD_MAP[ch]}-")
        else:
            result.append(ch)
    return ''.join(result)


def _slugify_alpha_only(text: str) -> str:
    base = _slugify_fa(_replace_digits_with_words(text))
    base = re.sub(r'[^a-z-]+', '-', base)
    base = re.sub(r'-{2,}', '-', base).strip('-')
    return base


def _code_alpha_token(code: int | str) -> str:
    digits = re.sub(r'[^0-9]', '', str(code or ''))
    if not digits:
        return 'x'
    return ''.join(ALPHA_DIGIT_TOKEN_MAP[d] for d in digits)


def _alpha_suffix(index: int) -> str:
    letters = 'abcdefghijklmnopqrstuvwxyz'
    n = max(1, index)
    out = []
    while n > 0:
        n -= 1
        out.append(letters[n % 26])
        n //= 26
    return ''.join(reversed(out))


def run() -> bool:
    updated_provinces = 0
    updated_cities = 0
    updated_regions = 0

    with transaction.atomic():
        for province in Province.objects.all().only('id', 'name', 'code', 'slug'):
            base = canonical_location_slug(province.name, scope='province') or 'province'
            existing = Province.objects.exclude(id=province.id).values_list('slug', flat=True)
            new_slug = ensure_unique_slug(existing, base)
            if province.slug != new_slug:
                province.slug = new_slug
                province.save(update_fields=['slug', 'updated_at'])
                updated_provinces += 1

        for city in City.objects.all().only('id', 'name', 'code', 'slug', 'province_id'):
            base = canonical_location_slug(city.name, scope='city') or 'city'
                        for city in City.objects.select_related('province').all().only('id', 'name', 'code', 'slug', 'province_id', 'province__name'):
                            base = canonical_location_slug(city.name, scope='city', province_name=city.province.name) or 'city'
            if city.slug != new_slug:
                city.slug = new_slug
                city.save(update_fields=['slug', 'updated_at'])
                updated_cities += 1

        for region in CityRegion.objects.all().only('id', 'name', 'code', 'slug', 'city_id'):
            base = canonical_location_slug(region.name, scope='region') or 'region'
            existing = CityRegion.objects.filter(city_id=region.city_id).exclude(id=region.id).values_list('slug', flat=True)
            new_slug = ensure_unique_slug(existing, base)
            if region.slug != new_slug:
                region.slug = new_slug
                region.save(update_fields=['slug', 'updated_at'])
                updated_regions += 1

    print("✅ Normalize location slugs done")
    print(f"  Provinces updated: {updated_provinces}")
    print(f"  Cities updated: {updated_cities}")
    print(f"  Regions updated: {updated_regions}")
    return True


if __name__ == '__main__':
    try:
        run()
        sys.exit(0)
    except Exception as exc:
        print(f"❌ Failed: {exc}")
        sys.exit(1)
