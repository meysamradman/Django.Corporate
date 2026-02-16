from src.settings.models import FooterAbout


def get_public_footer_about() -> FooterAbout:
    return FooterAbout.get_settings()
