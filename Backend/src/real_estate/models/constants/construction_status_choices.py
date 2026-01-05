CONSTRUCTION_STATUS_CHOICES = {
    "old_building": "ساختمان قدیمی",
    "new_building": "نوساز",
    "under_construction": "در حال ساخت",
    "skeleton": "اسکلت",
    "finishing": "نازک‌کاری",
    "ready": "آماده تحویل",
}


def get_construction_status_label(code: str) -> str:
    return CONSTRUCTION_STATUS_CHOICES.get(code, code)


def get_construction_status_choices_list():
    return [(code, label) for code, label in CONSTRUCTION_STATUS_CHOICES.items()]
