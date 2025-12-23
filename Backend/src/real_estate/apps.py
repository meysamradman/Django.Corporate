from django.apps import AppConfig


class RealEstateConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'src.real_estate'
    verbose_name = 'Real Estate'
    
    def ready(self):
        """Import signals when app is ready"""
        import src.real_estate.signals  # noqa