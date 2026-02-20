import json
import re
from functools import lru_cache
from pathlib import Path


ENGLISH_SLUG_PATTERN = re.compile(r'^[a-z]+(?:-[a-z]+)*$')
_ENGLISH_SLUG_RELAXED_PATTERN = re.compile(r'^[a-z0-9]+(?:-[a-z0-9]+)*$')
_FA_NUM_PATTERN = re.compile(r'^(?:منطقه|ناحیه)\s*([0-9۰-۹]+)$')


_FA_TO_EN_CHAR_MAP = {
    'ا': 'a', 'آ': 'a', 'أ': 'a', 'إ': 'e',
    'ب': 'b', 'پ': 'p', 'ت': 't', 'ث': 's',
    'ج': 'j', 'چ': 'ch', 'ح': 'h', 'خ': 'kh',
    'د': 'd', 'ذ': 'z', 'ر': 'r', 'ز': 'z',
    'ژ': 'zh', 'س': 's', 'ش': 'sh', 'ص': 's',
    'ض': 'z', 'ط': 't', 'ظ': 'z', 'ع': 'a',
    'غ': 'gh', 'ف': 'f', 'ق': 'q', 'ک': 'k',
    'ك': 'k', 'گ': 'g', 'ل': 'l', 'م': 'm',
    'ن': 'n', 'ه': 'h', 'ء': '',
}

_DIGIT_TRANS = str.maketrans('۰۱۲۳۴۵۶۷۸۹', '0123456789')


def _normalize_fa_text(value: str) -> str:
    text = (value or '').strip()
    text = text.replace('ي', 'ی').replace('ك', 'ک').replace('\u200c', ' ')
    return ' '.join(text.split())


def normalize_manual_slug(value: str) -> str:
    slug = (value or '').strip().lower()
    slug = slug.replace('_', '-').replace(' ', '-')
    slug = re.sub(r'[^a-z\-0-9]+', '-', slug)
    slug = re.sub(r'-{2,}', '-', slug).strip('-')
    return slug


def _is_preferred_slug_acceptable(slug: str) -> bool:
    candidate = normalize_manual_slug(slug)
    if not candidate:
        return False
    if not _ENGLISH_SLUG_RELAXED_PATTERN.fullmatch(candidate):
        return False

    core = candidate.replace('-', '')
    if len(core) >= 5 and re.search(r'[bcdfghjklmnpqrstvwxyz]{4,}', core):
        return False

    if len(core) >= 7:
        vowel_count = sum(ch in 'aeiou' for ch in core)
        if vowel_count <= 1:
            return False

    return True


def _soften_consonant_clusters(slug: str) -> str:
    vowels = set('aeiou')
    digraphs = {'kh', 'sh', 'ch', 'gh', 'zh'}

    def _soften_token(token: str) -> str:
        if len(token) < 4:
            return token

        chars = list(token)
        for i in range(1, len(chars) - 1):
            prev_ch = chars[i - 1]
            cur_ch = chars[i]
            next_ch = chars[i + 1]

            if prev_ch in vowels or cur_ch in vowels or next_ch in vowels:
                continue

            pair = prev_ch + cur_ch
            if pair in digraphs:
                continue

            return ''.join(chars[:i] + ['e'] + chars[i:])

        return token

    tokens = [t for t in (slug or '').split('-') if t]
    softened = [_soften_token(t) for t in tokens]
    return '-'.join(softened)


def _vocalize_hard_tokens(slug: str) -> str:
    vowels = set('aeiou')

    def _needs_vocalization(token: str) -> bool:
        if len(token) < 5:
            return False
        vowel_count = sum(ch in vowels for ch in token)
        has_hard_cluster = re.search(r'[bcdfghjklmnpqrstvwxyz]{4,}', token) is not None
        return has_hard_cluster and vowel_count == 0

    def _vocalize(token: str) -> str:
        if not _needs_vocalization(token):
            return token

        chars = list(token)
        out: list[str] = [chars[0]]

        for index in range(1, len(chars)):
            cur = chars[index]
            prev = out[-1]
            nxt = chars[index + 1] if index + 1 < len(chars) else ''

            prev_cons = prev not in vowels
            cur_cons = cur not in vowels
            next_cons = bool(nxt) and nxt not in vowels

            if prev_cons and cur_cons and next_cons:
                out.append('e')

            out.append(cur)

        text = ''.join(out)
        text = text.replace('eee', 'e').replace('ee', 'e')
        return text

    tokens = [token for token in (slug or '').split('-') if token]
    return '-'.join(_vocalize(token) for token in tokens)


