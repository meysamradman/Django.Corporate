SPACE_TYPE_CHOICES = {
    "residential": "اقامتی",
    "work": "کاری",
    "corporate": "شرکتی",
    "mixed": "ترکیبی",
}

def get_space_type_label(code: str) -> str:
    return SPACE_TYPE_CHOICES.get(code, code)

def get_space_type_choices_list():
    return [(code, label) for code, label in SPACE_TYPE_CHOICES.items()]
