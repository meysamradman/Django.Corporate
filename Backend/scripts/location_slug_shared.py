import json
import re
from pathlib import Path
from typing import Iterable

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

ENGLISH_SLUG_PATTERN = re.compile(r'^[a-z-]+$')

_FA_DIGITS = str.maketrans('۰۱۲۳۴۵۶۷۸۹', '0123456789')

PROVINCE_CANONICAL_MAP = {
    'آذربایجان شرقی': 'east-azerbaijan',
    'آذربایجان غربی': 'west-azerbaijan',
    'اردبیل': 'ardabil',
    'اصفهان': 'isfahan',
    'البرز': 'alborz',
    'ایلام': 'ilam',
    'بوشهر': 'bushehr',
    'تهران': 'tehran',
    'چهارمحال و بختیاری': 'chaharmahal-and-bakhtiari',
    'خراسان جنوبی': 'south-khorasan',
    'خراسان رضوی': 'razavi-khorasan',
    'خراسان شمالی': 'north-khorasan',
    'خوزستان': 'khuzestan',
    'زنجان': 'zanjan',
    'سمنان': 'semnan',
    'سیستان و بلوچستان': 'sistan-and-baluchestan',
    'فارس': 'fars',
    'قزوین': 'qazvin',
    'قم': 'qom',
    'کردستان': 'kurdistan',
    'کرمان': 'kerman',
    'کرمانشاه': 'kermanshah',
    'کهگیلویه و بویراحمد': 'kohgiluyeh-and-boyer-ahmad',
    'گلستان': 'golestan',
    'گیلان': 'gilan',
    'لرستان': 'lorestan',
    'مازندران': 'mazandaran',
    'مرکزی': 'markazi',
    'هرمزگان': 'hormozgan',
    'همدان': 'hamedan',
    'یزد': 'yazd',
}

CITY_CANONICAL_MAP = {
    'تهران': 'tehran', 'مشهد': 'mashhad', 'اصفهان': 'isfahan', 'شیراز': 'shiraz',
    'تبریز': 'tabriz', 'کرج': 'karaj', 'اهواز': 'ahvaz', 'قم': 'qom',
    'کرمان': 'kerman', 'کرمانشاه': 'kermanshah', 'ارومیه': 'urmia',
    'رشت': 'rasht', 'زاهدان': 'zahedan', 'یزد': 'yazd', 'همدان': 'hamedan',
    'اردبیل': 'ardabil', 'بندرعباس': 'bandar-abbas', 'سنندج': 'sanandaj',
    'قزوین': 'qazvin', 'خرم‌آباد': 'khorramabad', 'گرگان': 'gorgan',
    'ساری': 'sari', 'اراک': 'arak', 'بوشهر': 'bushehr', 'بیرجند': 'birjand',
    'بجنورد': 'bojnord', 'شهرکرد': 'shahrekord', 'ایلام': 'ilam', 'یاسوج': 'yasuj',
}


def _normalize_fa_key(text: str) -> str:
    value = (text or '').strip()
    value = value.replace('ي', 'ی').replace('ك', 'ک').replace('‌', ' ')
    value = re.sub(r'\s+', ' ', value)
    return value


def _load_city_map() -> dict[str, str]:
    p = Path(__file__).resolve().parent / 'iran_city_slug_map.json'
    if not p.exists():
        return {}
    try:
        return json.loads(p.read_text(encoding='utf-8'))
    except Exception:
        return {}


CITY_SCOPED_MAP = _load_city_map()


def slugify_fa(text: str) -> str:
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


def replace_digits_with_words(value: str) -> str:
    result = []
    for ch in str(value or ''):
        if ch.isdigit():
            result.append(f"-{DIGIT_WORD_MAP[ch]}-")
        else:
            result.append(ch)
    return ''.join(result)


def slugify_alpha_only(text: str) -> str:
    base = slugify_fa(replace_digits_with_words(text))
    base = re.sub(r'[^a-z-]+', '-', base)
    base = re.sub(r'-{2,}', '-', base).strip('-')
    return base


def normalize_manual_slug(value: str) -> str:
    return slugify_alpha_only(value)


def alpha_suffix(index: int) -> str:
    letters = 'abcdefghijklmnopqrstuvwxyz'
    n = max(1, index)
    out = []
    while n > 0:
        n -= 1
        out.append(letters[n % 26])
        n //= 26
    return ''.join(reversed(out))


def ensure_unique_slug(existing_slugs: Iterable[str], base_slug: str) -> str:
    used = {s for s in existing_slugs if s}
    base = (base_slug or '').strip('-') or 'location'
    if base not in used:
        return base
    idx = 1
    while True:
        candidate = f"{base}-{alpha_suffix(idx)}"
        if candidate not in used:
            return candidate
        idx += 1


def _digits_to_words(value: str) -> str:
    parts = []
    for ch in str(value or ''):
        if ch in DIGIT_WORD_MAP:
            parts.append(DIGIT_WORD_MAP[ch])
    return '-'.join(parts)


def canonical_location_slug(name: str, scope: str = 'generic', province_name: str | None = None) -> str:
    normalized_name = _normalize_fa_key(name)

    if scope == 'province':
        if normalized_name in PROVINCE_CANONICAL_MAP:
            return PROVINCE_CANONICAL_MAP[normalized_name]

    if scope == 'city':
        if province_name:
            scoped_key = f"{_normalize_fa_key(province_name)}::{normalized_name}"
            if scoped_key in CITY_SCOPED_MAP:
                return CITY_SCOPED_MAP[scoped_key]
        if normalized_name in CITY_CANONICAL_MAP:
            return CITY_CANONICAL_MAP[normalized_name]

    if scope == 'region':
        match = re.match(r'^منطقه\s*([0-9۰-۹]+)$', normalized_name)
        if match:
            number = match.group(1).translate(_FA_DIGITS)
            num_slug = _digits_to_words(number)
            return f"region-{num_slug}" if num_slug else 'region'

    return slugify_alpha_only(normalized_name)
