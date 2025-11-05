from rest_framework import serializers
from src.ai.messages.messages import AI_ERRORS


class AIContentGenerationRequestSerializer(serializers.Serializer):
    """Serializer for content generation request"""
    
    topic = serializers.CharField(
        required=True,
        max_length=500,
        help_text="موضوع یا عنوان محتوا"
    )
    
    provider_name = serializers.ChoiceField(
        choices=['gemini', 'openai', 'deepseek'],  # Added deepseek, removed huggingface due to API limitations
        default='gemini',
        help_text="مدل AI برای تولید محتوا"
    )
    
    word_count = serializers.IntegerField(
        default=500,
        min_value=100,
        max_value=2000,
        help_text="تعداد کلمات مورد نظر (100 تا 2000)"
    )
    
    tone = serializers.ChoiceField(
        choices=['professional', 'casual', 'formal', 'friendly', 'technical'],
        default='professional',
        help_text="سبک نوشتاری"
    )
    
    keywords = serializers.ListField(
        child=serializers.CharField(max_length=50),
        required=False,
        allow_empty=True,
        help_text="کلمات کلیدی برای SEO (اختیاری)"
    )
    

    
    def validate_topic(self, value):
        """Validate topic"""
        if not value or not value.strip():
            raise serializers.ValidationError(AI_ERRORS["topic_required"])
        return value.strip()
    
    def validate_word_count(self, value):
        """Validate word count"""
        if value < 100 or value > 2000:
            raise serializers.ValidationError(AI_ERRORS["invalid_word_count"])
        return value


class AIContentGenerationResponseSerializer(serializers.Serializer):
    """Serializer for content generation response"""
    
    title = serializers.CharField()
    meta_title = serializers.CharField()
    meta_description = serializers.CharField()
    slug = serializers.SlugField()
    h1 = serializers.CharField()
    content = serializers.CharField(help_text="HTML content with <p>, <h2>, <h3> tags")
    keywords = serializers.ListField(child=serializers.CharField())
    word_count = serializers.IntegerField()
    provider_name = serializers.CharField()
    generation_time_ms = serializers.IntegerField()

