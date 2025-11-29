from rest_framework import serializers


class AIChatMessageSerializer(serializers.Serializer):
    
    role = serializers.ChoiceField(
        choices=['user', 'assistant'],
        required=True,
        help_text="نقش پیام: 'user' یا 'assistant'"
    )
    
    content = serializers.CharField(
        required=True,
        help_text="محتوای پیام"
    )


class AIChatRequestSerializer(serializers.Serializer):
    
    message = serializers.CharField(
        required=True,
        max_length=5000,
        help_text="پیام کاربر"
    )
    
    provider_name = serializers.ChoiceField(
        choices=['gemini', 'openai', 'deepseek', 'openrouter', 'groq', 'huggingface'],
        default='deepseek',  # Default to DeepSeek as it's free
        help_text="مدل AI برای چت"
    )
    
    conversation_history = AIChatMessageSerializer(
        many=True,
        required=False,
        allow_null=True,
        help_text="تاریخچه مکالمه قبلی (اختیاری - برای ادامه مکالمه)"
    )
    
    system_message = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
        max_length=1000,
        help_text="پیام سیستم (اختیاری - برای تنظیم شخصیت AI)"
    )
    
    temperature = serializers.FloatField(
        required=False,
        default=0.7,
        min_value=0.0,
        max_value=2.0,
        help_text="دما برای تولید پاسخ (0.0 تا 2.0)"
    )
    
    max_tokens = serializers.IntegerField(
        required=False,
        default=2048,
        min_value=100,
        max_value=4096,
        help_text="حداکثر تعداد توکن در پاسخ (100 تا 4096)"
    )
    
    def validate_message(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("پیام نمی‌تواند خالی باشد.")
        return value.strip()


class AIChatResponseSerializer(serializers.Serializer):
    
    message = serializers.CharField()
    reply = serializers.CharField()
    provider_name = serializers.CharField()
    generation_time_ms = serializers.IntegerField()

