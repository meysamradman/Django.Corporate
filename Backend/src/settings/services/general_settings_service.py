from django.core.exceptions import ValidationError
from django.db import OperationalError
from src.settings.models import GeneralSettings


def get_general_settings():
    """Get general settings (Singleton)"""
    try:
        return GeneralSettings.get_settings()
    except OperationalError:
        raise ValidationError("database_error")
    except Exception:
        raise ValidationError("retrieve_failed")


def update_general_settings(validated_data):
    """Update general settings"""
    settings = GeneralSettings.get_settings()
    
    for field, value in validated_data.items():
        setattr(settings, field, value)
    
    settings.save()
    return settings
