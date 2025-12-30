"""
Space Type Choices for Short-Term Rental Properties
"""

SPACE_TYPE_CHOICES = {
    "residential": "اقامتی",
    "work": "کاری",
    "corporate": "شرکتی",
    "mixed": "ترکیبی",
}


def get_space_type_label(code: str) -> str:
    """Get label for space type code"""
    return SPACE_TYPE_CHOICES.get(code, code)


def get_space_type_choices_list():
    """Get space type choices as list of tuples"""
    return [(code, label) for code, label in SPACE_TYPE_CHOICES.items()]
