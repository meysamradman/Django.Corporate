from django.apps import AppConfig

class PageConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'src.page'
    verbose_name = 'Page'
    verbose_name_plural = 'Pages'

