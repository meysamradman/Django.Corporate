"""
City Position Choices (Property location within city)
"""

CITY_POSITION_CHOICES = {
    "north_city": "شمال شهر",
    "south_city": "جنوب شهر",
    "center_city": "مرکز شهر",
    "suburb": "حومه",
    "out_of_city": "خارج از شهر",
}


def get_city_position_label(code: str) -> str:
    """Get label for city position code"""
    return CITY_POSITION_CHOICES.get(code, code)


def get_city_position_choices_list():
    """Get city position choices as list of tuples"""
    return [(code, label) for code, label in CITY_POSITION_CHOICES.items()]
