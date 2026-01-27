from django.apps import AppConfig


class BlogConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'src.blog'

    def ready(self):
        import src.blog.signals
        try:
            from src.ai.destinations.registry import ContentDestinationRegistry
            from src.blog.services.ai_integration import save_ai_content_to_blog
            ContentDestinationRegistry.register('blog', 'وبلاگ', save_ai_content_to_blog)
        except ImportError:
            pass
