"""
Listing Type Choices (Usage Type for Property States)
"""

LISTING_TYPE_CHOICES = {
    "sale": "فروشی",
    "rent": "اجاره‌ای",
    "presale": "پیش‌فروش",
    "exchange": "تهاتر",
    "other": "سایر",
}


def get_listing_type_label(code: str) -> str:
    """Get label for listing type code"""
    return LISTING_TYPE_CHOICES.get(code, code)


def get_listing_type_choices_list():
    """Get listing type choices as list of tuples"""
    return [(code, label) for code, label in LISTING_TYPE_CHOICES.items()]
