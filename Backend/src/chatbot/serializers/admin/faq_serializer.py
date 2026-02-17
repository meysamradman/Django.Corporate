from rest_framework import serializers

from src.chatbot.models.faq import FAQ
from src.chatbot.messages.messages import CHATBOT_ERRORS

class FAQSerializer(serializers.ModelSerializer):
    class Meta:
        model = FAQ
        fields = '__all__'
        read_only_fields = ['public_id', 'created_at', 'updated_at']

    def validate(self, data):
        question = data.get('question', '').strip()
        answer = data.get('answer', '').strip()
        if not question:
            raise serializers.ValidationError({"question": CHATBOT_ERRORS['question_required']})
        if not answer:
            raise serializers.ValidationError({"answer": CHATBOT_ERRORS['answer_required']})
        return data

class FAQListSerializer(serializers.ModelSerializer):
    class Meta:
        model = FAQ
        fields = ['id', 'public_id', 'question', 'answer', 'keywords', 'order', 'is_active', 'created_at']
        read_only_fields = ['public_id', 'created_at']

__all__ = [
    'FAQSerializer',
    'FAQListSerializer',
]
