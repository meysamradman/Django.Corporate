from rest_framework import serializers

from src.chatbot.models.settings import ChatbotSettings


class PublicChatbotSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatbotSettings
        fields = [
            'is_enabled',
            'welcome_message',
            'default_message',
            'rate_limit_per_minute',
        ]


__all__ = [
    'PublicChatbotSettingsSerializer',
]