def _normalize_common_persian_patterns(slug: str) -> str:
    text = slug or ''

    replacements = {
        'qesr': 'qasr',
        'sih-': 'siah-',
        'sih': 'siah',
        'cheshmh': 'cheshmeh',
        'shhmh': 'shmeh',
        'tenkabn': 'tonkabon',
        'tonkabn': 'tonkabon',
        'bumehn': 'boumehen',
        'hendudr': 'hendudar',
        'mehlat': 'mahalat',
        'mhlat': 'mahalat',
        'zauih': 'zavie',
        'zaviih': 'zavie',
        'razqan': 'razeghan',
        'tefrsh': 'tafresh',
        'serdsht': 'sardasht',
        'klaredsht': 'kelardasht',
        'sliman': 'soleiman',
        'sfid': 'sefid',
        'mhr': 'mehr',
        'zhab': 'zahab',
        'tazh-shahr': 'tazeh-shahr',
        'mbark-shahr': 'mobarak-shahr',
        'serpl': 'sarpol',
        'pl-sefid': 'pol-sefid',
    }
    for old, new in replacements.items():
        text = text.replace(old, new)

    # token-level suffix cleanup
    tokens = []
    for token in text.split('-'):
        t = token
        if t.endswith('mh') and len(t) > 3:
            t = t[:-2] + 'meh'
        if t.endswith('bn') and len(t) > 4:
            t = t[:-2] + 'ban'
        if t.endswith('sr') and len(t) > 4:
            t = t[:-2] + 'sar'
        tokens.append(t)

    return '-'.join(tokens)


def _normalize_fa_slug(value: str) -> str:
    text = _normalize_fa_text(value)
    text = text.translate(_DIGIT_TRANS)
    text = text.replace(' ', '-')
    text = re.sub(r'-{2,}', '-', text).strip('-')
    return text


def _transliterate_fa_to_en(value: str) -> str:
    text = _normalize_fa_text(value)
    if not text:
        return ''

    parts: list[str] = []
    length = len(text)
    for index, char in enumerate(text):
        if char.isdigit() or ('0' <= char <= '9'):
            parts.append(char)
            continue
        if char in '۰۱۲۳۴۵۶۷۸۹':
            parts.append(char.translate(_DIGIT_TRANS))
            continue
        if char in {' ', '-', '_', '/'}:
            parts.append('-')
            continue
        if char in {'و', 'ؤ'}:
            prev_char = text[index - 1] if index > 0 else ''
            next_char = text[index + 1] if index + 1 < length else ''

            if next_char in {'ی', 'ي', 'ئ'}:
                if prev_char in {'ا', 'آ', 'أ', 'إ'}:
                    parts.append('v')
                else:
                    parts.append('o')
            elif prev_char in {'ا', 'آ', 'أ', 'إ'}:
                parts.append('v')
            elif prev_char in {'خ'}:
                parts.append('o')
            else:
                parts.append('u')
            continue
        if char in {'ی', 'ي', 'ئ'}:
            if index == 0:
                parts.append('y')
            else:
                parts.append('i')
            continue
        if char == 'ق':
            next_char = text[index + 1] if index + 1 < length else ''
            if next_char in {'ا', 'آ'}:
                parts.append('gh')
            else:
                parts.append('q')
            continue
        parts.append(_FA_TO_EN_CHAR_MAP.get(char, ''))

    slug = ''.join(parts)
    slug = slug.replace('ghh', 'gh').replace('khh', 'kh').replace('shh', 'sh')
    slug = slug.replace('bndr', 'bandar')
    slug = slug.replace('shhr', 'shahr')
    slug = slug.replace('shr', 'shahr')
    slug = slug.replace('khmini', 'khomeini')
    slug = slug.replace('khmin', 'khomein')
    slug = slug.replace('khmini-shahr', 'khomeini-shahr')
    slug = _soften_consonant_clusters(slug)
    slug = _vocalize_hard_tokens(slug)
    slug = _normalize_common_persian_patterns(slug)
    slug = re.sub(r'[^a-z0-9\-]+', '', slug.lower())
    slug = re.sub(r'-{2,}', '-', slug).strip('-')
    return slug


