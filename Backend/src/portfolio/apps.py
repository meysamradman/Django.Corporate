from django.apps import AppConfig

class PortfolioConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'src.portfolio'

    def ready(self):
        import src.portfolio.signals
        try:
            from src.ai.destinations.registry import ContentDestinationRegistry
            from src.portfolio.services.ai_integration import save_ai_content_to_portfolio
            ContentDestinationRegistry.register('portfolio', 'نمونه‌کار', save_ai_content_to_portfolio)
        except ImportError:
            pass
