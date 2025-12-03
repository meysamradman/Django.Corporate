from rest_framework import serializers


class AIChatMessageSerializer(serializers.Serializer):
    
    role = serializers.ChoiceField(
        choices=['user', 'assistant'],
        required=True,
        help_text="Message role: 'user' or 'assistant'"
    )
    
    content = serializers.CharField(
        required=True,
        help_text="Message content"
    )


class AIChatRequestSerializer(serializers.Serializer):
    
    message = serializers.CharField(
        required=True,
        max_length=5000,
        help_text="User message"
    )
    
    provider_name = serializers.ChoiceField(
        choices=['gemini', 'openai', 'deepseek', 'openrouter', 'groq', 'huggingface'],
        default='deepseek',
        help_text="AI model for chat"
    )
    
    conversation_history = AIChatMessageSerializer(
        many=True,
        required=False,
        allow_null=True,
        help_text="Previous conversation history (optional - for continuing conversation)"
    )
    
    system_message = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
        max_length=1000,
        help_text="System message (optional - for setting AI personality)"
    )
    
    temperature = serializers.FloatField(
        required=False,
        default=0.7,
        min_value=0.0,
        max_value=2.0,
        help_text="Temperature for response generation (0.0 to 2.0)"
    )
    
    max_tokens = serializers.IntegerField(
        required=False,
        default=2048,
        min_value=100,
        max_value=4096,
        help_text="Maximum number of tokens in response (100 to 4096)"
    )
    
    def validate_message(self, value):
        from src.ai.messages.messages import CHAT_ERRORS
        if not value or not value.strip():
            raise serializers.ValidationError(CHAT_ERRORS["validation_error"])
        return value.strip()


class AIChatResponseSerializer(serializers.Serializer):
    
    message = serializers.CharField()
    reply = serializers.CharField()
    provider_name = serializers.CharField()
    generation_time_ms = serializers.IntegerField()

