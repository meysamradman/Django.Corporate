from django.apps import AppConfig


class RealEstateConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'src.real_estate'

    def ready(self):
        import src.real_estate.signals  # noqa
        try:
            from src.ai.destinations.registry import ContentDestinationRegistry
            from src.real_estate.services.ai_integration import save_ai_content_to_real_estate
            ContentDestinationRegistry.register('real_estate', 'املاک', save_ai_content_to_real_estate)
        except ImportError:
            pass