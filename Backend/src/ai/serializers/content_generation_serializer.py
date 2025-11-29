from rest_framework import serializers
from src.ai.messages.messages import AI_ERRORS


class AIContentGenerationRequestSerializer(serializers.Serializer):
    
    topic = serializers.CharField(
        required=True,
        max_length=500,
        help_text="موضوع یا عنوان محتوا"
    )
    
    provider_name = serializers.ChoiceField(
        choices=['gemini', 'openai', 'deepseek', 'openrouter', 'groq', 'huggingface'],  # Added groq and huggingface
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
    
    # ✅ Destination handling - where to save generated content
    destination = serializers.ChoiceField(
        choices=['direct', 'blog', 'portfolio'],
        required=False,
        default='direct',
        help_text="مقصد ذخیره‌سازی محتوا: direct (فقط نمایش), blog (ذخیره در بلاگ), portfolio (ذخیره در نمونه‌کار)"
    )
    destination_data = serializers.JSONField(
        required=False,
        default=dict,
        help_text="داده‌های اضافی برای مقصد (مثل دسته‌بندی، تگ، وضعیت)"
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
    
    # Content data
    content = serializers.DictField(
        child=serializers.CharField(),
        help_text="داده‌های محتوای تولید شده (title, content, meta_title, etc)"
    )
    
    # Destination result
    destination = serializers.DictField(
        help_text="نتیجه ذخیره‌سازی در مقصد (saved, destination, id, url, message)"
    )

