LISTING_TYPE_CHOICES = {
    "sale": "فروش",
    "rent": "رهن و اجاره",
    "presale": "پیش‌فروش",
    "exchange": "معاوضه",
    "mortgage": "رهن کامل",
    "other": "سایر",
}

LISTING_TYPE_FINANCIAL_RULES = {
    "sale": {
        "require_sale_price": True,
    },
    "rent": {
        "require_mortgage_and_rent": True,
    },
    "mortgage": {
        "require_mortgage_only": True,
        "disallow_rent_amount": True,
    },
}

def get_listing_type_label(code: str) -> str:
    return LISTING_TYPE_CHOICES.get(code, code)

def get_listing_type_choices_list():
    return [(code, label) for code, label in LISTING_TYPE_CHOICES.items()]


def get_listing_type_financial_rules(code: str) -> dict:
    return LISTING_TYPE_FINANCIAL_RULES.get(code, {})
