DOCUMENT_TYPE_CHOICES = {
    "official_single": "سند تک‌برگ",
    "official_old": "سند قدیمی",
    "official": "سند اداری / ششدانگ",
    "pre_official": "در حال اخذ سند",
    "contract": "قولنامه‌ای",
    "cooperative": "تعاونی",
    "agricultural": "سند زراعی",
    "endowment": "وقفی",
    "judicial": "حکم دادگاه",
    "none": "فاقد سند",
}

def get_document_type_label(code: str) -> str:
    return DOCUMENT_TYPE_CHOICES.get(code, code)

def get_document_type_choices_list():
    return [(code, label) for code, label in DOCUMENT_TYPE_CHOICES.items()]
