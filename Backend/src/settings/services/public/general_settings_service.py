from src.settings.models import GeneralSettings


def get_public_general_settings() -> GeneralSettings:
    return GeneralSettings.get_settings()
