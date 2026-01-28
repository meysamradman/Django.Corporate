from django.apps import AppConfig

class TicketConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'src.ticket'

    def ready(self):
        import src.ticket.signals

