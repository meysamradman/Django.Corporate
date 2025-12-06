from django.apps import AppConfig


class OrderConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'src.order'
    verbose_name = 'Order'
    
    def ready(self):
        import src.order.signals
