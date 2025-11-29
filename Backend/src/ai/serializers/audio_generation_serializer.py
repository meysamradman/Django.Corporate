from rest_framework import serializers
from src.ai.models import AIProvider
from src.ai.messages.messages import AI_ERRORS


class AIAudioGenerationRequestSerializer(serializers.Serializer):
    
    provider_name = serializers.ChoiceField(
        choices=[('openai', 'OpenAI')],  # Only OpenAI supports TTS currently
        help_text="AI provider name (currently only 'openai' supports TTS)"
    )
    
    text = serializers.CharField(
        max_length=4096,  # OpenAI TTS limit
        help_text="Text to convert to speech"
    )
    
    title = serializers.CharField(
        max_length=200,
        required=False,
        allow_blank=True,
        help_text="Audio title (if not provided, text preview will be used)"
    )
    
    model = serializers.ChoiceField(
        choices=[('tts-1', 'TTS-1 (Fast)'), ('tts-1-hd', 'TTS-1-HD (High Quality)')],
        required=False,
        default='tts-1',
        help_text="TTS model: tts-1 (fast) or tts-1-hd (high quality)"
    )
    
    voice = serializers.ChoiceField(
        choices=[
            ('alloy', 'Alloy'),
            ('echo', 'Echo'),
            ('fable', 'Fable'),
            ('onyx', 'Onyx'),
            ('nova', 'Nova'),
            ('shimmer', 'Shimmer')
        ],
        required=False,
        default='alloy',
        help_text="Voice to use for speech"
    )
    
    speed = serializers.FloatField(
        required=False,
        default=1.0,
        min_value=0.25,
        max_value=4.0,
        help_text="Speed of speech (0.25 to 4.0)"
    )
    
    response_format = serializers.ChoiceField(
        choices=[('mp3', 'MP3'), ('opus', 'Opus'), ('aac', 'AAC'), ('flac', 'FLAC')],
        required=False,
        default='mp3',
        help_text="Audio format"
    )
    
    save_to_db = serializers.BooleanField(
        required=False,
        default=False,
        help_text="Save audio to database? (default: false - only generate)"
    )
    
    def validate_provider_name(self, value):
        if value != 'openai':
            raise serializers.ValidationError(
                f"Provider '{value}' does not support text-to-speech. Currently only 'openai' is supported."
            )
        
        # Check if provider is active
        try:
            provider = AIProvider.objects.get(slug=value, is_active=True)
            if not provider.shared_api_key:
                raise serializers.ValidationError(
                    AI_ERRORS["provider_not_available"].format(provider_name=value)
                )
        except AIProvider.DoesNotExist:
            raise serializers.ValidationError(
                AI_ERRORS["provider_not_available"].format(provider_name=value)
            )
        return value
    
    def validate_text(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Text cannot be empty.")
        
        # OpenAI TTS has a 4096 character limit
        if len(value) > 4096:
            raise serializers.ValidationError("Text cannot exceed 4096 characters.")
        
        return value.strip()

