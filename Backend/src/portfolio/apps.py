from django.apps import AppConfig


class PortfolioConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'src.portfolio'

    def ready(self):
        import src.portfolio.signals
