from rest_framework import serializers
from src.ai.messages.messages import AI_ERRORS


class AIContentGenerationRequestSerializer(serializers.Serializer):
    
    topic = serializers.CharField(
        required=True,
        max_length=500,
        help_text="Content topic or title"
    )
    
    model_id = serializers.IntegerField(
        required=False,
        allow_null=True,
        help_text="AI Model ID with 'content' capability (optional - uses active model if not provided)"
    )
    
    provider_name = serializers.ChoiceField(
        choices=['gemini', 'openai', 'deepseek', 'openrouter', 'groq', 'huggingface'],
        default='gemini',
        required=False,
        help_text="AI model for content generation (deprecated - use model_id instead)"
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


class AIContentGenerationResponseSerializer(serializers.Serializer):
    
    content = serializers.DictField(
        child=serializers.CharField(),
        help_text="Generated content data (title, content, meta_title, etc)"
    )
    
    destination = serializers.DictField(
        help_text="Destination save result (saved, destination, id, url, message)"
    )

