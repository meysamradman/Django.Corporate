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
    return PROPERTY_DIRECTION_CHOICES.get(code, code)


def get_property_direction_choices_list():
    return [(code, label) for code, label in PROPERTY_DIRECTION_CHOICES.items()]
