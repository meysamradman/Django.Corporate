"""
Property Direction Choices
"""

PROPERTY_DIRECTION_CHOICES = {
    "north": "شمالی",
    "south": "جنوبی",
    "east": "شرقی",
    "west": "غربی",
    "north_south": "شمالی-جنوبی",
    "corner": "نبش",
    "two_sided": "دو نبش",
}


def get_property_direction_label(code: str) -> str:
    """Get label for property direction code"""
    return PROPERTY_DIRECTION_CHOICES.get(code, code)


def get_property_direction_choices_list():
    """Get property direction choices as list of tuples"""
    return [(code, label) for code, label in PROPERTY_DIRECTION_CHOICES.items()]
