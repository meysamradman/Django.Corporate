PROPERTY_CONDITION_CHOICES = {
    "old": "قدیمی",
    "new": "نوساز",
    "renovated": "بازسازی شده",
    "needs_renovation": "نیازمند بازسازی",
}


def get_property_condition_label(code: str) -> str:
    return PROPERTY_CONDITION_CHOICES.get(code, code)


def get_property_condition_choices_list():
    return [(code, label) for code, label in PROPERTY_CONDITION_CHOICES.items()]