@lru_cache(maxsize=1)
def _load_slug_overrides() -> dict:
    file_path = Path(__file__).resolve().parent / 'data' / 'iran_slug_overrides.json'
    if not file_path.exists():
        return {'provinces': {}, 'cities': {}, 'cities_scoped': {}}

    try:
        raw = json.loads(file_path.read_text(encoding='utf-8'))
    except Exception:
        return {'provinces': {}, 'cities': {}, 'cities_scoped': {}}

    return {
        'provinces': raw.get('provinces') or {},
        'cities': raw.get('cities') or {},
        'cities_scoped': raw.get('cities_scoped') or {},
    }


def _region_numeric_slug(name: str) -> str:
    normalized = _normalize_fa_text(name)
    match = _FA_NUM_PATTERN.fullmatch(normalized)
    if not match:
        return ''
    number = (match.group(1) or '').translate(_DIGIT_TRANS)
    if not number.isdigit():
        return ''
    return f'region-{int(number)}'


def canonical_location_slug(
    name: str,
    *,
    scope: str,
    province_name: str = '',
    preferred_en_slug: str = '',
    language: str = 'en',
) -> str:
    base_name = _normalize_fa_text(name)
    if not base_name:
        return ''

    lang = (language or 'en').strip().lower()
    if lang == 'fa':
        return _normalize_fa_slug(base_name)

    if scope == 'region':
        region_slug = _region_numeric_slug(base_name)
        if region_slug:
            return region_slug

    overrides = _load_slug_overrides()
    provinces = overrides.get('provinces') or {}
    cities = overrides.get('cities') or {}
    cities_scoped = overrides.get('cities_scoped') or {}

    if scope == 'province':
        manual = normalize_manual_slug(provinces.get(base_name, ''))
        if manual and _ENGLISH_SLUG_RELAXED_PATTERN.fullmatch(manual):
            return manual
    elif scope == 'city':
        scoped_key = f"{_normalize_fa_text(province_name)}::{base_name}" if province_name else ''
        if scoped_key:
            manual_scoped = normalize_manual_slug(cities_scoped.get(scoped_key, ''))
            if manual_scoped and _ENGLISH_SLUG_RELAXED_PATTERN.fullmatch(manual_scoped):
                return manual_scoped

        manual_city = normalize_manual_slug(cities.get(base_name, ''))
        if manual_city and _ENGLISH_SLUG_RELAXED_PATTERN.fullmatch(manual_city):
            return manual_city

    preferred = normalize_manual_slug(preferred_en_slug)
    if _is_preferred_slug_acceptable(preferred):
        return preferred

    transliterated = _transliterate_fa_to_en(base_name)
    return transliterated


def build_location_slug(
    name: str,
    *,
    scope: str,
    province_name: str = '',
    language: str = 'en',
    preferred_en_slug: str = '',
) -> str:
    return canonical_location_slug(
        name,
        scope=scope,
        province_name=province_name,
        preferred_en_slug=preferred_en_slug,
        language=language,
    )


def ensure_unique_slug(existing_slugs, base_slug: str) -> str:
    slug = normalize_manual_slug(base_slug)
    if not slug:
        slug = 'location'

    existing = {normalize_manual_slug(item) for item in existing_slugs if item}
    if slug not in existing:
        return slug

    counter = 2
    while True:
        candidate = f'{slug}-{counter}'
        if candidate not in existing:
            return candidate
        counter += 1
