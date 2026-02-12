from rest_framework import serializers
from src.ai.models import AIProvider
from src.ai.messages.messages import AI_ERRORS
from src.ai.providers.capabilities import supports_feature

class AIAudioGenerationRequestSerializer(serializers.Serializer):
    
    model_id = serializers.IntegerField(
        required=False,
        allow_null=True,
        help_text="Deprecated/ignored. Model is resolved from provider active model."
    )
    
    provider_name = serializers.CharField(
        required=False,
        allow_null=True,
        allow_blank=True,
        default=None,
        help_text="Optional. If omitted, server uses the default audio model."
    )
    
    text = serializers.CharField(
        max_length=4096,
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
    
    def validate_text(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError(AI_ERRORS["text_empty"])
        
        if len(value) > 4096:
            raise serializers.ValidationError(AI_ERRORS["text_too_long"])
        
        return value.strip()

    def validate_provider_name(self, value: str):
        provider_slug = (value or '').strip().lower()
        if not provider_slug:
            return None

        provider = AIProvider.objects.filter(slug=provider_slug, is_active=True).first()
        if not provider:
            raise serializers.ValidationError(AI_ERRORS.get('provider_not_found_or_inactive'))

        if not supports_feature(provider_slug, 'audio'):
            raise serializers.ValidationError(AI_ERRORS.get('provider_not_supported'))

        return provider_slug

