from rest_framework import serializers
from src.chatbot.models.settings import ChatbotSettings


class ChatbotSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatbotSettings
        fields = '__all__'
        read_only_fields = ['public_id', 'created_at', 'updated_at']
    
    def validate_rate_limit_per_minute(self, value):
        if value < 1:
            raise serializers.ValidationError("محدودیت درخواست باید حداقل 1 باشد.")
        if value > 100:
            raise serializers.ValidationError("محدودیت درخواست نمی‌تواند بیشتر از 100 باشد.")
        return value
