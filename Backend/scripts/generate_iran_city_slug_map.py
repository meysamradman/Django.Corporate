#!/usr/bin/env python
import os
import sys
import json
import time
import re
import ast
from pathlib import Path

import requests

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scripts.location_slug_shared import slugify_alpha_only, PROVINCE_CANONICAL_MAP

API_URL = 'https://www.wikidata.org/w/api.php'
HEADERS = {'User-Agent': 'CorporateSlugBot/1.0 (location canonicalizer)'}


def load_provinces_data() -> list[dict]:
    source_path = Path(__file__).resolve().parent / 'import_iranian_locations.py'
    source = source_path.read_text(encoding='utf-8')
    module = ast.parse(source)
    for node in module.body:
        if isinstance(node, ast.Assign):
            for target in node.targets:
                if isinstance(target, ast.Name) and target.id == 'PROVINCES_DATA':
                    return ast.literal_eval(node.value)
    raise RuntimeError('PROVINCES_DATA not found in import_iranian_locations.py')


def normalize_fa(text: str) -> str:
    value = (text or '').strip()
    value = value.replace('ي', 'ی').replace('ك', 'ک').replace('‌', ' ')
    value = re.sub(r'\s+', ' ', value)
    return value


def score_candidate(item: dict, province_slug: str) -> int:
    display = item.get('display') or {}
    desc = ((display.get('description') or {}).get('value') or '').lower()
    label_en = ((display.get('label') or {}).get('value') or '').lower()

    score = 0
    if 'city in' in desc:
        score += 5
    if 'iran' in desc:
        score += 5
    if province_slug.replace('-', ' ') in desc:
        score += 6
    if label_en and re.fullmatch(r'[a-z\-\s]+', label_en):
        score += 2
    if 'county' in desc or 'province' in desc:
        score -= 2
    return score


def resolve_city_slug(city_fa: str, province_fa: str, province_slug: str) -> tuple[str, str]:
    query = f"{city_fa} {province_fa}"
    params = {
        'action': 'wbsearchentities',
        'search': query,
        'language': 'fa',
        'format': 'json',
        'limit': 10,
    }
    response = requests.get(API_URL, params=params, headers=HEADERS, timeout=20)
    response.raise_for_status()
    data = response.json()

    best = None
    best_score = -10**9
    for item in data.get('search', []):
        score = score_candidate(item, province_slug)
        if score > best_score:
            best_score = score
            best = item

    if best is not None and best_score >= 8:
        label_en = ((best.get('display') or {}).get('label') or {}).get('value') or ''
        slug = slugify_alpha_only(label_en)
        if slug:
            return slug, f"wikidata:{best.get('id')}"

    return slugify_alpha_only(city_fa), 'fallback-translit'


def main() -> int:
    provinces_data = load_provinces_data()
    scoped_map: dict[str, str] = {}
    report = {'total': 0, 'wikidata': 0, 'fallback': 0}

    for province in provinces_data:
        province_fa = normalize_fa(province['name'])
        province_slug = PROVINCE_CANONICAL_MAP.get(province_fa, slugify_alpha_only(province_fa))
        for city in province['cities']:
            city_fa = normalize_fa(city)
            scoped_key = f"{province_fa}::{city_fa}"
            if scoped_key in scoped_map:
                continue
            report['total'] += 1
            try:
                slug, source = resolve_city_slug(city_fa, province_fa, province_slug)
            except Exception:
                slug, source = slugify_alpha_only(city_fa), 'fallback-translit'

            scoped_map[scoped_key] = slug or slugify_alpha_only(city_fa) or 'city'
            if source.startswith('wikidata:'):
                report['wikidata'] += 1
            else:
                report['fallback'] += 1
            time.sleep(0.08)

    out_path = Path(__file__).resolve().parent / 'iran_city_slug_map.json'
    out_path.write_text(json.dumps(scoped_map, ensure_ascii=False, indent=2), encoding='utf-8')

    print('✅ generated:', out_path)
    print(report)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
