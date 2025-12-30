"""
Construction Status Choices for Properties
"""

CONSTRUCTION_STATUS_CHOICES = {
    "old_building": "ساختمان قدیمی",
    "new_building": "نوساز",
    "under_construction": "در حال ساخت",
    "skeleton": "اسکلت",
    "finishing": "نازک‌کاری",
    "ready": "آماده تحویل",
}


def get_construction_status_label(code: str) -> str:
    """Get label for construction status code"""
    return CONSTRUCTION_STATUS_CHOICES.get(code, code)


def get_construction_status_choices_list():
    """Get construction status choices as list of tuples"""
    return [(code, label) for code, label in CONSTRUCTION_STATUS_CHOICES.items()]
