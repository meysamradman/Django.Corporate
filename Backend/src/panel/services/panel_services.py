from django.db import transaction
from src.panel.models import PanelSettings
from src.panel.utils.cache import PanelCacheManager


class PanelSettingsService:
    
    @staticmethod
    def get_panel_settings():

        instance, _ = PanelSettings.objects.select_related('logo', 'favicon').get_or_create()
        return instance
    
    @staticmethod
    def update_panel_settings(instance, validated_data, remove_logo=False, remove_favicon=False):

        with transaction.atomic():
            data_to_update = validated_data.copy()

            if remove_logo:
                instance.logo = None
                data_to_update.pop('logo', None)

            if remove_favicon:
                instance.favicon = None
                data_to_update.pop('favicon', None)

            for attr, value in data_to_update.items():
                setattr(instance, attr, value)
            
            instance.save()
            instance.refresh_from_db()

            PanelCacheManager.invalidate_panel_settings()
            
            instance = PanelSettings.objects.select_related('logo', 'favicon').get(pk=instance.pk)
            
            return instance
