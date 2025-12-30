"""
Unit Type Choices
"""

UNIT_TYPE_CHOICES = {
    "single_unit": "تک‌واحدی",
    "two_units": "دو واحدی",
    "multiple_units": "چند واحدی",
    "tower": "برج",
    "villa_unit": "ویلایی",
}


def get_unit_type_label(code: str) -> str:
    """Get label for unit type code"""
    return UNIT_TYPE_CHOICES.get(code, code)


def get_unit_type_choices_list():
    """Get unit type choices as list of tuples"""
    return [(code, label) for code, label in UNIT_TYPE_CHOICES.items()]
