"""
Property Condition Choices
"""

PROPERTY_CONDITION_CHOICES = {
    "old": "قدیمی",
    "new": "نوساز",
    "renovated": "بازسازی شده",
    "needs_renovation": "نیازمند بازسازی",
}


def get_property_condition_label(code: str) -> str:
    """Get label for property condition code"""
    return PROPERTY_CONDITION_CHOICES.get(code, code)


def get_property_condition_choices_list():
    """Get property condition choices as list of tuples"""
    return [(code, label) for code, label in PROPERTY_CONDITION_CHOICES.items()]
