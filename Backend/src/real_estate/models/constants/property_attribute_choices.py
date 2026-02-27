COOLING_SYSTEM_CHOICES = {
    "none": "ندارد",
    "gas_cooler": "کولر گازی",
    "water_cooler": "کولر آبی",
    "split": "اسپلیت",
    "duct_split": "داکت اسپلیت",
    "chiller": "چیلر",
    "fan_coil": "فن‌کویل",
    "central": "مرکزی",
}

HEATING_SYSTEM_CHOICES = {
    "none": "ندارد",
    "radiator": "رادیاتور",
    "package": "پکیج",
    "boiler": "موتورخانه",
    "floor_heating": "گرمایش از کف",
    "heater": "بخاری",
    "fireplace": "شومینه",
    "central": "مرکزی",
}

WARM_WATER_PROVIDER_CHOICES = {
    "none": "ندارد",
    "package": "پکیج",
    "boiler": "موتورخانه",
    "water_heater": "آبگرمکن",
    "solar": "خورشیدی",
}

FLOOR_TYPE_CHOICES = {
    "ceramic": "سرامیک",
    "parquet": "پارکت",
    "stone": "سنگ",
    "laminate": "لمینت",
    "mosaic": "موزاییک",
    "concrete": "بتن",
}

TOILET_TYPE_CHOICES = {
    "iranian": "ایرانی",
    "foreign": "فرنگی",
    "both": "ایرانی و فرنگی",
}

KITCHEN_TYPE_CHOICES = {
    "closed": "بسته",
    "open": "اپن",
    "island": "جزیره",
    "semi_open": "نیمه باز",
}

BUILDING_FACADE_CHOICES = {
    "stone": "سنگ",
    "brick": "آجر",
    "composite": "کامپوزیت",
    "cement": "سیمان",
    "glass": "شیشه",
    "mixed": "ترکیبی",
}

OCCUPANCY_STATUS_CHOICES = {
    "vacant": "خالی",
    "owner_occupied": "مالک ساکن",
    "tenant_occupied": "مستاجر دارد",
}

CABINET_MATERIAL_CHOICES = {
    "mdf": "MDF",
    "high_gloss": "هایگلاس",
    "membrane": "ممبران",
    "wood": "چوب",
    "metal": "فلزی",
    "pvc": "PVC",
}


def _to_choices_list(mapping):
    return [(code, label) for code, label in mapping.items()]


def get_cooling_system_choices_list():
    return _to_choices_list(COOLING_SYSTEM_CHOICES)


def get_heating_system_choices_list():
    return _to_choices_list(HEATING_SYSTEM_CHOICES)


def get_warm_water_provider_choices_list():
    return _to_choices_list(WARM_WATER_PROVIDER_CHOICES)


def get_floor_type_choices_list():
    return _to_choices_list(FLOOR_TYPE_CHOICES)


def get_toilet_type_choices_list():
    return _to_choices_list(TOILET_TYPE_CHOICES)


def get_kitchen_type_choices_list():
    return _to_choices_list(KITCHEN_TYPE_CHOICES)


def get_building_facade_choices_list():
    return _to_choices_list(BUILDING_FACADE_CHOICES)


def get_occupancy_status_choices_list():
    return _to_choices_list(OCCUPANCY_STATUS_CHOICES)


def get_cabinet_material_choices_list():
    return _to_choices_list(CABINET_MATERIAL_CHOICES)
