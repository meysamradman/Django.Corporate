from rest_framework import serializers

from src.settings.models import FooterAbout

class PublicFooterAboutSerializer(serializers.ModelSerializer):
    class Meta:
        model = FooterAbout
        fields = [
            'title',
            'text',
        ]
