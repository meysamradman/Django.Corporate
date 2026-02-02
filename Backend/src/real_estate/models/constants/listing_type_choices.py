LISTING_TYPE_CHOICES = {
    "sale": "فروش",
    "rent": "اجاره",
    "presale": "پیش‌فروش",
    "exchange": "معاوضه",
    "mortgage": "رهن",
    "other": "سایر",
}

def get_listing_type_label(code: str) -> str:
    return LISTING_TYPE_CHOICES.get(code, code)

def get_listing_type_choices_list():
    return [(code, label) for code, label in LISTING_TYPE_CHOICES.items()]
