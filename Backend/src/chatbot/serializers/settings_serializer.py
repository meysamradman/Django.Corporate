from rest_framework import serializers
from src.chatbot.models.settings import ChatbotSettings
from src.chatbot.messages.messages import CHATBOT_ERRORS

class ChatbotSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatbotSettings
        fields = '__all__'
        read_only_fields = ['public_id', 'created_at', 'updated_at']
    
    def validate_rate_limit_per_minute(self, value):
        if value < 1:
            raise serializers.ValidationError(CHATBOT_ERRORS['rate_limit_min'])
        if value > 100:
            raise serializers.ValidationError(CHATBOT_ERRORS['rate_limit_max'])
        return value
