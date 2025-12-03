from django.core.exceptions import ValidationError
from django.db import OperationalError

from src.settings.models import GeneralSettings
from src.settings.messages.messages import SETTINGS_ERRORS


def get_general_settings():
    try:
        return GeneralSettings.get_settings()
    except OperationalError:
        raise ValidationError(SETTINGS_ERRORS["settings_database_error"])
    except Exception:
        raise ValidationError(SETTINGS_ERRORS["settings_retrieve_failed"])


def update_general_settings(validated_data):
    settings = GeneralSettings.get_settings()
    
    for field, value in validated_data.items():
        setattr(settings, field, value)
    
    settings.save()
    return settings
