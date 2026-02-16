from rest_framework import serializers

from src.settings.models import GeneralSettings


class PublicGeneralSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = GeneralSettings
        fields = [
            'site_name',
            'copyright_text',
            'copyright_link',
        ]
