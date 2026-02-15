from src.settings.models import GeneralSettings, Slider


def get_public_logo_settings() -> GeneralSettings:
    return GeneralSettings.get_settings()


def get_public_active_sliders():
    return (
        Slider.objects.select_related('image', 'video')
        .filter(is_active=True)
        .order_by('order', '-created_at')
    )
