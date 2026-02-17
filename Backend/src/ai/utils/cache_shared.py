import hashlib


def hash_sorted_slugs(values: list[str], length: int = 16) -> str:
    sorted_values = "|".join(sorted(values))
    return hashlib.sha256(sorted_values.encode()).hexdigest()[:length]
