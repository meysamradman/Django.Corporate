PROPERTY_STATUS_CHOICES = {
    "active": "فعال",
    "pending": "در حال معامله",
    "sold": "فروخته شده",
    "rented": "اجاره داده شده",
    "archived": "بایگانی شده",
}

def get_property_status_label(code: str) -> str:
    return PROPERTY_STATUS_CHOICES.get(code, code)

def get_property_status_choices_list():
    return [(code, label) for code, label in PROPERTY_STATUS_CHOICES.items()]
