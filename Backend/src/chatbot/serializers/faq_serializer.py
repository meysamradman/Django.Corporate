from rest_framework import serializers
from src.chatbot.models.faq import FAQ


class FAQSerializer(serializers.ModelSerializer):
    class Meta:
        model = FAQ
        fields = '__all__'
        read_only_fields = ['public_id', 'created_at', 'updated_at']
    
    def validate(self, data):
        question = data.get('question', '').strip()
        answer = data.get('answer', '').strip()
        if not question:
            raise serializers.ValidationError({"question": "سوال نمی‌تواند خالی باشد."})
        if not answer:
            raise serializers.ValidationError({"answer": "پاسخ نمی‌تواند خالی باشد."})
        return data


class FAQListSerializer(serializers.ModelSerializer):
    class Meta:
        model = FAQ
        fields = ['id', 'public_id', 'question', 'answer', 'keywords', 'order', 'is_active', 'created_at']
        read_only_fields = ['public_id', 'created_at']
