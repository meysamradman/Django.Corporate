from django.apps import AppConfig


class AiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'src.ai'
    verbose_name = 'AI System'
    
    def ready(self):
        """✅ Register signals for auto cache invalidation"""
        import src.ai.signals  # noqa

