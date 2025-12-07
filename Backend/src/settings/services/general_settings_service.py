from django.core.exceptions import ValidationError
from django.db import OperationalError

from src.settings.models import GeneralSettings
from src.settings.messages.messages import SETTINGS_ERRORS


def get_general_settings():
    try:
        settings = GeneralSettings.objects.first()
        if not settings:
            settings = GeneralSettings.objects.create(
                site_name="System Name",
                copyright_text="All rights reserved"
            )
        return settings
    except OperationalError:
        raise ValidationError(SETTINGS_ERRORS["settings_database_error"])
    except Exception:
        raise ValidationError(SETTINGS_ERRORS["settings_retrieve_failed"])


def update_general_settings(validated_data):
    settings = GeneralSettings.objects.first()
    
    if not settings:
        settings = GeneralSettings.objects.create(
            site_name="System Name",
            copyright_text="All rights reserved"
        )
    
    for field, value in validated_data.items():
        setattr(settings, field, value)
    
    settings.save()
    return settings
