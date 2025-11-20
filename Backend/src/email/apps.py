from django.apps import AppConfig


class EmailConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'src.email'
    
    def ready(self):
        import src.email.signals
        # ✅ Django Admin حذف شد - از Next.js برای پنل ادمین استفاده می‌شود

