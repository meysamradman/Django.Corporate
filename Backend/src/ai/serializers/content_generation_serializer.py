from rest_framework import serializers
from src.ai.messages.messages import AI_ERRORS
from src.ai.models import AIProvider
from src.ai.providers.capabilities import supports_feature

class AIContentGenerationRequestSerializer(serializers.Serializer):
    
    topic = serializers.CharField(
        required=True,
        max_length=500,
        help_text="Content topic or title"
    )
    
    model_id = serializers.CharField(
        required=False,
        allow_null=True,
        help_text="Deprecated/ignored. Model is resolved from provider active model."
    )
    
    provider_name = serializers.CharField(
        default=None,
        required=False,
        allow_null=True,
        allow_blank=True,
        help_text="Optional. If omitted, server uses the default content model."
    )
    
    word_count = serializers.IntegerField(
        default=500,
        min_value=100,
        max_value=2000,
        help_text="Desired word count (100 to 2000)"
    )
    
    tone = serializers.ChoiceField(
        choices=['professional', 'casual', 'formal', 'friendly', 'technical'],
        default='professional',
        help_text="Writing style"
    )
    
    keywords = serializers.ListField(
        child=serializers.CharField(max_length=50),
        required=False,
        allow_empty=True,
        help_text="SEO keywords (optional)"
    )
    
    destination = serializers.ChoiceField(
        choices=['direct', 'blog', 'portfolio'],
        required=False,
        default='direct',
        help_text="Content save destination: direct (display only), blog (save to blog), portfolio (save to portfolio)"
    )
    destination_data = serializers.JSONField(
        required=False,
        default=dict,
        help_text="Additional data for destination (e.g., category, tag, status)"
    )

    def validate_topic(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError(AI_ERRORS["topic_required"])
        return value.strip()
    
    def validate_word_count(self, value):
        if value < 100 or value > 2000:
            raise serializers.ValidationError(AI_ERRORS["invalid_word_count"])
        return value

    def validate_provider_name(self, value: str):
        provider_slug = (value or '').strip().lower()
        if not provider_slug:
            return None

        provider = AIProvider.objects.filter(slug=provider_slug, is_active=True).first()
        if not provider:
            raise serializers.ValidationError("Provider نامعتبر یا غیرفعال است")

        if not supports_feature(provider_slug, 'content'):
            raise serializers.ValidationError("این Provider قابلیت content را پشتیبانی نمی‌کند")

        return provider_slug

class AIContentGenerationResponseSerializer(serializers.Serializer):
    
    content = serializers.DictField(
        child=serializers.CharField(),
        help_text="Generated content data (title, content, meta_title, etc)"
    )
    
    destination = serializers.DictField(
        help_text="Destination save result (saved, destination, id, url, message)"
    )

